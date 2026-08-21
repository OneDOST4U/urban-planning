import { FAULT_LEGEND_ENTRIES } from '@/lib/simulation/faultLegend'
import { MGB_FLOOD_LEGEND } from '@/lib/simulation/mgbFlood'
import {
  EROSION_LEGEND,
  LAND_USE_LEGEND,
  LGU_FLOOD_LEGEND,
  LIQUEFACTION_LEGEND,
} from '@/lib/simulation/lguHazards'
import type { HazardMode } from '@/types'

interface MapLegendProps {
  hazardMode: HazardMode
}

function LineSwatch({
  color,
  dash,
}: {
  color: string
  dash: 'solid' | 'dashed' | 'dotted'
}) {
  const style =
    dash === 'dashed'
      ? { borderTop: `2px dashed ${color}` }
      : dash === 'dotted'
        ? { borderTop: `2px dotted ${color}` }
        : { backgroundColor: color, height: 2 }

  return <span className="inline-block w-7 shrink-0" style={style} />
}

function SwatchList({
  title,
  entries,
}: {
  title: string
  entries: { label: string; color: string }[]
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1.5 text-[10px] font-medium text-slate-600">{title}</p>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MapLegend({ hazardMode }: MapLegendProps) {
  if (hazardMode === 'lgu') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden max-h-[45vh] max-w-xs overflow-y-auto rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">LGU datasets</p>
        <SwatchList title="LGU flood (2020)" entries={LGU_FLOOD_LEGEND} />
        <SwatchList title="Liquefaction (2013)" entries={LIQUEFACTION_LEGEND} />
        <SwatchList title="Land erosion (2020)" entries={EROSION_LEGEND} />
        <SwatchList title="Existing land use (2020)" entries={LAND_USE_LEGEND} />
      </div>
    )
  }

  if (hazardMode === 'flood') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">MGB Flood Susceptibility</p>
        <div className="space-y-1">
          {MGB_FLOOD_LEGEND.map((entry) => (
            <div key={entry.key} className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              {entry.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hazardMode === 'fault') {
    const compact = [
      FAULT_LEGEND_ENTRIES.find((e) => e.key === 'active-certain')!,
      FAULT_LEGEND_ENTRIES.find((e) => e.key === 'active-approximate')!,
      FAULT_LEGEND_ENTRIES.find((e) => e.key === 'active-concealed')!,
      FAULT_LEGEND_ENTRIES.find((e) => e.key === 'potential-certain')!,
      FAULT_LEGEND_ENTRIES.find((e) => e.key === 'potential-approximate')!,
    ]
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden max-h-[45vh] overflow-y-auto rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Active Fault (PHIVOLCS)</p>
        <div className="space-y-1.5 text-[10px] text-slate-600">
          {compact.map((entry) => (
            <div key={entry.key} className="flex items-center gap-2">
              <LineSwatch color={entry.color} dash={entry.dash} />
              <span>{entry.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hazardMode === 'volcano') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Cagua Volcano</p>
        <div className="space-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-800" />
            Summit (Gonzaga)
          </div>
        </div>
      </div>
    )
  }

  if (hazardMode === 'layers') {
    return (
      <div className="absolute bottom-4 left-3 z-10 hidden max-w-xs rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:block">
        <p className="mb-2 text-xs font-semibold text-slate-700">Map layers</p>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Use the Layers tab to toggle buildings, terrain, rivers, and other map overlays. LGU hazard
          datasets are under the LGU Data tab.
        </p>
      </div>
    )
  }

  return null
}