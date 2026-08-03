import { useCallback, useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import distance from '@turf/distance'
import { point } from '@turf/turf'
import { LASAM_CENTER, DEFAULT_ZOOM } from '@/lib/constants'
import { createMap, createMapFallback, bindMapResize } from '@/lib/map/createMap'
import { GIS_BUILDING_LAYERS, hideBasemapBuildings } from '@/lib/map/buildingLayers'
import { createEarthquakeRings, floodVisualHeight } from '@/lib/map/visuals'
import { buildTerrainSample } from '@/lib/terrain/elevation'
import { getBuildingColor } from '@/lib/simulation/stats'
import { MapLegend } from '@/components/map/MapLegend'
import { TerrainInfoBar } from '@/components/map/TerrainInfoBar'
import type {
  BuildingCollection,
  ElevationGrid,
  HazardMode,
  MapTool,
  RiverSettings,
  TerrainSample,
  TerrainSettings,
} from '@/types'
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson'
import type { SelectedRiver } from '@/components/layout/RiverInfoCard'

interface MapViewProps {
  buildings: BuildingCollection
  boundary: FeatureCollection
  riversMain: FeatureCollection
  riversTributaries: FeatureCollection
  drainage: FeatureCollection
  riverbanks: FeatureCollection
  watersheds: FeatureCollection
  flowArrows: FeatureCollection
  contours: FeatureCollection
  elevationGrid: ElevationGrid | null
  inundation: FeatureCollection | null
  waterSurfaceM: number
  floodZone: Feature<Polygon> | null
  faultLine: Feature<LineString> | null
  faultBuffer: Feature<Polygon> | null
  epicenter: [number, number] | null
  earthquakeRadius: number
  earthquakeMagnitude: number
  hazardMode: HazardMode
  activeTool: MapTool
  is3D: boolean
  isPlaying: boolean
  floodDepth: number
  floodOpacity: number
  selectedBuildingId: string | null
  layerVisibility: Record<string, boolean>
  terrainSettings: TerrainSettings
  riverSettings: RiverSettings
  onBuildingSelect: (buildingId: string | null) => void
  onRiverSelect: (river: SelectedRiver | null) => void
  onEpicenterPlace: (coords: [number, number]) => void
  onFaultLineDrawn: (line: Feature<LineString>) => void
  onMeasureUpdate: (value: string | null) => void
  onMapReady?: () => void
}

export function MapView({
  buildings,
  boundary,
  riversMain,
  riversTributaries,
  drainage,
  riverbanks,
  watersheds,
  flowArrows,
  contours,
  elevationGrid,
  inundation,
  waterSurfaceM,
  floodZone,
  faultLine,
  faultBuffer,
  epicenter,
  earthquakeRadius,
  earthquakeMagnitude,
  hazardMode,
  activeTool,
  is3D,
  isPlaying,
  floodDepth,
  floodOpacity,
  selectedBuildingId,
  layerVisibility,
  terrainSettings,
  riverSettings,
  onBuildingSelect,
  onRiverSelect,
  onEpicenterPlace,
  onFaultLineDrawn,
  onMeasureUpdate,
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const drawPointsRef = useRef<[number, number][]>([])
  const isDrawingRef = useRef(false)
  const measurePointsRef = useRef<[number, number][]>([])
  const shakeFrameRef = useRef<number | null>(null)
  const terrainAlignedRef = useRef<globalThis.Map<string, number>>(new globalThis.Map())
  const terrainAlignedOnceRef = useRef(false)

  const [toolHint, setToolHint] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [terrainSample, setTerrainSample] = useState<TerrainSample | null>(null)

  const applyLayerVisibility = useCallback((map: Map) => {
    const layerMap: Record<string, string[]> = {
      boundary: ['boundary-fill', 'boundary-line'],
      buildings: [...GIS_BUILDING_LAYERS],
      flood: ['flood-zone-fill', 'flood-water-3d'],
      fault: ['fault-line', 'fault-buffer-fill'],
      epicenter: ['epicenter-rings', 'epicenter-point'],
      hillshade: ['hillshade'],
      contours: ['contours'],
      riversMain: ['rivers-main'],
      riversTributaries: ['rivers-tributaries'],
      drainage: ['drainage'],
      riverbanks: ['riverbanks-fill', 'riverbanks-line'],
      watershed: ['watershed-fill', 'watershed-line'],
      flowArrows: ['flow-arrows'],
    }

    for (const [key, layers] of Object.entries(layerMap)) {
      let visible = layerVisibility[key] ?? true
      if (key === 'hillshade') visible = terrainSettings.hillshade
      if (key === 'contours') visible = terrainSettings.contours
      if (key === 'riversMain') visible = riverSettings.main
      if (key === 'riversTributaries') visible = riverSettings.tributaries
      if (key === 'drainage') visible = riverSettings.drainage
      if (key === 'riverbanks') visible = riverSettings.riverbanks
      if (key === 'watershed') visible = riverSettings.watershed
      if (key === 'flowArrows') visible = riverSettings.flowArrows
      for (const layerId of layers) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
        }
      }
    }
  }, [layerVisibility, terrainSettings, riverSettings])

  const addBuildingLayers = useCallback((map: Map) => {
    map.addSource('buildings', { type: 'geojson', data: buildings })

    // Flat fill drapes on terrain and reads as dark “shadows” under 3D boxes — keep hidden
    // whenever extrusions are shown. Useful only as a 2D fallback when 3D is off.
    map.addLayer({
      id: 'buildings-footprint',
      type: 'fill',
      source: 'buildings',
      layout: {
        visibility: is3D || terrainSettings.terrain3d ? 'none' : 'visible',
      },
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'selected'], 1],
          '#3b82f6',
          ['coalesce', ['get', 'color'], ['get', 'baseColor'], '#b8bcc4'],
        ],
        'fill-opacity': 0.55,
      },
    })
    map.addLayer({
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'buildings',
      layout: {
        visibility: is3D || terrainSettings.terrain3d ? 'visible' : 'none',
      },
      paint: {
        'fill-extrusion-color': [
          'case',
          ['==', ['get', 'selected'], 1],
          '#2563eb',
          ['coalesce', ['get', 'color'], ['get', 'baseColor'], '#b8bcc4'],
        ],
        // Absolute ASL to match MapLibre terrain; ground_elevation_m is synced to
        // queryTerrainElevation when terrain tiles are ready (see align effect).
        'fill-extrusion-height': [
          '+',
          ['coalesce', ['get', 'ground_elevation_m'], 0],
          ['get', 'height'],
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'ground_elevation_m'], 0],
        'fill-extrusion-opacity': 0.96,
        'fill-extrusion-vertical-gradient': true,
      },
    })
    map.addLayer({
      id: 'buildings-outline',
      type: 'line',
      source: 'buildings',
      layout: {
        // Outline on terrain also creates a dark “ghost” under floating boxes
        visibility: is3D || terrainSettings.terrain3d ? 'none' : 'visible',
      },
      paint: {
        'line-color': '#6b7280',
        'line-width': 0.5,
        'line-opacity': 0.5,
      },
    })
  }, [buildings, is3D, terrainSettings.terrain3d])

  const updateBuildingColors = useCallback(() => {
    const map = mapRef.current
    if (!map?.getSource('buildings')) return

    const aligned = terrainAlignedRef.current

    const colored = {
      ...buildings,
      features: buildings.features.map((f) => {
        const terrainGround = aligned.get(f.properties.id)
        const ground = terrainGround ?? f.properties.ground_elevation_m
        const height = f.properties.height ?? 3
        return {
          ...f,
          properties: {
            ...f.properties,
            ground_elevation_m: ground,
            roof_elevation_m:
              ground != null ? Number((ground + height).toFixed(2)) : f.properties.roof_elevation_m,
            color: getBuildingColor(
              f.properties.floodExposure,
              f.properties.earthquakeDamage,
              f.properties.faultDistance,
              hazardMode,
              f.properties.baseColor,
              f.properties.type,
            ),
            selected: f.properties.id === selectedBuildingId ? 1 : 0,
          },
        }
      }),
    }

    ;(map.getSource('buildings') as maplibregl.GeoJSONSource).setData(colored as GeoJSON.FeatureCollection)
  }, [buildings, hazardMode, selectedBuildingId])

  const flyToBuilding = useCallback((buildingId: string) => {
    const map = mapRef.current
    const feature = buildings.features.find((f) => f.properties.id === buildingId)
    if (!map || !feature) return

    const coords = feature.geometry.coordinates[0]
    const lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length
    const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length

    map.flyTo({ center: [lng, lat], zoom: 17, pitch: is3D ? 55 : 0, duration: 900 })
  }, [buildings, is3D])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let unbindResize: (() => void) | undefined
    let cancelled = false

    async function initMap() {
      if (!containerRef.current) return

      try {
        let map = createMap({
          container: containerRef.current,
          center: LASAM_CENTER,
          zoom: DEFAULT_ZOOM,
          pitch: 52,
          bearing: -20,
        })

        if (cancelled) {
          map.remove()
          return
        }

        try {
          await new Promise<void>((resolve, reject) => {
            map.once('load', () => resolve())
            map.once('error', (e) => reject(new Error(e.error?.message ?? 'Map failed to load')))
          })
        } catch {
          map.remove()
          map = createMapFallback({
            container: containerRef.current,
            center: LASAM_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: 52,
            bearing: -20,
          })
          await new Promise<void>((resolve, reject) => {
            map.once('load', () => resolve())
            map.once('error', (e) => reject(new Error(e.error?.message ?? 'Map failed to load')))
          })
        }

        if (cancelled) {
          map.remove()
          return
        }

        hideBasemapBuildings(map)
        unbindResize = bindMapResize(map, containerRef.current)
        map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left')

        // Terrain DEM (AWS Terrarium)
        try {
          map.addSource('lasam-dem', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15,
          })
          if (terrainSettings.terrain3d) {
            map.setTerrain({ source: 'lasam-dem', exaggeration: terrainSettings.exaggeration })
          }
          map.addLayer({
            id: 'hillshade',
            type: 'hillshade',
            source: 'lasam-dem',
            paint: {
              'hillshade-exaggeration': 0.45,
              'hillshade-shadow-color': '#1e293b',
              'hillshade-highlight-color': '#f8fafc',
            },
            layout: { visibility: terrainSettings.hillshade ? 'visible' : 'none' },
          })
        } catch {
          // Terrain optional if style/source fails
        }

        map.addSource('boundary', { type: 'geojson', data: boundary })
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.06 },
        })
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: {
            'line-color': '#0369a1',
            'line-width': 2.5,
            'line-opacity': 0.85,
            'line-dasharray': [4, 2],
          },
        })

        map.addSource('watersheds', { type: 'geojson', data: watersheds })
        map.addLayer({
          id: 'watershed-fill',
          type: 'fill',
          source: 'watersheds',
          paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.04 },
          layout: { visibility: riverSettings.watershed ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'watershed-line',
          type: 'line',
          source: 'watersheds',
          paint: { 'line-color': '#0284c7', 'line-width': 1.5, 'line-dasharray': [3, 2] },
          layout: { visibility: riverSettings.watershed ? 'visible' : 'none' },
        })

        map.addSource('riverbanks', { type: 'geojson', data: riverbanks })
        map.addLayer({
          id: 'riverbanks-fill',
          type: 'fill',
          source: 'riverbanks',
          paint: { 'fill-color': '#7dd3fc', 'fill-opacity': 0.25 },
          layout: { visibility: riverSettings.riverbanks ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'riverbanks-line',
          type: 'line',
          source: 'riverbanks',
          paint: { 'line-color': '#0369a1', 'line-width': 1 },
          layout: { visibility: riverSettings.riverbanks ? 'visible' : 'none' },
        })

        map.addSource('rivers-main', { type: 'geojson', data: riversMain })
        map.addLayer({
          id: 'rivers-main',
          type: 'line',
          source: 'rivers-main',
          paint: { 'line-color': '#0369a1', 'line-width': 4, 'line-opacity': 0.9 },
          layout: { visibility: riverSettings.main ? 'visible' : 'none' },
        })

        map.addSource('rivers-tributaries', { type: 'geojson', data: riversTributaries })
        map.addLayer({
          id: 'rivers-tributaries',
          type: 'line',
          source: 'rivers-tributaries',
          paint: { 'line-color': '#0ea5e9', 'line-width': 2.2, 'line-opacity': 0.85 },
          layout: { visibility: riverSettings.tributaries ? 'visible' : 'none' },
        })

        map.addSource('drainage', { type: 'geojson', data: drainage })
        map.addLayer({
          id: 'drainage',
          type: 'line',
          source: 'drainage',
          paint: { 'line-color': '#38bdf8', 'line-width': 1.4, 'line-dasharray': [2, 1] },
          layout: { visibility: riverSettings.drainage ? 'visible' : 'none' },
        })

        map.addSource('flow-arrows', { type: 'geojson', data: flowArrows })
        map.addLayer({
          id: 'flow-arrows',
          type: 'line',
          source: 'flow-arrows',
          paint: { 'line-color': '#1d4ed8', 'line-width': 1.2 },
          layout: { visibility: riverSettings.flowArrows ? 'visible' : 'none' },
        })

        map.addSource('contours', { type: 'geojson', data: contours })
        map.addLayer({
          id: 'contours',
          type: 'line',
          source: 'contours',
          paint: { 'line-color': '#a16207', 'line-width': 0.6, 'line-opacity': 0.55 },
          layout: { visibility: terrainSettings.contours ? 'visible' : 'none' },
        })

        const initialFlood = inundation ?? (floodZone
          ? { type: 'FeatureCollection', features: [floodZone] }
          : { type: 'FeatureCollection', features: [] })
        map.addSource('flood-zone', { type: 'geojson', data: initialFlood })
        map.addLayer({
          id: 'flood-zone-fill',
          type: 'fill',
          source: 'flood-zone',
          paint: { 'fill-color': '#0284c7', 'fill-opacity': 0 },
        })
        map.addLayer({
          id: 'flood-water-3d',
          type: 'fill-extrusion',
          source: 'flood-zone',
          paint: {
            'fill-extrusion-color': '#0ea5e9',
            'fill-extrusion-height': 0,
            'fill-extrusion-opacity': 0,
          },
        })

        addBuildingLayers(map)

        const initialFault = faultLine ?? { type: 'FeatureCollection', features: [] }
        map.addSource('fault-line', { type: 'geojson', data: initialFault })
        map.addLayer({ id: 'fault-line', type: 'line', source: 'fault-line', paint: { 'line-color': '#dc2626', 'line-width': 3 } })

      map.addSource('fault-buffer', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'fault-buffer-fill', type: 'fill', source: 'fault-buffer', paint: { 'fill-color': '#f97316', 'fill-opacity': 0.22 } })

      map.addSource('epicenter', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'epicenter-rings', type: 'fill', source: 'epicenter', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#ef4444', 'fill-opacity': ['coalesce', ['get', 'opacity'], 0.12] } })
      map.addLayer({ id: 'epicenter-point', type: 'circle', source: 'epicenter', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 9, 'circle-color': '#dc2626', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })

      map.addSource('measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'measure-line', type: 'line', source: 'measure', paint: { 'line-color': '#7c3aed', 'line-width': 2, 'line-dasharray': [2, 2] } })
      map.addLayer({ id: 'measure-points', type: 'circle', source: 'measure', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 5, 'circle-color': '#7c3aed', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } })

      map.addSource('draw-fault', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'draw-fault-line', type: 'line', source: 'draw-fault', paint: { 'line-color': '#b91c1c', 'line-width': 3, 'line-dasharray': [2, 1] } })

      map.on('click', 'buildings-3d', (e: MapLayerMouseEvent) => {
        if (activeTool !== 'select') return
        const feature = e.features?.[0]
        if (feature?.properties?.id) {
          onBuildingSelect(feature.properties.id as string)
        }
      })

      const selectRiver = (e: MapLayerMouseEvent) => {
        if (activeTool !== 'select') return
        const feature = e.features?.[0]
        if (!feature?.properties) return
        const coords = (feature.geometry as LineString).coordinates?.[0]
        let bankElevationM: number | null = null
        if (elevationGrid && coords) {
          bankElevationM = buildTerrainSample(elevationGrid, coords[0], coords[1]).elevation
        }
        onRiverSelect({
          id: String(feature.properties.id ?? ''),
          name: String(feature.properties.name ?? feature.properties.waterway ?? 'Waterway'),
          waterway: String(feature.properties.waterway ?? 'stream'),
          className: String(feature.properties.class ?? 'tributary'),
          lengthKm: feature.properties.length_km as number | undefined,
          bankElevationM,
        })
      }
      map.on('click', 'rivers-main', selectRiver)
      map.on('click', 'rivers-tributaries', selectRiver)

        if (cancelled) {
          map.remove()
          return
        }

        map.flyTo({
          center: LASAM_CENTER,
          zoom: DEFAULT_ZOOM,
          pitch: 52,
          bearing: -20,
          duration: 0,
        })

        applyLayerVisibility(map)
        mapRef.current = map
        setMapError(null)
        onMapReady?.()
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
        }
      }
    }

    initMap()

    return () => {
      cancelled = true
      unbindResize?.()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [onBuildingSelect, onFaultLineDrawn, onMapReady, activeTool, buildings, boundary, riversMain, riversTributaries, drainage, riverbanks, watersheds, flowArrows, contours, floodZone, inundation, faultLine, addBuildingLayers, applyLayerVisibility, is3D, terrainSettings, riverSettings, elevationGrid, onRiverSelect])

  useEffect(() => {
    updateBuildingColors()
  }, [updateBuildingColors])

  // Hide flat footprint/outline when 3D or terrain is on (those layers cause the dark “shadow”).
  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('buildings-footprint')) return
    const showFlat = !(is3D || terrainSettings.terrain3d)
    map.setLayoutProperty('buildings-footprint', 'visibility', showFlat ? 'visible' : 'none')
    if (map.getLayer('buildings-outline')) {
      map.setLayoutProperty('buildings-outline', 'visibility', showFlat ? 'visible' : 'none')
    }
    if (map.getLayer('buildings-3d')) {
      map.setLayoutProperty('buildings-3d', 'visibility', showFlat ? 'none' : 'visible')
    }
  }, [is3D, terrainSettings.terrain3d])

  /**
   * Snap building bases to AWS Terrarium mesh once — synthetic DEM often mismatches,
   * which floats boxes and leaves a gap above the draped footprint “shadow”.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !terrainSettings.terrain3d) {
      terrainAlignedOnceRef.current = false
      terrainAlignedRef.current.clear()
      return
    }
    if (terrainAlignedOnceRef.current && terrainAlignedRef.current.size > 0) {
      updateBuildingColors()
      return
    }

    let cancelled = false

    const align = () => {
      if (cancelled || !map.getSource('buildings')) return
      if (typeof map.queryTerrainElevation !== 'function') return

      const next = new globalThis.Map<string, number>()
      for (const feature of buildings.features) {
        const ring = feature.geometry.coordinates[0]
        if (!ring?.length) continue

        const points = ring.slice(0, -1)
        if (points.length === 0) continue

        // Centroid + up to 3 corners — enough to seat the box without 13k×N tile queries
        let lngSum = 0
        let latSum = 0
        for (const [lng, lat] of points) {
          lngSum += lng
          latSum += lat
        }
        const samplePts: Array<{ lng: number; lat: number }> = [
          { lng: lngSum / points.length, lat: latSum / points.length },
          { lng: points[0][0], lat: points[0][1] },
          {
            lng: points[Math.floor(points.length / 3)][0],
            lat: points[Math.floor(points.length / 3)][1],
          },
          {
            lng: points[Math.floor((2 * points.length) / 3)][0],
            lat: points[Math.floor((2 * points.length) / 3)][1],
          },
        ]

        let minElev = Infinity
        let samples = 0
        for (const pt of samplePts) {
          const elev = map.queryTerrainElevation(pt)
          if (elev != null && Number.isFinite(elev)) {
            minElev = Math.min(minElev, elev)
            samples += 1
          }
        }
        if (samples > 0) {
          next.set(feature.properties.id, Number(minElev.toFixed(2)))
        }
      }

      if (next.size === 0) return
      terrainAlignedRef.current = next
      terrainAlignedOnceRef.current = true
      updateBuildingColors()
    }

    const onIdle = () => align()
    map.once('idle', onIdle)
    const timer = window.setTimeout(align, 1000)

    return () => {
      cancelled = true
      map.off('idle', onIdle)
      window.clearTimeout(timer)
    }
  }, [buildings.features.length, terrainSettings.terrain3d, updateBuildingColors])

  useEffect(() => {
    if (selectedBuildingId) flyToBuilding(selectedBuildingId)
  }, [selectedBuildingId, flyToBuilding])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const floodData =
      inundation && inundation.features.length > 0
        ? inundation
        : floodZone
          ? { type: 'FeatureCollection', features: [floodZone] }
          : { type: 'FeatureCollection', features: [] }

    ;(map.getSource('flood-zone') as maplibregl.GeoJSONSource)?.setData(floodData as GeoJSON.FeatureCollection)

    const active = waterSurfaceM > 0 || floodDepth > 0
    const opacity = active ? Math.min(floodOpacity, 0.12 + Math.max(floodDepth, waterSurfaceM - 10) * 0.08) : 0
    map.setPaintProperty('flood-zone-fill', 'fill-opacity', opacity)
    const height = waterSurfaceM > 0 ? waterSurfaceM : floodVisualHeight(floodDepth)
    map.setPaintProperty('flood-water-3d', 'fill-extrusion-height', height)
    map.setPaintProperty('flood-water-3d', 'fill-extrusion-base', waterSurfaceM > 0 ? Math.max(0, waterSurfaceM - 3) : 0)
    map.setPaintProperty('flood-water-3d', 'fill-extrusion-opacity', active ? 0.35 + floodOpacity * 0.35 : 0)
  }, [floodZone, inundation, floodDepth, floodOpacity, waterSurfaceM])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getSource('lasam-dem')) return
    if (terrainSettings.terrain3d) {
      map.setTerrain({ source: 'lasam-dem', exaggeration: terrainSettings.exaggeration })
    } else {
      map.setTerrain(null)
    }
    if (map.getLayer('hillshade')) {
      map.setLayoutProperty('hillshade', 'visibility', terrainSettings.hillshade ? 'visible' : 'none')
    }
    if (map.getLayer('contours')) {
      map.setLayoutProperty('contours', 'visibility', terrainSettings.contours ? 'visible' : 'none')
    }
  }, [terrainSettings])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    applyLayerVisibility(map)
  }, [applyLayerVisibility])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !elevationGrid) return

    const onMove = (e: MapMouseEvent) => {
      const sample = buildTerrainSample(elevationGrid, e.lngLat.lng, e.lngLat.lat)
      setTerrainSample(sample)
    }
    map.on('mousemove', onMove)
    return () => {
      map.off('mousemove', onMove)
    }
  }, [elevationGrid])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    if (faultLine) {
      ;(map.getSource('fault-line') as maplibregl.GeoJSONSource)?.setData(faultLine)
    }

    ;(map.getSource('fault-buffer') as maplibregl.GeoJSONSource)?.setData(
      faultBuffer ?? { type: 'FeatureCollection', features: [] },
    )
  }, [faultLine, faultBuffer])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    if (epicenter) {
      const rings = createEarthquakeRings(epicenter, earthquakeRadius)
      ;(map.getSource('epicenter') as maplibregl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [
          ...rings,
          { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: epicenter } },
        ],
      })
    } else {
      ;(map.getSource('epicenter') as maplibregl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [],
      })
    }
  }, [epicenter, earthquakeRadius])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ pitch: is3D ? 55 : 0, duration: 700 })
  }, [is3D])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const hints: Partial<Record<MapTool, string>> = {
      'draw-fault': 'Click to add fault points. Double-click to finish the line.',
      epicenter: 'Click the map to place the earthquake epicenter.',
      measure: 'Click two points to measure distance.',
      'zoom-home': 'Click anywhere to fly back to Lasam center.',
    }

    setToolHint(hints[activeTool] ?? null)

    const handleClick = (e: MapMouseEvent) => {
      if (activeTool === 'epicenter') {
        onEpicenterPlace([e.lngLat.lng, e.lngLat.lat])
        return
      }

      if (activeTool === 'zoom-home') {
        map.flyTo({ center: LASAM_CENTER, zoom: DEFAULT_ZOOM, pitch: is3D ? 55 : 0 })
        return
      }

      if (activeTool === 'draw-fault') {
        if (!isDrawingRef.current) {
          isDrawingRef.current = true
          drawPointsRef.current = [[e.lngLat.lng, e.lngLat.lat]]
        } else {
          drawPointsRef.current.push([e.lngLat.lng, e.lngLat.lat])
        }

        const lineFeature: Feature<LineString> = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: drawPointsRef.current },
        }

        ;(map.getSource('draw-fault') as maplibregl.GeoJSONSource)?.setData({
          type: 'FeatureCollection',
          features: [lineFeature],
        })
        return
      }

      if (activeTool === 'measure') {
        measurePointsRef.current.push([e.lngLat.lng, e.lngLat.lat])
        if (measurePointsRef.current.length > 2) {
          measurePointsRef.current = [[e.lngLat.lng, e.lngLat.lat]]
        }

        const pts = measurePointsRef.current
        const features: GeoJSON.Feature[] = pts.map((p) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: p },
        }))

        if (pts.length === 2) {
          features.push({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: pts },
          })
          const dist = distance(point(pts[0]), point(pts[1]), { units: 'meters' })
          onMeasureUpdate(`${Math.round(dist)} meters`)
        } else {
          onMeasureUpdate('Select second point…')
        }

        ;(map.getSource('measure') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features,
        })
      }
    }

    const handleDblClick = () => {
      if (activeTool === 'draw-fault' && drawPointsRef.current.length >= 2) {
        const line: Feature<LineString> = {
          type: 'Feature',
          properties: { name: 'Drawn Fault Line' },
          geometry: { type: 'LineString', coordinates: drawPointsRef.current },
        }
        onFaultLineDrawn(line)
        drawPointsRef.current = []
        isDrawingRef.current = false
        ;(map.getSource('draw-fault') as maplibregl.GeoJSONSource)?.setData({
          type: 'FeatureCollection',
          features: [],
        })
      }
    }

    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
    }
  }, [activeTool, is3D, onEpicenterPlace, onFaultLineDrawn, onMeasureUpdate])

  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    if (!map || !container) return

    const shouldShake =
      hazardMode === 'earthquake' && (isPlaying || earthquakeMagnitude >= 5.5)

    if (!shouldShake) {
      map.setBearing(-15)
      map.setPitch(is3D ? 55 : 0)
      if (shakeFrameRef.current) cancelAnimationFrame(shakeFrameRef.current)
      return
    }

    let frame = 0
    const animate = () => {
      frame += 1
      const intensity = Math.min(1.2, (earthquakeMagnitude - 4) * 0.25)
      map.setBearing(-15 + Math.sin(frame * 0.6) * intensity)
      map.setPitch((is3D ? 55 : 0) + Math.cos(frame * 0.45) * intensity)
      shakeFrameRef.current = requestAnimationFrame(animate)
    }

    shakeFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (shakeFrameRef.current) cancelAnimationFrame(shakeFrameRef.current)
    }
  }, [hazardMode, isPlaying, earthquakeMagnitude, is3D])

  useEffect(() => {
    if (activeTool !== 'measure') {
      measurePointsRef.current = []
      onMeasureUpdate(null)
      const map = mapRef.current
      if (map?.getSource('measure')) {
        ;(map.getSource('measure') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [],
        })
      }
    }
  }, [activeTool, onMeasureUpdate])

  return (
    <div className="relative h-full w-full min-h-[420px]">
      <div ref={containerRef} className="h-full w-full" />
      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90 p-6">
          <div className="max-w-sm rounded-lg border border-red-200 bg-white p-4 text-center shadow-lg">
            <p className="text-sm font-semibold text-red-700">Map failed to load</p>
            <p className="mt-2 text-xs text-slate-600">{mapError}</p>
            <p className="mt-2 text-xs text-slate-500">Check your internet connection and reload the page.</p>
          </div>
        </div>
      )}
      <MapLegend hazardMode={hazardMode} />
      <TerrainInfoBar sample={terrainSample} />
      {toolHint && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 max-w-[90%] -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 text-xs text-white shadow-lg">
          {toolHint}
        </div>
      )}
    </div>
  )
}
