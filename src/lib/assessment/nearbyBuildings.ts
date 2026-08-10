import { centroid, distance, point } from '@turf/turf'
import type { Feature, FeatureCollection } from 'geojson'
import type { BuildingCollection } from '@/types'

const emptyFc: FeatureCollection = { type: 'FeatureCollection', features: [] }

const DEFAULT_RADIUS_M = 220
const MAX_NEARBY = 100

/** Buildings within radius of the proposed site (for report map preview). */
export function getNearbyBuildings(
  buildings: BuildingCollection | null | undefined,
  lng: number,
  lat: number,
  radiusM = DEFAULT_RADIUS_M,
): FeatureCollection {
  if (!buildings?.features?.length) return emptyFc

  const site = point([lng, lat])
  const ranked = buildings.features
    .map((feature) => {
      const center = centroid(feature as Feature)
      const d = distance(site, center, { units: 'meters' })
      return { feature: feature as Feature, d }
    })
    .filter(({ d }) => d <= radiusM && d > 2)
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_NEARBY)
    .map(({ feature }) => feature)

  return { type: 'FeatureCollection', features: ranked }
}
