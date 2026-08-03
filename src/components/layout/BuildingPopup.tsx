import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SelectedBuilding } from '@/types'

interface BuildingPopupProps {
  building: SelectedBuilding
  onClose: () => void
}

export function BuildingPopup({ building, onClose }: BuildingPopupProps) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-[min(92vw,400px)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-700">Building Inspection</p>
          <h3 className="text-sm font-semibold text-slate-900">{building.id}</h3>
          {building.name && <p className="text-xs text-slate-500">{building.name}</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-slate-500">Building type</span><p className="font-medium">{building.type}</p></div>
        <div><span className="text-slate-500">Barangay</span><p className="font-medium">{building.barangay}</p></div>
        <div><span className="text-slate-500">Floors (est.)</span><p className="font-medium">{building.floors}</p></div>
        <div>
          <span className="text-slate-500">Height (est.)</span>
          <p className="font-medium">
            {building.height.toFixed(1)} m
            {building.heightEstimated && <span className="text-slate-400"> · simulated</span>}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Ground elev.</span>
          <p className="font-medium">
            {building.groundElevation != null ? `${building.groundElevation.toFixed(1)} m` : '—'}
          </p>
        </div>
        <div><span className="text-slate-500">Flood depth</span><p className="font-medium text-sky-700">{building.floodDepth}</p></div>
        <div><span className="text-slate-500">Flood status</span><p className="font-medium">{building.floodStatus}</p></div>
        <div><span className="text-slate-500">Earthquake</span><p className="font-medium">{building.earthquakeStatus}</p></div>
        <div><span className="text-slate-500">Fault distance</span><p className="font-medium">{building.faultDistance}</p></div>
        <div><span className="text-slate-500">Data source</span><p className="font-medium">{building.dataSource}</p></div>
        <div><span className="text-slate-500">Validation</span><p className="font-medium capitalize">{building.validationStatus}</p></div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
        Footprint from OpenStreetMap polygon. Heights and hazard values are estimated for demonstration only.
      </p>
    </div>
  )
}
