import { FLOOD_COLORS, EARTHQUAKE_COLORS } from '@/lib/constants'
import type { HazardMode } from '@/types'

interface MapLegendProps {
  hazardMode: HazardMode
}

export function MapLegend({ hazardMode }: MapLegendProps) {
  if (hazardMode === 'flood') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Flood Exposure</p>
        <div className="space-y-1">
          {Object.entries(FLOOD_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2 text-[11px] capitalize text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {key}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hazardMode === 'earthquake') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Earthquake Damage</p>
        <div className="space-y-1">
          {Object.entries(EARTHQUAKE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2 text-[11px] capitalize text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {key}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hazardMode === 'fault') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Fault Buffer</p>
        <div className="space-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2"><span className="h-2.5 w-6 bg-red-500/30 border border-red-500" /> Within buffer</div>
          <div className="flex items-center gap-2"><span className="h-0.5 w-6 bg-red-600" /> Fault line</div>
        </div>
      </div>
    )
  }

  return null
}
