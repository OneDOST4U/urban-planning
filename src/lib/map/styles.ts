import type { StyleSpecification } from 'maplibre-gl'

/** MapLibre official demo tiles — reliable for local development */
export const MAPLIBRE_DEMO_STYLE = 'https://demotiles.maplibre.org/style.json'

/** OpenFreeMap — vector tiles; low-zoom raster only, vectors often blank in rural PH */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** Reliable raster basemap using OpenStreetMap tiles */
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

/**
 * Primary basemap for production: raster tiles load at all zoom levels.
 * OpenFreeMap vectors fail when zoomed into Lasam (background + beige extrusions only).
 */
export const MAP_STYLE = OSM_RASTER_STYLE

export const MAP_STYLE_CANDIDATES: Array<string | StyleSpecification> = [
  OSM_RASTER_STYLE,
  OPENFREEMAP_STYLE,
  MAPLIBRE_DEMO_STYLE,
]
