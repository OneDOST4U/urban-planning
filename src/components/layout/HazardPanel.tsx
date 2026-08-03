import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FAULT_BUFFER_OPTIONS, FLOOD_COLORS, EARTHQUAKE_COLORS } from '@/lib/constants'
import { BuildingInfoPanel } from '@/components/layout/BuildingInfoPanel'
import type {
  FloodScenarioSettings,
  HazardMode,
  RiverSettings,
  SelectedBuilding,
  TerrainSettings,
} from '@/types'

const FLOOD_RISE_SCENARIOS = [
  { id: 'rise-0.5m', label: 'River +0.5 m' },
  { id: 'rise-1m', label: 'River +1 m' },
  { id: 'rise-2m', label: 'River +2 m' },
  { id: 'rise-3m', label: 'River +3 m' },
  { id: 'custom', label: 'Custom' },
] as const

interface HazardPanelProps {
  hazardMode: HazardMode
  onHazardModeChange: (mode: HazardMode) => void
  floodOpacity: number
  floodScenario: string
  floodSettings: FloodScenarioSettings
  onFloodOpacityChange: (opacity: number) => void
  onFloodScenarioChange: (scenario: string) => void
  onFloodSettingsChange: (patch: Partial<FloodScenarioSettings>) => void
  onResetFlood: () => void
  earthquakeMagnitude: number
  earthquakeDepth: number
  earthquakeRadius: number
  onEarthquakeMagnitudeChange: (m: number) => void
  onEarthquakeDepthChange: (d: number) => void
  onEarthquakeRadiusChange: (r: number) => void
  onResetEarthquake: () => void
  faultBuffer: number
  faultLineName: string
  faultExposedCount: number
  onFaultBufferChange: (buffer: number) => void
  onFaultLineNameChange: (name: string) => void
  onDeleteFaultLine: () => void
  layerVisibility: Record<string, boolean>
  onLayerVisibilityChange: (layer: string, visible: boolean) => void
  terrainSettings: TerrainSettings
  onTerrainSettingsChange: (patch: Partial<TerrainSettings>) => void
  riverSettings: RiverSettings
  onRiverSettingsChange: (patch: Partial<RiverSettings>) => void
  selectedBuilding: SelectedBuilding | null
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-3 w-3 rounded-sm border border-slate-300" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

export function HazardPanel(props: HazardPanelProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-l border-slate-200 bg-white lg:w-80 xl:w-96">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Hazard Panel</h2>
        <p className="text-xs text-slate-500">Terrain, rivers, and preliminary flood scenarios</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={props.hazardMode} onValueChange={(v) => props.onHazardModeChange(v as HazardMode)}>
          <TabsList>
            <TabsTrigger value="flood">Flood</TabsTrigger>
            <TabsTrigger value="earthquake">Quake</TabsTrigger>
            <TabsTrigger value="fault">Fault</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
          </TabsList>

          <TabsContent value="flood" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>River overflow (terrain-aware)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Flood spreads from river cells into connected low ground. Depth = water surface − ground elevation.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>River stage (m ASL)</Label>
                    <span className="text-xs font-medium">{props.floodSettings.riverStageM.toFixed(1)} m</span>
                  </div>
                  <Slider
                    min={8}
                    max={20}
                    step={0.1}
                    value={[props.floodSettings.riverStageM]}
                    onValueChange={([v]) => props.onFloodSettingsChange({ riverStageM: v })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>River rise</Label>
                    <span className="text-xs font-medium">{props.floodSettings.riverRiseM.toFixed(1)} m</span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={0.1}
                    value={[props.floodSettings.riverRiseM]}
                    onValueChange={([v]) => props.onFloodSettingsChange({ riverRiseM: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scenario presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FLOOD_RISE_SCENARIOS.map((s) => (
                      <Button
                        key={s.id}
                        size="sm"
                        variant={props.floodScenario === s.id ? 'default' : 'outline'}
                        onClick={() => props.onFloodScenarioChange(s.id)}
                        className="text-xs"
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max water elevation</Label>
                    <span className="text-xs">{props.floodSettings.maxWaterElevationM.toFixed(1)} m</span>
                  </div>
                  <Slider
                    min={12}
                    max={30}
                    step={0.5}
                    value={[props.floodSettings.maxWaterElevationM]}
                    onValueChange={([v]) => props.onFloodSettingsChange({ maxWaterElevationM: v })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Layer opacity</Label>
                    <span className="text-xs">{Math.round(props.floodOpacity * 100)}%</span>
                  </div>
                  <Slider
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[props.floodOpacity]}
                    onValueChange={([v]) => props.onFloodOpacityChange(v)}
                  />
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={props.onResetFlood}>
                  Reset flood simulation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flood Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <LegendSwatch color={FLOOD_COLORS.none} label="Not affected" />
                <LegendSwatch color={FLOOD_COLORS.low} label="Low exposure" />
                <LegendSwatch color={FLOOD_COLORS.moderate} label="Moderate exposure" />
                <LegendSwatch color={FLOOD_COLORS.high} label="High exposure" />
                <LegendSwatch color={FLOOD_COLORS.severe} label="Severe exposure" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earthquake" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earthquake Simulation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Magnitude</Label>
                    <span className="text-xs font-medium">M {props.earthquakeMagnitude.toFixed(1)}</span>
                  </div>
                  <Slider
                    min={4}
                    max={8}
                    step={0.1}
                    value={[props.earthquakeMagnitude]}
                    onValueChange={([v]) => props.onEarthquakeMagnitudeChange(v)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Depth (km)</Label>
                    <span className="text-xs font-medium">{props.earthquakeDepth} km</span>
                  </div>
                  <Slider
                    min={5}
                    max={50}
                    step={1}
                    value={[props.earthquakeDepth]}
                    onValueChange={([v]) => props.onEarthquakeDepthChange(v)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Impact radius (km)</Label>
                    <span className="text-xs font-medium">{props.earthquakeRadius.toFixed(1)} km</span>
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={0.5}
                    value={[props.earthquakeRadius]}
                    onValueChange={([v]) => props.onEarthquakeRadiusChange(v)}
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={props.onResetEarthquake}>
                  Reset earthquake
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quake Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <LegendSwatch color={EARTHQUAKE_COLORS.minimal} label="Minimal" />
                <LegendSwatch color={EARTHQUAKE_COLORS.light} label="Light" />
                <LegendSwatch color={EARTHQUAKE_COLORS.moderate} label="Moderate" />
                <LegendSwatch color={EARTHQUAKE_COLORS.severe} label="Severe" />
                <LegendSwatch color={EARTHQUAKE_COLORS.critical} label="Critical" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fault" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fault Line</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={props.faultLineName}
                    onChange={(e) => props.onFaultLineNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buffer</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FAULT_BUFFER_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={props.faultBuffer === opt.value ? 'default' : 'outline'}
                        onClick={() => props.onFaultBufferChange(opt.value)}
                        className="text-xs"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800">
                  Exposed buildings: <strong>{props.faultExposedCount}</strong>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={props.onDeleteFaultLine}>
                  Reset fault line
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Terrain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ['terrain3d', '3D terrain'],
                    ['hillshade', 'Hillshade'],
                    ['contours', 'Contour lines'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={props.terrainSettings[key]}
                      onCheckedChange={(checked) => props.onTerrainSettingsChange({ [key]: checked })}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Exaggeration</Label>
                    <span className="text-xs">{props.terrainSettings.exaggeration.toFixed(1)}×</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={[props.terrainSettings.exaggeration]}
                    onValueChange={([v]) => props.onTerrainSettingsChange({ exaggeration: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rivers & drainage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ['main', 'Main rivers'],
                    ['tributaries', 'Tributaries / creeks'],
                    ['drainage', 'Drainage canals'],
                    ['riverbanks', 'Riverbanks'],
                    ['watershed', 'Watershed'],
                    ['flowArrows', 'Flow-direction arrows'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={props.riverSettings[key]}
                      onCheckedChange={(checked) => props.onRiverSettingsChange({ [key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Map layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(props.layerVisibility).map(([layer, visible]) => (
                  <div key={layer} className="flex items-center justify-between">
                    <Label className="capitalize">{layer.replace('-', ' ')}</Label>
                    <Switch
                      checked={visible}
                      onCheckedChange={(checked) => props.onLayerVisibilityChange(layer, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <BuildingInfoPanel building={props.selectedBuilding} />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  )
}
