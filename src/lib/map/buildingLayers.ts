import type { Map } from 'maplibre-gl'

/** Hide native vector-tile buildings so only our GeoJSON footprints are extruded. */
export function hideBasemapBuildings(map: Map): void {
  if (map.getLayer('building')) {
    map.setLayoutProperty('building', 'visibility', 'none')
  }
  if (map.getLayer('building-3d')) {
    map.setLayoutProperty('building-3d', 'visibility', 'none')
  }
}

export const GIS_BUILDING_LAYERS = ['buildings-footprint', 'buildings-3d', 'buildings-outline'] as const
