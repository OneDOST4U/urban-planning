import type { FeatureCollection } from 'geojson'
import { assessSeismic } from '@/lib/assessment/seismic'
import { assessVolcanic } from '@/lib/assessment/volcanic'
import { assessHydromet } from '@/lib/assessment/hydromet'
import type { SiteAssessmentInput, SiteAssessmentResult } from '@/types'

export interface AssessSiteContext {
  faults: FeatureCollection | null
  volcanoes: FeatureCollection | null
  mgbFlood?: FeatureCollection | null
}

export function assessSite(
  input: SiteAssessmentInput,
  ctx: AssessSiteContext,
): SiteAssessmentResult {
  const coords: [number, number] = [input.lng, input.lat]

  return {
    input,
    assessedAt: new Date().toISOString(),
    seismic: assessSeismic(coords, ctx.faults),
    volcanic: assessVolcanic(coords, ctx.volcanoes),
    hydromet: assessHydromet(coords, ctx.mgbFlood),
  }
}

export { isWithinLasamBbox, LASAM_ASSESS_BBOX } from '@/lib/assessment/format'
