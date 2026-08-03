import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Feature, FeatureCollection, LineString } from 'geojson'
import { Header, DisclaimerBanner } from '@/components/layout/Header'
import { MapToolbar } from '@/components/layout/MapToolbar'
import { MobileHazardDrawer } from '@/components/layout/MobileHazardDrawer'
import { SimulationBar } from '@/components/layout/SimulationBar'
import { BuildingPopup } from '@/components/layout/BuildingPopup'
import { RiverInfoCard, type SelectedRiver } from '@/components/layout/RiverInfoCard'
import { MapView } from '@/components/map/MapView'
import { Button } from '@/components/ui/button'
import { useMapData } from '@/hooks/useMapData'
import { LASAM_CENTER } from '@/lib/constants'
import {
  applyFloodSimulation,
  applyTerrainAwareFlood,
  floodStatusLabel,
  getFloodDepthAtBuilding,
} from '@/lib/simulation/flood'
import { applyEarthquakeSimulation, earthquakeStatusLabel, getEarthquakeRadius } from '@/lib/simulation/earthquake'
import { applyFaultExposure } from '@/lib/simulation/fault'
import { computeStats } from '@/lib/simulation/stats'
import type {
  FloodScenarioSettings,
  HazardMode,
  MapTool,
  RiverSettings,
  SelectedBuilding,
  TerrainSettings,
} from '@/types'

const initialLayerVisibility = {
  boundary: true,
  buildings: true,
  flood: true,
  fault: true,
  epicenter: true,
}

const initialTerrain: TerrainSettings = {
  terrain3d: true,
  hillshade: true,
  contours: false,
  elevationColors: false,
  exaggeration: 1.4,
  opacity: 1,
}

const initialRivers: RiverSettings = {
  main: true,
  tributaries: true,
  drainage: false,
  riverbanks: false,
  watershed: false,
  flowArrows: false,
}

const initialFloodScenario: FloodScenarioSettings = {
  riverStageM: 14,
  riverRiseM: 0,
  durationMin: 60,
  propagationSpeed: 1,
  maxWaterElevationM: 22,
}

export default function App() {
  const { data, error, isLoading, retry } = useMapData()

  const [faultLine, setFaultLine] = useState<Feature<LineString> | null>(null)
  const [faultBufferGeom, setFaultBufferGeom] = useState<GeoJSON.Feature<GeoJSON.Polygon> | null>(null)
  const [faultExposedCount, setFaultExposedCount] = useState(0)

  const [hazardMode, setHazardMode] = useState<HazardMode>('flood')
  const [activeTool, setActiveTool] = useState<MapTool>('select')
  const [is3D, setIs3D] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [measureLabel, setMeasureLabel] = useState<string | null>(null)

  const [floodOpacity, setFloodOpacity] = useState(0.45)
  const [floodScenario, setFloodScenario] = useState('rise-1m')
  const [floodSettings, setFloodSettings] = useState(initialFloodScenario)
  const [floodProgress, setFloodProgress] = useState(1)

  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState(6)
  const [earthquakeDepth, setEarthquakeDepth] = useState(15)
  const [earthquakeRadius, setEarthquakeRadius] = useState(getEarthquakeRadius(6))
  const [epicenter, setEpicenter] = useState<[number, number] | null>(LASAM_CENTER)

  const [faultBuffer, setFaultBuffer] = useState(250)
  const [faultLineName, setFaultLineName] = useState('Sample Fault Line')
  const [layerVisibility, setLayerVisibility] = useState(initialLayerVisibility)
  const [terrainSettings, setTerrainSettings] = useState(initialTerrain)
  const [riverSettings, setRiverSettings] = useState(initialRivers)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [selectedRiver, setSelectedRiver] = useState<SelectedRiver | null>(null)
  const [inundation, setInundation] = useState<FeatureCollection | null>(null)
  const [waterSurfaceM, setWaterSurfaceM] = useState(0)

  useEffect(() => {
    if (data?.defaultFaultLine) setFaultLine(data.defaultFaultLine)
  }, [data])

  const processedBuildings = useMemo(() => {
    if (!data) return null

    let result = data.buildings
    let nextInundation: FeatureCollection = { type: 'FeatureCollection', features: [] }
    let nextWater = 0

    if (data.elevationGrid && floodSettings.riverRiseM > 0) {
      const terrainResult = applyTerrainAwareFlood(
        data.buildings,
        data.elevationGrid,
        data.rivers,
        floodSettings.riverStageM,
        floodSettings.riverRiseM,
        floodSettings.maxWaterElevationM,
        floodProgress,
      )
      result = terrainResult.buildings
      nextInundation = terrainResult.inundation
      nextWater = terrainResult.waterSurfaceM
    } else {
      // Legacy fallback when no rise configured
      result = applyFloodSimulation(data.buildings, data.floodZone, 0)
    }

    result = applyEarthquakeSimulation(result, epicenter, earthquakeMagnitude, earthquakeRadius)

    const activeFault = faultLine ?? data.defaultFaultLine
    if (activeFault) {
      result = applyFaultExposure(result, activeFault, faultBuffer).buildings
    }

    ;(result as BuildingCollectionWithMeta)._inundation = nextInundation
    ;(result as BuildingCollectionWithMeta)._water = nextWater

    return result
  }, [
    data,
    floodSettings,
    floodProgress,
    epicenter,
    earthquakeMagnitude,
    earthquakeRadius,
    faultLine,
    faultBuffer,
  ])

  useEffect(() => {
    if (!processedBuildings) return
    const meta = processedBuildings as BuildingCollectionWithMeta
    setInundation(meta._inundation ?? { type: 'FeatureCollection', features: [] })
    setWaterSurfaceM(meta._water ?? 0)
  }, [processedBuildings])

  useEffect(() => {
    if (!processedBuildings || !data) return
    const activeFault = faultLine ?? data.defaultFaultLine
    const faultResult = applyFaultExposure(processedBuildings, activeFault, faultBuffer)
    setFaultBufferGeom(faultResult.buffer)
    setFaultExposedCount(faultResult.exposedCount)
  }, [processedBuildings, faultLine, data, faultBuffer])

  const stats = useMemo(
    () => computeStats(processedBuildings ?? { type: 'FeatureCollection', features: [] }),
    [processedBuildings],
  )

  const selectedBuilding = useMemo<SelectedBuilding | null>(() => {
    if (!selectedBuildingId || !processedBuildings || !data) return null
    const feature = processedBuildings.features.find((f) => f.properties.id === selectedBuildingId)
    if (!feature) return null

    const faultDistance =
      feature.properties.faultDistance !== undefined
        ? `${feature.properties.faultDistance} meters`
        : 'Not calculated'

    const depth = getFloodDepthAtBuilding(feature, data.floodZone, floodSettings.riverRiseM)

    return {
      id: feature.properties.id,
      type: feature.properties.type,
      barangay: feature.properties.barangay,
      floors: feature.properties.floors,
      height: feature.properties.height,
      heightEstimated: feature.properties.height_estimated,
      groundElevation: feature.properties.ground_elevation_m,
      dataSource: feature.properties.data_source,
      validationStatus: feature.properties.validation_status,
      name: feature.properties.name,
      floodStatus: floodStatusLabel(feature.properties.floodExposure ?? 'none'),
      earthquakeStatus: earthquakeStatusLabel(feature.properties.earthquakeDamage ?? 'minimal'),
      faultDistance,
      floodDepth: `${depth.toFixed(2)} m (simulated)`,
    }
  }, [selectedBuildingId, processedBuildings, data, floodSettings.riverRiseM])

  useEffect(() => {
    if (!isPlaying) return

    const interval = window.setInterval(() => {
      if (hazardMode === 'flood') {
        setFloodProgress((p) => (p >= 1 ? 0.05 : Number((p + 0.05 * simulationSpeed).toFixed(2))))
        setFloodSettings((s) => ({
          ...s,
          riverRiseM: s.riverRiseM <= 0 ? 1 : s.riverRiseM,
        }))
      } else if (hazardMode === 'earthquake') {
        setEarthquakeMagnitude((m) => {
          const next = m >= 8 ? 4 : Number((m + 0.05 * simulationSpeed).toFixed(1))
          setEarthquakeRadius(getEarthquakeRadius(next))
          return next
        })
      }
    }, 200)

    return () => window.clearInterval(interval)
  }, [isPlaying, hazardMode, simulationSpeed])

  const handleReset = useCallback(() => {
    if (!data) return
    setFloodSettings(initialFloodScenario)
    setFloodProgress(1)
    setFloodScenario('rise-1m')
    setEarthquakeMagnitude(6)
    setEarthquakeDepth(15)
    setEarthquakeRadius(getEarthquakeRadius(6))
    setEpicenter(LASAM_CENTER)
    setFaultLine(data.defaultFaultLine)
    setFaultBuffer(250)
    setFaultLineName('Sample Fault Line')
    setSelectedBuildingId(null)
    setSelectedRiver(null)
    setIsPlaying(false)
    setHazardMode('flood')
    setActiveTool('select')
    setMeasureLabel(null)
  }, [data])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const timelineProgress =
    hazardMode === 'flood'
      ? floodProgress
      : hazardMode === 'earthquake'
        ? (earthquakeMagnitude - 4) / 4
        : faultBuffer / 1000

  const currentValue =
    measureLabel ??
    (hazardMode === 'flood'
      ? `River stage ${floodSettings.riverStageM.toFixed(1)} m + rise ${floodSettings.riverRiseM.toFixed(1)} m · water ${waterSurfaceM.toFixed(1)} m ASL`
      : hazardMode === 'earthquake'
        ? `Magnitude M ${earthquakeMagnitude.toFixed(1)} · Depth ${earthquakeDepth} km`
        : `Fault buffer: ${faultBuffer} m`)

  const hazardPanelProps = {
    hazardMode,
    onHazardModeChange: setHazardMode,
    floodOpacity,
    floodScenario,
    floodSettings,
    onFloodOpacityChange: setFloodOpacity,
    onFloodScenarioChange: (s: string) => {
      setFloodScenario(s)
      const presets: Record<string, Partial<FloodScenarioSettings>> = {
        'rise-0.5m': { riverRiseM: 0.5 },
        'rise-1m': { riverRiseM: 1 },
        'rise-2m': { riverRiseM: 2 },
        'rise-3m': { riverRiseM: 3 },
        custom: {},
      }
      setFloodSettings((prev) => ({ ...prev, ...(presets[s] ?? { riverRiseM: 1 }) }))
      setFloodProgress(1)
    },
    onFloodSettingsChange: (patch: Partial<FloodScenarioSettings>) => {
      setFloodSettings((prev) => ({ ...prev, ...patch }))
      setFloodProgress(1)
    },
    onResetFlood: () => {
      setFloodSettings(initialFloodScenario)
      setFloodProgress(1)
      setFloodScenario('rise-1m')
    },
    earthquakeMagnitude,
    earthquakeDepth,
    earthquakeRadius,
    onEarthquakeMagnitudeChange: (m: number) => {
      setEarthquakeMagnitude(m)
      setEarthquakeRadius(getEarthquakeRadius(m))
    },
    onEarthquakeDepthChange: setEarthquakeDepth,
    onEarthquakeRadiusChange: setEarthquakeRadius,
    onResetEarthquake: () => {
      setEarthquakeMagnitude(6)
      setEpicenter(LASAM_CENTER)
      setEarthquakeRadius(getEarthquakeRadius(6))
    },
    faultBuffer,
    faultLineName,
    faultExposedCount,
    onFaultBufferChange: setFaultBuffer,
    onFaultLineNameChange: setFaultLineName,
    onDeleteFaultLine: () => {
      if (data) setFaultLine(data.defaultFaultLine)
    },
    layerVisibility,
    onLayerVisibilityChange: (layer: string, visible: boolean) =>
      setLayerVisibility((prev) => ({ ...prev, [layer]: visible })),
    terrainSettings,
    onTerrainSettingsChange: (patch: Partial<TerrainSettings>) =>
      setTerrainSettings((prev) => ({ ...prev, ...patch })),
    riverSettings,
    onRiverSettingsChange: (patch: Partial<RiverSettings>) =>
      setRiverSettings((prev) => ({ ...prev, ...patch })),
    selectedBuilding,
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <p className="text-sm text-slate-600">Loading Lasam terrain & hazard map…</p>
        </div>
      </div>
    )
  }

  if (error || !data || !processedBuildings) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Unable to load map data</h1>
        <p className="max-w-md text-sm text-slate-600">{error ?? 'Sample GeoJSON files could not be loaded.'}</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <Header
        is3D={is3D}
        onToggle3D={() => setIs3D((v) => !v)}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />
      <DisclaimerBanner />
      <div className="bg-amber-50 px-4 py-1.5 text-center text-[11px] text-amber-900">
        Preliminary Planning Simulation — terrain-connected flood demo only. Not validated for official decisions.
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="relative h-[55vh] min-h-[420px] flex-1 lg:h-auto lg:min-h-0">
          <MapView
            buildings={processedBuildings}
            boundary={data.boundary}
            riversMain={data.riversMain}
            riversTributaries={data.riversTributaries}
            drainage={data.drainage}
            riverbanks={data.riverbanks}
            watersheds={data.watersheds}
            flowArrows={data.flowArrows}
            contours={data.contours}
            elevationGrid={data.elevationGrid}
            inundation={inundation}
            waterSurfaceM={waterSurfaceM}
            floodZone={data.floodZone}
            faultLine={faultLine}
            faultBuffer={faultBufferGeom}
            epicenter={epicenter}
            earthquakeRadius={earthquakeRadius}
            earthquakeMagnitude={earthquakeMagnitude}
            hazardMode={hazardMode}
            activeTool={activeTool}
            is3D={is3D}
            isPlaying={isPlaying}
            floodDepth={floodSettings.riverRiseM}
            floodOpacity={floodOpacity}
            selectedBuildingId={selectedBuildingId}
            layerVisibility={layerVisibility}
            terrainSettings={terrainSettings}
            riverSettings={riverSettings}
            onBuildingSelect={setSelectedBuildingId}
            onRiverSelect={setSelectedRiver}
            onEpicenterPlace={setEpicenter}
            onFaultLineDrawn={(line) => {
              setFaultLine({ ...line, properties: { ...line.properties, name: faultLineName } })
            }}
            onMeasureUpdate={setMeasureLabel}
          />
          <MapToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClearDrawings={() => {
              if (data) setFaultLine(data.defaultFaultLine)
              setEpicenter(LASAM_CENTER)
              setMeasureLabel(null)
            }}
          />
          {selectedBuilding && (
            <BuildingPopup building={selectedBuilding} onClose={() => setSelectedBuildingId(null)} />
          )}
          {selectedRiver && (
            <RiverInfoCard river={selectedRiver} onClose={() => setSelectedRiver(null)} />
          )}
        </div>

        <MobileHazardDrawer
          {...hazardPanelProps}
          isOpen={mobilePanelOpen}
          onToggle={() => setMobilePanelOpen((v) => !v)}
        />
      </div>

      <SimulationBar
        stats={stats}
        hazardMode={hazardMode}
        isPlaying={isPlaying}
        simulationSpeed={simulationSpeed}
        currentValue={currentValue}
        timelineProgress={timelineProgress}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onStepBack={() => {
          if (hazardMode === 'flood') {
            setFloodSettings((s) => ({ ...s, riverRiseM: Math.max(0, s.riverRiseM - 0.5) }))
            setFloodProgress(1)
          } else setEarthquakeMagnitude((m) => Math.max(4, Number((m - 0.2).toFixed(1))))
        }}
        onStepForward={() => {
          if (hazardMode === 'flood') {
            setFloodSettings((s) => ({ ...s, riverRiseM: Math.min(5, s.riverRiseM + 0.5) }))
            setFloodProgress(1)
          } else setEarthquakeMagnitude((m) => Math.min(8, Number((m + 0.2).toFixed(1))))
        }}
        onSpeedChange={setSimulationSpeed}
      />
    </div>
  )
}

type BuildingCollectionWithMeta = NonNullable<ReturnType<typeof useMapData>['data']>['buildings'] & {
  _inundation?: FeatureCollection
  _water?: number
}
