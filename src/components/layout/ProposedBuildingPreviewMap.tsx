import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createMap, createMapFallback } from '@/lib/map/createMap'
import { hideBasemapBuildings, BUILDING_COLOR, BUILDING_LIGHT } from '@/lib/map/buildingLayers'
import { createProposedBuildingCollection } from '@/lib/assessment/proposedBuilding'
import {
  getProposedBuildingDimensions,
  suggestedPreviewZoom,
} from '@/lib/assessment/buildingDimensions'
import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'

export interface ProposedBuildingPreviewMapHandle {
  captureSnapshot: () => Promise<string | null>
}

interface ProposedBuildingPreviewMapProps {
  lng: number
  lat: number
  buildingType: ProposedBuildingType
  nearbyBuildings?: FeatureCollection
  className?: string
  onReady?: () => void
}

export const ProposedBuildingPreviewMap = forwardRef<
  ProposedBuildingPreviewMapHandle,
  ProposedBuildingPreviewMapProps
>(function ProposedBuildingPreviewMap(
  { lng, lat, buildingType, nearbyBuildings, className, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      const map = mapRef.current
      if (!map) return null

      await new Promise<void>((resolve) => {
        map.once('idle', () => resolve())
        map.triggerRepaint()
      })

      try {
        return map.getCanvas().toDataURL('image/png')
      } catch {
        return null
      }
    },
  }))

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false
    const buildingData = createProposedBuildingCollection(lng, lat, buildingType)
    const nearby = nearbyBuildings ?? { type: 'FeatureCollection' as const, features: [] }

    const dims = getProposedBuildingDimensions(buildingType)
    const zoom = suggestedPreviewZoom(dims)

    const mapOptions = {
      center: [lng, lat] as [number, number],
      zoom,
      pitch: 58,
      bearing: -28,
      interactive: false,
      attributionControl: false as const,
      preserveDrawingBuffer: true,
    }

    async function init() {
      if (!containerRef.current) return
      try {
        let map = createMap({
          container: containerRef.current,
          ...mapOptions,
        })

        try {
          await new Promise<void>((resolve, reject) => {
            map.once('load', () => resolve())
            map.once('error', (e) => reject(new Error(e.error?.message ?? 'Map failed')))
          })
        } catch {
          map.remove()
          map = createMapFallback({
            container: containerRef.current,
            ...mapOptions,
          })
          await new Promise<void>((resolve, reject) => {
            map.once('load', () => resolve())
            map.once('error', (e) => reject(new Error(e.error?.message ?? 'Map failed')))
          })
        }

        if (cancelled) {
          map.remove()
          return
        }

        hideBasemapBuildings(map)
        map.setLight(BUILDING_LIGHT)

        try {
          map.addSource('lasam-dem', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15,
          })
          map.setTerrain({ source: 'lasam-dem', exaggeration: 1.2 })
        } catch {
          // optional
        }

        map.addSource('nearby-buildings', { type: 'geojson', data: nearby })
        map.addLayer({
          id: 'nearby-buildings-3d',
          type: 'fill-extrusion',
          source: 'nearby-buildings',
          paint: {
            'fill-extrusion-color': ['coalesce', ['get', 'color'], BUILDING_COLOR],
            'fill-extrusion-height': ['coalesce', ['get', 'height'], 6],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.92,
            'fill-extrusion-vertical-gradient': true,
          },
        })

        map.addSource('proposed-building', { type: 'geojson', data: buildingData })
        map.addLayer({
          id: 'proposed-building-3d',
          type: 'fill-extrusion',
          source: 'proposed-building',
          paint: {
            'fill-extrusion-color': '#FACC15',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.98,
            'fill-extrusion-vertical-gradient': true,
          },
        })
        map.addLayer({
          id: 'proposed-building-outline',
          type: 'line',
          source: 'proposed-building',
          paint: {
            'line-color': '#0f172a',
            'line-width': 2,
            'line-opacity': 0.7,
          },
        })

        // Keep proposed box building centered; nearby buildings stay as context only
        map.jumpTo({
          center: [lng, lat],
          zoom,
          pitch: 58,
          bearing: -28,
          // Pitch shifts content up — pad top so the yellow box reads centered
          padding: { top: 56, bottom: 96, left: 24, right: 24 },
        })

        map.once('idle', () => {
          if (!cancelled) onReadyRef.current?.()
        })

        mapRef.current = map
      } catch {
        // preview optional
      }
    }

    void init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className={className} />
})
