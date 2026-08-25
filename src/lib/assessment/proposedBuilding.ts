import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { booleanIntersects, polygon } from '@turf/turf'
import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'
import {
  getProposedBuildingDimensions,
  PROPOSED_BUILDING_COLOR,
} from '@/lib/assessment/buildingDimensions'

/** Helper to construct a rectangular polygon given center and dimensions in meters */
function makeFootprintPolygon(
  centerLng: number,
  centerLat: number,
  widthM: number,
  depthM: number,
): Feature<Polygon> {
  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180)
  const halfW = widthM / 2 / metersPerDegLng
  const halfD = depthM / 2 / metersPerDegLat

  const ring: [number, number][] = [
    [centerLng - halfW, centerLat - halfD],
    [centerLng + halfW, centerLat - halfD],
    [centerLng + halfW, centerLat + halfD],
    [centerLng - halfW, centerLat + halfD],
    [centerLng - halfW, centerLat - halfD],
  ]

  return polygon([ring]) as Feature<Polygon>
}

/** Check whether a candidate footprint collides/overlaps with any existing building */
function hasOverlap(
  candidate: Feature<Polygon>,
  existingBuildings: FeatureCollection | null | undefined,
): boolean {
  if (!existingBuildings?.features?.length) return false

  for (const f of existingBuildings.features) {
    if (
      f.geometry?.type !== 'Polygon' &&
      f.geometry?.type !== 'MultiPolygon'
    ) {
      continue
    }
    try {
      if (booleanIntersects(candidate, f as Feature<Polygon | MultiPolygon>)) {
        return true
      }
    } catch {
      // skip invalid geometry
    }
  }
  return false
}

/**
 * Find the optimal non-overlapping position & dimensions for the proposed building.
 * If the requested center collides with an existing building, searches adjacent open lot space.
 */
function resolveNonOverlappingFootprint(
  requestedLng: number,
  requestedLat: number,
  baseWidthM: number,
  baseDepthM: number,
  existingBuildings?: FeatureCollection | null,
): {
  featurePolygon: Feature<Polygon>
  finalCenter: [number, number]
  finalWidthM: number
  finalDepthM: number
} {
  // 1. If no overlap at exact location, return immediately
  const initial = makeFootprintPolygon(requestedLng, requestedLat, baseWidthM, baseDepthM)
  if (!existingBuildings?.features?.length || !hasOverlap(initial, existingBuildings)) {
    return {
      featurePolygon: initial,
      finalCenter: [requestedLng, requestedLat],
      finalWidthM: baseWidthM,
      finalDepthM: baseDepthM,
    }
  }

  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((requestedLat * Math.PI) / 180)

  // Radial search distances (meters) and 16 compass angles
  const searchDistances = [2, 4, 6, 8, 10, 12, 15, 18, 22, 26, 30, 36, 42, 50]
  const angles = [
    0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5,
  ]

  // Scales to adaptively fit constrained lot sizes if full size doesn't fit in close vicinity
  const scaleFactors = [1.0, 0.9, 0.8, 0.7, 0.6]

  for (const scale of scaleFactors) {
    const w = baseWidthM * scale
    const d = baseDepthM * scale

    // Check if scaled version fits at original center
    if (scale < 1.0) {
      const centerCand = makeFootprintPolygon(requestedLng, requestedLat, w, d)
      if (!hasOverlap(centerCand, existingBuildings)) {
        return {
          featurePolygon: centerCand,
          finalCenter: [requestedLng, requestedLat],
          finalWidthM: w,
          finalDepthM: d,
        }
      }
    }

    // Search outward along radial directions
    for (const distM of searchDistances) {
      for (const deg of angles) {
        const rad = (deg * Math.PI) / 180
        const candLng = requestedLng + (distM * Math.sin(rad)) / metersPerDegLng
        const candLat = requestedLat + (distM * Math.cos(rad)) / metersPerDegLat

        const candidate = makeFootprintPolygon(candLng, candLat, w, d)
        if (!hasOverlap(candidate, existingBuildings)) {
          return {
            featurePolygon: candidate,
            finalCenter: [candLng, candLat],
            finalWidthM: w,
            finalDepthM: d,
          }
        }
      }
    }
  }

  // Fallback if all else fails
  return {
    featurePolygon: initial,
    finalCenter: [requestedLng, requestedLat],
    finalWidthM: baseWidthM,
    finalDepthM: baseDepthM,
  }
}

/** Build a north-aligned rectangular footprint centered on [lng, lat], automatically avoiding collisions with nearby existing buildings. */
export function createProposedBuildingFeature(
  lng: number,
  lat: number,
  buildingType: ProposedBuildingType,
  existingBuildings?: FeatureCollection | null,
): Feature<Polygon> {
  const dims = getProposedBuildingDimensions(buildingType)
  const resolved = resolveNonOverlappingFootprint(
    lng,
    lat,
    dims.widthM,
    dims.depthM,
    existingBuildings,
  )

  return {
    type: 'Feature',
    properties: {
      id: 'proposed-building',
      name: buildingType,
      type: buildingType,
      floors: dims.floors,
      height: dims.heightM,
      width_m: Number(resolved.finalWidthM.toFixed(1)),
      depth_m: Number(resolved.finalDepthM.toFixed(1)),
      color: PROPOSED_BUILDING_COLOR,
      center: resolved.finalCenter,
    },
    geometry: resolved.featurePolygon.geometry,
  }
}

export function createProposedBuildingCollection(
  lng: number,
  lat: number,
  buildingType: ProposedBuildingType,
  existingBuildings?: FeatureCollection | null,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [createProposedBuildingFeature(lng, lat, buildingType, existingBuildings)],
  }
}
