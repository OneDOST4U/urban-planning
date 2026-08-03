import type { StyleSpecification } from 'maplibre-gl'

/** MapLibre official demo tiles — reliable for local development */
export const MAPLIBRE_DEMO_STYLE = 'https://demotiles.maplibre.org/style.json'

/** OpenFreeMap — vector tiles with native 3D building extrusions */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** Primary map style: vector basemap with extrudable building footprints */
export const MAP_STYLE = OPENFREEMAP_STYLE

/** Offline-safe raster fallback using OpenStreetMap tiles */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export const MAP_STYLE_CANDIDATES: Array<string | StyleSpecification> = [
  OSM_RASTER_STYLE,
  MAPLIBRE_DEMO_STYLE,
  OPENFREEMAP_STYLE,
]
