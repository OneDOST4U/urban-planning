import type { TerrainSample } from '@/types'

interface TerrainInfoBarProps {
  sample: TerrainSample | null
}

export function TerrainInfoBar({ sample }: TerrainInfoBarProps) {
  if (!sample) return null

  return (
    <div className="pointer-events-none absolute bottom-14 left-3 z-10 max-w-xs rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold uppercase tracking-wide text-sky-700">Terrain sample</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
        <span className="text-slate-500">Location</span>
        <span>{sample.barangay ?? `${sample.lat.toFixed(4)}, ${sample.lng.toFixed(4)}`}</span>
        <span className="text-slate-500">Elevation</span>
        <span>{sample.elevation != null ? `${sample.elevation.toFixed(1)} m` : '—'}</span>
        <span className="text-slate-500">Slope</span>
        <span>{sample.slope != null ? `${sample.slope.toFixed(1)}°` : '—'}</span>
        <span className="text-slate-500">Drainage</span>
        <span>{sample.flowDir ?? '—'}</span>
        <span className="text-slate-500">Nearest river</span>
        <span>
          {sample.nearestRiver
            ? `${sample.nearestRiver}${sample.nearestRiverM != null ? ` · ${sample.nearestRiverM} m` : ''}`
            : '—'}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">Preliminary DEM — demonstration only</p>
    </div>
  )
}
