import type { ReactNode, RefObject } from 'react'
import { AssessmentResultsCard } from '@/components/layout/AssessmentResultsCard'
import { MapSiteInfoOverlay } from '@/components/layout/MapSiteInfoOverlay'
import {
  ProposedBuildingPreviewMap,
  type ProposedBuildingPreviewMapHandle,
} from '@/components/layout/ProposedBuildingPreviewMap'
import {
  A4_LANDSCAPE_RATIO,
  REPORT_COORDINATOR,
  REPORT_HEADER,
} from '@/lib/assessment/reportLayout'
import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'
import type { FeatureCollection } from 'geojson'
import type { SiteAssessmentResult } from '@/types'

interface AssessmentReportSheetProps {
  buildingType: ProposedBuildingType
  lat: number
  lng: number
  result: SiteAssessmentResult
  nearbyBuildings: FeatureCollection
  mapRef?: RefObject<ProposedBuildingPreviewMapHandle | null>
  mapReady?: boolean
  onMapReady?: () => void
  className?: string
}

export function AssessmentReportSheet({
  buildingType,
  lat,
  lng,
  result,
  nearbyBuildings,
  mapRef,
  mapReady = true,
  onMapReady,
  className = '',
}: AssessmentReportSheetProps) {
  const nearbyCount = nearbyBuildings.features.length

  return (
    <article
      className={`flex w-full flex-col overflow-hidden bg-white ${className}`}
      style={{ aspectRatio: String(A4_LANDSCAPE_RATIO) }}
    >
      {/* Header — centered logo + titles only (no accent line) */}
      <header className="flex shrink-0 flex-col items-center border-b border-slate-200 px-4 pb-2 pt-2.5 text-center">
        <img
          src="/lasam-logo.png"
          alt="LGU Lasam"
          className="h-12 w-12 object-contain sm:h-14 sm:w-14"
        />
        <p className="mt-1 text-xs font-bold tracking-wide text-slate-900 sm:text-sm">
          {REPORT_HEADER.titleLine1}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800 sm:text-xs">
          {REPORT_HEADER.titleLine2}
        </p>
      </header>

      {/* Body — map left, hazard tables right */}
      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: '62% 38%' }}>
        <div className="relative min-h-0 border-r border-slate-200 bg-slate-100">
          <ProposedBuildingPreviewMap
            ref={mapRef}
            key={`${lng}-${lat}-${buildingType}-${nearbyCount}`}
            lng={lng}
            lat={lat}
            buildingType={buildingType}
            nearbyBuildings={nearbyBuildings}
            className="absolute inset-0 h-full w-full"
            onReady={onMapReady}
          />
          <MapSiteInfoOverlay buildingType={buildingType} lat={lat} lng={lng} />
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 text-xs font-medium text-white">
              Loading site preview…
            </div>
          )}
        </div>

        <section className="flex min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-100 px-2.5 py-1.5 sm:px-3 sm:py-2">
            <h2 className="text-[11px] font-bold text-slate-900 sm:text-xs">Hazard Assessment</h2>
            <p className="text-[8px] text-slate-500 sm:text-[9px]">
              Demonstration report · not an official certificate
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5 sm:px-2.5 sm:py-2">
            <AssessmentResultsCard result={result} report />
          </div>
        </section>
      </div>

      {/* Footer — signature blank with room above the line for signing */}
      <footer className="shrink-0 px-6 pb-2.5 pt-8 text-center">
        <div className="mx-auto mb-2 h-[2.5px] w-[42%] min-w-[180px] max-w-[280px] bg-black" />
        <p className="text-[11px] font-semibold leading-tight text-slate-900 sm:text-xs">
          {REPORT_COORDINATOR.name}
        </p>
        <p className="mt-0.5 text-[9px] leading-tight text-slate-600 sm:text-[10px]">
          {REPORT_COORDINATOR.title}
        </p>
      </footer>
    </article>
  )
}

/** Wrapper with border for modal preview */
export function AssessmentReportFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded border border-slate-300 bg-white shadow-md">
      {children}
    </div>
  )
}
