import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SelectedRiver {
  id: string
  name: string
  waterway: string
  className: string
  lengthKm?: number
  bankElevationM?: number | null
}

interface RiverInfoCardProps {
  river: SelectedRiver
  onClose: () => void
}

export function RiverInfoCard({ river, onClose }: RiverInfoCardProps) {
  return (
    <div className="absolute right-3 top-3 z-20 w-[min(92vw,300px)] rounded-lg border border-sky-200 bg-white p-3 shadow-xl lg:right-[21rem] xl:right-[25rem]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-sky-700">River segment</p>
          <h3 className="text-sm font-semibold text-slate-900">{river.name}</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Type</span>
          <p className="font-medium capitalize">{river.waterway}</p>
        </div>
        <div>
          <span className="text-slate-500">Class</span>
          <p className="font-medium capitalize">{river.className}</p>
        </div>
        <div>
          <span className="text-slate-500">Length</span>
          <p className="font-medium">{river.lengthKm != null ? `${river.lengthKm} km` : '—'}</p>
        </div>
        <div>
          <span className="text-slate-500">Bank elev. (est.)</span>
          <p className="font-medium">
            {river.bankElevationM != null ? `${river.bankElevationM.toFixed(1)} m` : '—'}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">OpenStreetMap waterway · preliminary values</p>
    </div>
  )
}
