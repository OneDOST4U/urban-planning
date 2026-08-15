import type { StyleSpecification } from 'maplibre-gl'
import { CARTO_RASTER_TILES } from '@/lib/map/basemapUnderlay'

/** MapLibre official demo tiles — reliable for local development */
export const MAPLIBRE_DEMO_STYLE = 'https://demotiles.maplibre.org/style.json'

/** OpenFreeMap — vector style with natural-earth low zoom + OSM vectors */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** Full raster fallback when the vector style JSON cannot load */
export const CARTO_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: CARTO_RASTER_TILES,
      tileSize: 256,
      maxzoom: 20,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [
    {
      id: 'carto-tiles',
      type: 'raster',
      source: 'carto',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

/** @deprecated Use CARTO_RASTER_STYLE — OSM direct tiles block many production referrers */
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

/** Vector basemap; pair with installRasterUnderlay() for production reliability */
export const MAP_STYLE = OPENFREEMAP_STYLE

export const MAP_STYLE_CANDIDATES: Array<string | StyleSpecification> = [
  OPENFREEMAP_STYLE,
  CARTO_RASTER_STYLE,
  MAPLIBRE_DEMO_STYLE,
  OSM_RASTER_STYLE,
]
