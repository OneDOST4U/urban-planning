import circle from '@turf/circle'
import distance from '@turf/distance'
import { centroid } from '@turf/turf'
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson'
import type { BuildingCollection } from '@/types'

/** Smithsonian GVP / PHIVOLCS-listed summit area — Gonzaga, Cagayan */
export const CAGUA_CENTER: [number, number] = [122.123, 18.222]
export const CAGUA_NAME = 'Cagua Volcano'
export const CAGUA_META = {
  municipality: 'Gonzaga',
  province: 'Cagayan',
  elevationM: 1133,
  volcanoType: 'Stratovolcano',
  lastEruption: '1860 CE (phreatic)',
  dataSource: 'PHIVOLCS / Smithsonian GVP (demonstration)',
} as const

/** Demo distance bands (km) — not official PHIVOLCS hazard zones */
export const VOLCANO_RING_KM = [10, 20, 30, 50] as const

import type { VolcanoExposure } from '@/types'

export type { VolcanoExposure }

export const VOLCANO_COLORS: Record<VolcanoExposure, string> = {
  none: '#94a3b8',
  low: '#fde047',
  moderate: '#fb923c',
  high: '#ef4444',
  severe: '#7f1d1d',
}

export function volcanoExposureFromDistanceKm(distKm: number): VolcanoExposure {
  if (distKm <= 10) return 'severe'
  if (distKm <= 20) return 'high'
  if (distKm <= 30) return 'moderate'
  if (distKm <= 50) return 'low'
  return 'none'
}

export function volcanoStatusLabel(exposure: VolcanoExposure): string {
  const labels: Record<VolcanoExposure, string> = {
    none: '> 50 km from Cagua',
    low: 'Low (outer buffer)',
    moderate: 'Moderate buffer',
    high: 'High buffer',
    severe: 'Severe / near-vent',
  }
  return labels[exposure]
}

export function getDistanceFromVolcanoKm(
  building: Feature<Polygon>,
  volcano: [number, number] = CAGUA_CENTER,
): number {
  const center = centroid(building)
  return Number(distance(volcano, center.geometry.coordinates, { units: 'kilometers' }).toFixed(2))
}

export function createVolcanoRings(
  center: [number, number] = CAGUA_CENTER,
  radiiKm: readonly number[] = VOLCANO_RING_KM,
): FeatureCollection {
  const features: Feature<Polygon>[] = radiiKm.map((km, index) => {
    const ring = circle(center, km, { units: 'kilometers', steps: 72 })
    ring.properties = {
      radius_km: km,
      ringIndex: index,
      name: `${CAGUA_NAME} ${km} km buffer`,
      opacity: 0.05 + (radiiKm.length - index) * 0.03,
    }
    return ring
  })
  return { type: 'FeatureCollection', features }
}

export function createVolcanoPointFeature(
  center: [number, number] = CAGUA_CENTER,
): Feature<Point> {
  return {
    type: 'Feature',
    properties: {
      id: 'PHIVOLCS-CAGUA',
      name: CAGUA_NAME,
      ...CAGUA_META,
    },
    geometry: { type: 'Point', coordinates: center },
  }
}

/** Attach distance and demo exposure tier to each building. */
export function applyVolcanoDistances(
  buildings: BuildingCollection,
  volcano: [number, number] = CAGUA_CENTER,
): BuildingCollection {
  return {
    ...buildings,
    features: buildings.features.map((feature) => {
      const volcanoDistanceKm = getDistanceFromVolcanoKm(feature, volcano)
      const volcanoExposure = volcanoExposureFromDistanceKm(volcanoDistanceKm)

      return {
        ...feature,
        properties: {
          ...feature.properties,
          volcanoDistanceKm,
          volcanoExposure,
        },
      }
    }),
  }
}
