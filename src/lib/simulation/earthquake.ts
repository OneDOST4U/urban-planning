import distance from '@turf/distance'
import { centroid } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'
import { EARTHQUAKE_COLORS } from '@/lib/constants'
import type { BuildingCollection, EarthquakeDamage } from '@/types'

export function getEarthquakeDamage(
  building: Feature<Polygon>,
  epicenter: [number, number],
  magnitude: number,
  radiusKm: number,
): EarthquakeDamage {
  const center = centroid(building)
  const distKm = distance(epicenter, center.geometry.coordinates, { units: 'kilometers' })

  if (distKm > radiusKm) return 'minimal'

  const intensity = magnitude - distKm * 0.8

  if (intensity >= 7.5) return 'critical'
  if (intensity >= 6.5) return 'severe'
  if (intensity >= 5.5) return 'moderate'
  if (intensity >= 4.5) return 'light'
  return 'minimal'
}

export function earthquakeDamageColor(damage: EarthquakeDamage): string {
  return EARTHQUAKE_COLORS[damage]
}

export function earthquakeStatusLabel(damage: EarthquakeDamage): string {
  const labels: Record<EarthquakeDamage, string> = {
    minimal: 'Minimal',
    light: 'Light Damage',
    moderate: 'Moderate Damage',
    severe: 'Severe Damage',
    critical: 'Critical Damage',
  }
  return labels[damage]
}

export function applyEarthquakeSimulation(
  buildings: BuildingCollection,
  epicenter: [number, number] | null,
  magnitude: number,
  radiusKm: number,
): BuildingCollection {
  if (!epicenter) return buildings

  return {
    ...buildings,
    features: buildings.features.map((feature) => {
      const earthquakeDamage = getEarthquakeDamage(feature, epicenter, magnitude, radiusKm)
      return {
        ...feature,
        properties: {
          ...feature.properties,
          earthquakeDamage,
        },
      }
    }),
  }
}

export function countEarthquakeAffected(buildings: BuildingCollection): number {
  return buildings.features.filter(
    (f) => f.properties.earthquakeDamage && f.properties.earthquakeDamage !== 'minimal',
  ).length
}

export function getEarthquakeRadius(magnitude: number): number {
  return Math.max(1, (magnitude - 3) * 2.5)
}
