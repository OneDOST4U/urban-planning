import bbox from '@turf/bbox'
import type { FeatureCollection } from 'geojson'
import type { Map, PaddingOptions } from 'maplibre-gl'

export const LASAM_VIEW_PADDING = 56

export function getLasamBounds(boundary: FeatureCollection): [[number, number], [number, number]] {
  const [west, south, east, north] = bbox(boundary)
  return [
    [west, south],
    [east, north],
  ]
}

export function getLasamCenter(boundary: FeatureCollection): [number, number] {
  const [[west, south], [east, north]] = getLasamBounds(boundary)
  return [(west + east) / 2, (south + north) / 2]
}

/** Fit the map to the full municipal boundary (PSA Lasam polygon). */
export function fitMapToLasam(
  map: Map,
  boundary: FeatureCollection,
  options?: {
    padding?: number | PaddingOptions
    pitch?: number
    bearing?: number
    duration?: number
    maxZoom?: number
  },
): void {
  map.fitBounds(getLasamBounds(boundary), {
    padding: options?.padding ?? LASAM_VIEW_PADDING,
    pitch: options?.pitch ?? 52,
    bearing: options?.bearing ?? -20,
    duration: options?.duration ?? 0,
    maxZoom: options?.maxZoom ?? 13,
  })
}
