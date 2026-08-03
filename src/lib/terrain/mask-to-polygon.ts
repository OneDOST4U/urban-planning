import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { ElevationGrid } from '@/types'
import { cellCenter } from '@/lib/terrain/elevation'

/** Convert a boolean flood mask (cell indices) into GeoJSON cell polygons. */
export function maskToPolygon(
  grid: ElevationGrid,
  floodedIndices: number[],
): FeatureCollection {
  const half = grid.cellSizeDeg / 2
  const features: Feature<Polygon>[] = floodedIndices.map((idx) => {
    const [lng, lat] = cellCenter(grid, idx)
    return {
      type: 'Feature',
      properties: { cell: idx, elevation_m: grid.values[idx] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - half, lat - half],
          [lng + half, lat - half],
          [lng + half, lat + half],
          [lng - half, lat + half],
          [lng - half, lat - half],
        ]],
      },
    }
  })
  return { type: 'FeatureCollection', features }
}
