import { ClipboardList, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AssessmentResultsCard } from '@/components/layout/AssessmentResultsCard'
import { GoogleEarthLink } from '@/components/layout/GoogleEarthLink'
import {
  PROPOSED_BUILDING_TYPE_GROUPS,
  type ProposedBuildingType,
} from '@/lib/assessment/buildingTypes'
import type { SiteAssessmentResult } from '@/types'

export interface SiteAssessmentPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessLat: string
  assessLng: string
  assessBuildingType: ProposedBuildingType
  assessmentResult: SiteAssessmentResult | null
  assessError: string | null
  onAssessLatChange: (v: string) => void
  onAssessLngChange: (v: string) => void
  onAssessBuildingTypeChange: (v: ProposedBuildingType) => void
  onAssessSite: () => void
  onPickSiteOnMap: () => void
  pickingOnMap?: boolean
  pendingSiteCoords?: [number, number] | null
  onConfirmMapSite?: () => void
  onCancelPickOnMap?: () => void
}

export function SiteAssessmentPopup({
  open,
  onOpenChange,
  assessLat,
  assessLng,
  assessBuildingType,
  assessmentResult,
  assessError,
  onAssessLatChange,
  onAssessLngChange,
  onAssessBuildingTypeChange,
  onAssessSite,
  onPickSiteOnMap,
  pickingOnMap = false,
  pendingSiteCoords = null,
  onConfirmMapSite,
  onCancelPickOnMap,
}: SiteAssessmentPopupProps) {
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-2">
        <Button
          type="button"
          size="sm"
          variant={open || pickingOnMap ? 'default' : 'secondary'}
          className="pointer-events-auto h-9 gap-2 shadow-lg"
          onClick={() => {
            if (pickingOnMap) {
              onCancelPickOnMap?.()
              onOpenChange(true)
              return
            }
            onOpenChange(!open)
          }}
          aria-expanded={open}
        >
          <ClipboardList className="h-4 w-4" />
          Site Assessment
        </Button>

        {pickingOnMap && !open && !pendingSiteCoords && (
          <div className="pointer-events-auto flex max-w-[min(92vw,20rem)] items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 shadow-lg">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-700" />
            <span className="flex-1 leading-snug">Click the map to place the proposed building site.</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 px-2 text-sky-800"
              onClick={() => {
                onCancelPickOnMap?.()
                onOpenChange(true)
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {pickingOnMap && !open && pendingSiteCoords && (
          <div className="pointer-events-auto w-[min(92vw,18rem)] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-start gap-2">
              <img
                src="/markers/site-pin.svg"
                alt=""
                className="mt-0.5 h-8 w-6 shrink-0 object-contain"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Confirm site location</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  {pendingSiteCoords[1].toFixed(5)}, {pendingSiteCoords[0].toFixed(5)}
                </p>
                <GoogleEarthLink
                  lat={pendingSiteCoords[1]}
                  lng={pendingSiteCoords[0]}
                  className="mt-1"
                />
                <p className="mt-1 text-[10px] leading-snug text-slate-500">
                  Click elsewhere on the map to move the pin.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onCancelPickOnMap?.()
                  onOpenChange(true)
                }}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={onConfirmMapSite}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-assessment-title"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <p id="site-assessment-title" className="text-sm font-semibold text-slate-900">
                Proposed building
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Enter coordinates or pick on the map. Flood uses DENR-MGB susceptibility for Lasam.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Latitude</Label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    value={assessLat}
                    onChange={(e) => onAssessLatChange(e.target.value)}
                    placeholder="18.0645"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitude</Label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    value={assessLng}
                    onChange={(e) => onAssessLngChange(e.target.value)}
                    placeholder="121.6015"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Building / establishment type</Label>
                <select
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  value={assessBuildingType}
                  onChange={(e) =>
                    onAssessBuildingTypeChange(e.target.value as ProposedBuildingType)
                  }
                >
                  {PROPOSED_BUILDING_TYPE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {assessError && <p className="text-[11px] text-red-600">{assessError}</p>}

              <div className="flex flex-col gap-2">
                <Button size="sm" className="w-full" onClick={onAssessSite}>
                  Assess site
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={onPickSiteOnMap}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Pick on map
                </Button>
              </div>

              {assessmentResult && (
                <div className="border-t border-slate-100 pt-3">
                  <AssessmentResultsCard result={assessmentResult} compact />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
