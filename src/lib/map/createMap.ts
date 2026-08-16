import * as maplibregl from 'maplibre-gl'
import type { Map, MapOptions, StyleSpecification } from 'maplibre-gl'
import { installRasterUnderlay } from '@/lib/map/basemapUnderlay'
import { CARTO_RASTER_STYLE, MAP_STYLE } from '@/lib/map/styles'

export function createMap(options: Omit<MapOptions, 'style'> & { container: HTMLElement }): Map {
  return new maplibregl.Map({
    ...options,
    style: MAP_STYLE,
  })
}

/** Carto raster is the primary style — no vector underlay needed. */
export function prepareBasemap(map: Map): void {
  if (typeof map.getStyle().sources?.openmaptiles !== 'undefined') {
    installRasterUnderlay(map)
  }
}

/** Full raster basemap if the vector style JSON cannot load. */
export function createMapFallback(options: Omit<MapOptions, 'style'> & { container: HTMLElement }): Map {
  return new maplibregl.Map({
    ...options,
    style: CARTO_RASTER_STYLE,
  })
}

export function createMapWithStyle(
  style: string | StyleSpecification,
  options: Omit<MapOptions, 'style'> & { container: HTMLElement },
): Map {
  return new maplibregl.Map({ ...options, style })
}

export { CARTO_RASTER_STYLE as OSM_RASTER_STYLE }

export function bindMapResize(map: Map, container: HTMLElement): () => void {
  let active = true

  const resize = () => {
    if (active) map.resize()
  }

  resize()
  window.addEventListener('resize', resize)

  const observer = new ResizeObserver(resize)
  observer.observe(container)

  map.once('idle', resize)

  return () => {
    active = false
    window.removeEventListener('resize', resize)
    observer.disconnect()
  }
}
