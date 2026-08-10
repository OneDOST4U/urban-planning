import distance from '@turf/distance'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import bearing from '@turf/bearing'
import { centroid, multiLineString, point } from '@turf/turf'
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
} from 'geojson'
import type { BuildingCollection } from '@/types'

export interface NearestFaultResult {
  distanceM: number
  distanceKm: number
  faultName: string
  faultClass: string
  bearing: number
  nearestPoint: [number, number]
}

function collectLineCoords(
  faults: FeatureCollection | Feature<LineString> | null | undefined,
): number[][][] {
  if (!faults) return []

  const features =
    faults.type === 'FeatureCollection'
      ? faults.features
      : faults.type === 'Feature'
        ? [faults]
        : []

  const lines: number[][][] = []
  for (const feature of features) {
    if (!feature?.geometry) continue
    if (feature.geometry.type === 'LineString') {
      if (feature.geometry.coordinates.length >= 2) {
        lines.push(feature.geometry.coordinates)
      }
    } else if (feature.geometry.type === 'MultiLineString') {
      for (const coords of feature.geometry.coordinates) {
        if (coords.length >= 2) lines.push(coords)
      }
    }
  }
  return lines
}

function simplifyLine(coords: number[][], maxPoints = 40): number[][] {
  if (coords.length <= maxPoints) return coords
  const step = Math.ceil(coords.length / maxPoints)
  const out: number[][] = []
  for (let i = 0; i < coords.length; i += step) out.push(coords[i])
  const last = coords[coords.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

/** Combine all fault segments into one MultiLineString for a single nearest-distance query. */
export function faultsToMultiLine(
  faults: FeatureCollection | Feature<LineString> | null | undefined,
): Feature<MultiLineString> | null {
  const lines = collectLineCoords(faults)
  if (lines.length === 0) return null
  return multiLineString(lines.map((line) => simplifyLine(line)))
}

export function getDistanceFromFault(
  building: Feature<Polygon>,
  faultLine: Feature<LineString | MultiLineString>,
): number {
  const center = centroid(building)
  const nearest = nearestPointOnLine(faultLine, center)
  return Math.round(distance(center, nearest, { units: 'meters' }))
}

/** Minimum distance from building centroid to any fault segment (meters). */
export function getDistanceFromFaults(
  building: Feature<Polygon>,
  faults: FeatureCollection | Feature<LineString> | null,
): number | undefined {
  const multi = faultsToMultiLine(faults)
  if (!multi) return undefined
  return getDistanceFromFault(building, multi)
}

/**
 * Nearest fault segment to an arbitrary map point (site assessment).
 * Optionally restrict to Active / Potentially Active via `faultClass`.
 */
export function getNearestFaultSegment(
  coords: [number, number],
  faults: FeatureCollection | Feature<LineString> | null,
  faultClass?: 'Active' | 'Potentially Active',
): NearestFaultResult | null {
  if (!faults) return null

  const features =
    faults.type === 'FeatureCollection'
      ? faults.features
      : faults.type === 'Feature'
        ? [faults]
        : []

  const site = point(coords)
  let best: NearestFaultResult | null = null

  for (const feature of features) {
    if (!feature?.geometry) continue
    const cls = String(feature.properties?.fault_class ?? 'Active')
    if (faultClass && cls !== faultClass) continue

    const geom = feature.geometry
    if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') continue

    const nearest = nearestPointOnLine(feature as Feature<LineString | MultiLineString>, site)
    const distM = Math.round(distance(site, nearest, { units: 'meters' }))
    if (best && distM >= best.distanceM) continue

    const nearCoords = nearest.geometry.coordinates as [number, number]
    const brg = bearing(site, point(nearCoords))
    const name = String(
      feature.properties?.fault_name ?? feature.properties?.name ?? 'PHIVOLCS Fault',
    )

    best = {
      distanceM: distM,
      distanceKm: Number((distM / 1000).toFixed(1)),
      faultName: name,
      faultClass: cls,
      bearing: brg,
      nearestPoint: nearCoords,
    }
  }

  return best
}

/** Attach nearest-fault distance (meters) to each building for info panels. */
export function applyFaultDistances(
  buildings: BuildingCollection,
  faults: FeatureCollection | Feature<LineString> | null,
): BuildingCollection {
  const multi = faultsToMultiLine(faults)
  if (!multi) return buildings

  return {
    ...buildings,
    features: buildings.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        faultDistance: getDistanceFromFault(feature, multi),
      },
    })),
  }
}
