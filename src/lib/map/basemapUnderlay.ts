import type { Map } from 'maplibre-gl'

/** Production-safe raster tiles (Carto CDN). OSM direct tiles often block non-localhost referrers. */
export const CARTO_RASTER_TILES = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
]

const UNDERLAY_SOURCE = 'basemap-raster-underlay'
const UNDERLAY_LAYER = 'basemap-raster-underlay'

/**
 * Insert a reliable raster underlay beneath vector style layers.
 * When OpenFreeMap vectors fail at high zoom (common on Vercel / rural PH),
 * Carto tiles remain visible instead of a blank beige background.
 */
export function installRasterUnderlay(map: Map): void {
  if (map.getSource(UNDERLAY_SOURCE)) return

  map.addSource(UNDERLAY_SOURCE, {
    type: 'raster',
    tiles: CARTO_RASTER_TILES,
    tileSize: 256,
    maxzoom: 20,
    attribution: '© OpenStreetMap © CARTO',
  })

  const anchor = map.getStyle().layers[0]?.id
  map.addLayer(
    {
      id: UNDERLAY_LAYER,
      type: 'raster',
      source: UNDERLAY_SOURCE,
      minzoom: 0,
      maxzoom: 22,
    },
    anchor,
  )

  if (map.getLayer('background')) {
    map.setPaintProperty('background', 'background-color', 'transparent')
  }
}
