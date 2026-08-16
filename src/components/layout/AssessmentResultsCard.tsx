import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssessmentRow, SiteAssessmentResult } from '@/types'

function ResultSection({
  title,
  rows,
  report,
}: {
  title: string
  rows: AssessmentRow[]
  report?: boolean
}) {
  return (
    <div className={report ? 'space-y-1' : 'space-y-1'}>
      <h4
        className={
          report
            ? 'text-[10px] font-bold tracking-wide text-teal-800'
            : 'text-[11px] font-bold tracking-wide text-teal-800'
        }
      >
        {title}
      </h4>
      <div className="overflow-hidden rounded border border-slate-200">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-2 border-b border-slate-100 px-2.5 last:border-0 ${
              report ? 'py-1.5 text-[10px]' : 'py-1.5 text-[11px]'
            } ${report && index % 2 === 0 ? 'bg-slate-50' : ''}`}
          >
            <span className="font-medium leading-snug text-slate-600">{row.label}</span>
            <span className="text-right font-semibold leading-snug text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface AssessmentResultsCardProps {
  result: SiteAssessmentResult | null
  /** Inline inside map popup — no outer Card wrapper */
  compact?: boolean
  /** Tighter rows for A4 report export */
  report?: boolean
}

export function AssessmentResultsCard({
  result,
  compact = false,
  report = false,
}: AssessmentResultsCardProps) {
  if (!result) {
    if (compact) {
      return (
        <p className="text-xs text-slate-500">
          Results appear here after you assess a site.
        </p>
      )
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Enter coordinates and building type, then click Assess site to generate a Hazard
            Hunter–style report for the proposed location.
          </p>
        </CardContent>
      </Card>
    )
  }

  const body = (
    <>
      {!report && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-900">
          Demonstration only — not an official PHIVOLCS / MGB / PAGASA certificate. MGB flood
          susceptibility for Lasam is loaded from DENR-MGB (clipped to PSA boundary).
        </div>
      )}
      {!report && (
        <div className="rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700">
          <div>
            Proposed: <strong>{result.input.buildingType}</strong>
          </div>
          <div>
            Site: {result.input.lat.toFixed(5)}, {result.input.lng.toFixed(5)}
          </div>
        </div>
      )}
      <ResultSection title="SEISMIC HAZARD ASSESSMENT" rows={result.seismic} report={report} />
      <ResultSection title="VOLCANIC HAZARD ASSESSMENT" rows={result.volcanic} report={report} />
      <ResultSection
        title="HYDRO-METEOROLOGICAL HAZARD ASSESSMENT"
        rows={result.hydromet}
        report={report}
      />
    </>
  )

  if (report) {
    return <div className="space-y-2.5">{body}</div>
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-900">Assessment Results</p>
        {body}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{body}</CardContent>
    </Card>
  )
}
