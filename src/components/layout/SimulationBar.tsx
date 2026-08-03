import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { formatNumber } from '@/lib/utils'
import type { HazardMode, SimulationStats } from '@/types'

interface SimulationBarProps {
  stats: SimulationStats
  hazardMode: HazardMode
  isPlaying: boolean
  simulationSpeed: number
  currentValue: string
  timelineProgress: number
  onPlayPause: () => void
  onStepBack: () => void
  onStepForward: () => void
  onSpeedChange: (speed: number) => void
}

export function SimulationBar({
  stats,
  hazardMode,
  isPlaying,
  simulationSpeed,
  currentValue,
  timelineProgress,
  onPlayPause,
  onStepBack,
  onStepForward,
  onSpeedChange,
}: SimulationBarProps) {
  return (
    <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
        <span>Total: <strong>{formatNumber(stats.totalBuildings)}</strong></span>
        <span>Flood: <strong className="text-sky-700">{formatNumber(stats.floodAffected)}</strong></span>
        <span>Fault: <strong className="text-orange-600">{formatNumber(stats.faultExposed)}</strong></span>
        <span>Quake: <strong className="text-red-600">{formatNumber(stats.earthquakeAffected)}</strong></span>
        <span>Low: <strong>{formatNumber(stats.lowRisk)}</strong></span>
        <span>Moderate: <strong>{formatNumber(stats.moderateRisk)}</strong></span>
        <span>High: <strong>{formatNumber(stats.highRisk)}</strong></span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{hazardMode === 'flood' ? 'Flood timeline' : hazardMode === 'earthquake' ? 'Earthquake timeline' : 'Scenario timeline'}</span>
          <span className="font-medium text-slate-700">{currentValue}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-300"
            style={{ width: `${Math.round(timelineProgress * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={onStepBack} aria-label="Previous step">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onStepForward} aria-label="Next step">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex w-full max-w-xs items-center gap-2 sm:w-40">
          <Label className="text-xs whitespace-nowrap">Speed</Label>
          <Slider min={0.5} max={3} step={0.5} value={[simulationSpeed]} onValueChange={([v]) => onSpeedChange(v)} />
          <span className="text-xs text-slate-500">{simulationSpeed}x</span>
        </div>
      </div>
    </footer>
  )
}
