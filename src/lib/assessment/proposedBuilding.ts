import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { bearing, booleanIntersects, centroid, distance, point, polygon } from '@turf/turf'
import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'
import {
  getProposedBuildingDimensions,
  PROPOSED_BUILDING_COLOR,
} from '@/lib/assessment/buildingDimensions'

/**
 * Determine the dominant wall / street orientation angle (bearing in degrees)
 * from the nearest neighboring building within the block.
 */
function getDominantOrientation(
  existingBuildings: FeatureCollection | null | undefined,
  siteLng: number,
  siteLat: number,
  maxDistanceM = 150,
): number {
  if (!existingBuildings?.features?.length) return 0

  const sitePt = point([siteLng, siteLat])
  let nearestBldg: Feature | null = null
  let minDist = Infinity

  for (const f of existingBuildings.features) {
    if (
      f.geometry?.type !== 'Polygon' &&
      f.geometry?.type !== 'MultiPolygon'
    ) {
      continue
    }
    try {
      const c = centroid(f as Feature<Polygon | MultiPolygon>)
      const d = distance(sitePt, c, { units: 'meters' })
      if (d < minDist && d <= maxDistanceM) {
        minDist = d
        nearestBldg = f as Feature
      }
    } catch {
      // skip
    }
  }

  if (!nearestBldg?.geometry) return 0

  const geom = nearestBldg.geometry
  let coords: [number, number][] = []
  if (geom.type === 'Polygon') {
    coords = geom.coordinates[0] as [number, number][]
  } else if (geom.type === 'MultiPolygon') {
    coords = (geom.coordinates[0]?.[0] ?? []) as [number, number][]
  }
  if (coords.length < 2) return 0

  let maxEdgeLen = 0
  let dominantBearing = 0

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = point(coords[i])
    const p2 = point(coords[i + 1])
    const len = distance(p1, p2, { units: 'meters' })
    if (len > maxEdgeLen) {
      maxEdgeLen = len
      dominantBearing = bearing(p1, p2)
    }
  }

  return dominantBearing
}

/** Helper to construct a rotated rectangular polygon given center, dimensions, and orientation angle in degrees */
function makeFootprintPolygon(
  centerLng: number,
  centerLat: number,
  widthM: number,
  depthM: number,
  rotationDeg = 0,
): Feature<Polygon> {
  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180)
  const halfW = widthM / 2
  const halfD = depthM / 2

  const localCorners: [number, number][] = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
    [-halfW, -halfD],
  ]

  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const ring: [number, number][] = localCorners.map(([x, y]) => {
    const rx = x * cos + y * sin
    const ry = -x * sin + y * cos
    return [
      centerLng + rx / metersPerDegLng,
      centerLat + ry / metersPerDegLat,
    ]
  })

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
 * Find the optimal non-overlapping position & dimensions for the proposed building,
 * aligning with the dominant orientation of neighboring buildings.
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
  rotationDeg: number
} {
  const rotationDeg = getDominantOrientation(existingBuildings, requestedLng, requestedLat)

  // 1. If no overlap at exact location with uniform orientation, return immediately
  const initial = makeFootprintPolygon(requestedLng, requestedLat, baseWidthM, baseDepthM, rotationDeg)
  if (!existingBuildings?.features?.length || !hasOverlap(initial, existingBuildings)) {
    return {
      featurePolygon: initial,
      finalCenter: [requestedLng, requestedLat],
      finalWidthM: baseWidthM,
      finalDepthM: baseDepthM,
      rotationDeg,
    }
  }

  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((requestedLat * Math.PI) / 180)

  // Radial search distances (meters) and 16 compass angles
  const searchDistances = [1.5, 3, 5, 7, 9, 12, 15, 18, 22, 26, 30, 36, 42, 50]
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
      const centerCand = makeFootprintPolygon(requestedLng, requestedLat, w, d, rotationDeg)
      if (!hasOverlap(centerCand, existingBuildings)) {
        return {
          featurePolygon: centerCand,
          finalCenter: [requestedLng, requestedLat],
          finalWidthM: w,
          finalDepthM: d,
          rotationDeg,
        }
      }
    }

    // Search outward along radial directions
    for (const distM of searchDistances) {
      for (const deg of angles) {
        const rad = (deg * Math.PI) / 180
        const candLng = requestedLng + (distM * Math.sin(rad)) / metersPerDegLng
        const candLat = requestedLat + (distM * Math.cos(rad)) / metersPerDegLat

        const candidate = makeFootprintPolygon(candLng, candLat, w, d, rotationDeg)
        if (!hasOverlap(candidate, existingBuildings)) {
          return {
            featurePolygon: candidate,
            finalCenter: [candLng, candLat],
            finalWidthM: w,
            finalDepthM: d,
            rotationDeg,
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
    rotationDeg,
  }
}

/** Build a rectangular footprint centered on [lng, lat] oriented uniformly with neighboring buildings and avoiding collisions. */
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
      rotation_deg: Number(resolved.rotationDeg.toFixed(1)),
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
