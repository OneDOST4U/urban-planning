import circle from '@turf/circle'
import type { Feature, Polygon } from 'geojson'

export function createEarthquakeRings(
  epicenter: [number, number],
  radiusKm: number,
): Feature<Polygon>[] {
  const fractions = [0.25, 0.5, 0.75, 1]
  return fractions.map((fraction, index) => {
    const ring = circle(epicenter, radiusKm * fraction, { units: 'kilometers', steps: 64 })
    ring.properties = {
      ringIndex: index,
      opacity: 0.08 + index * 0.04,
    }
    return ring
  })
}

export function floodVisualHeight(depthMeters: number): number {
  return Math.max(0, depthMeters * 2.5)
}
