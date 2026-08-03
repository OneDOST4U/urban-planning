import buffer from '@turf/buffer'
import distance from '@turf/distance'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import { centroid, lineString } from '@turf/turf'
import type { Feature, LineString, Polygon } from 'geojson'
import type { BuildingCollection } from '@/types'

export function createFaultBuffer(
  faultLine: Feature<LineString>,
  bufferMeters: number,
): Feature<Polygon> {
  return buffer(faultLine, bufferMeters, { units: 'meters' }) as Feature<Polygon>
}

export function getDistanceFromFault(
  building: Feature<Polygon>,
  faultLine: Feature<LineString>,
): number {
  const center = centroid(building)
  const line = lineString(faultLine.geometry.coordinates)
  const nearest = nearestPointOnLine(line, center)
  return Math.round(distance(center, nearest, { units: 'meters' }))
}

export function applyFaultExposure(
  buildings: BuildingCollection,
  faultLine: Feature<LineString> | null,
  bufferMeters: number,
): { buildings: BuildingCollection; exposedCount: number; buffer: Feature<Polygon> | null } {
  if (!faultLine) {
    return { buildings, exposedCount: 0, buffer: null }
  }

  const faultBuffer = createFaultBuffer(faultLine, bufferMeters)
  let exposedCount = 0

  const updated = {
    ...buildings,
    features: buildings.features.map((feature) => {
      const faultDistance = getDistanceFromFault(feature, faultLine)
      const isExposed = faultDistance <= bufferMeters
      if (isExposed) exposedCount += 1

      return {
        ...feature,
        properties: {
          ...feature.properties,
          faultDistance,
        },
      }
    }),
  }

  return { buildings: updated, exposedCount, buffer: faultBuffer }
}
