import * as maplibregl from 'maplibre-gl'
import type { Map, MapOptions } from 'maplibre-gl'
import { OPENFREEMAP_STYLE, OSM_RASTER_STYLE } from '@/lib/map/styles'

export function createMap(options: Omit<MapOptions, 'style'> & { container: HTMLElement }): Map {
  return new maplibregl.Map({
    ...options,
    style: OPENFREEMAP_STYLE,
  })
}

export function createMapFallback(options: Omit<MapOptions, 'style'> & { container: HTMLElement }): Map {
  return new maplibregl.Map({
    ...options,
    style: OSM_RASTER_STYLE,
  })
}

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
