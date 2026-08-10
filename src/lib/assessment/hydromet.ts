import distance from '@turf/distance'
import { point } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import { COAST_REFERENCE } from '@/lib/assessment/format'
import { getMgbSusceptibilityAtPoint, MGB_FLOOD_LEGEND } from '@/lib/simulation/mgbFlood'
import type { AssessmentRow } from '@/types'

/** PAGASA-style severe wind text for Cagayan Valley (demonstration copy). */
export const SEVERE_WIND_DEMO =
  '117.1 - 220 kph (20-year return period); 220.1 - 270 kph (500-year return period)'

export function assessHydromet(
  coords: [number, number],
  mgbFlood?: FeatureCollection | null,
): AssessmentRow[] {
  const coastKm = distance(point(coords), point(COAST_REFERENCE), { units: 'kilometers' })
  const stormSurge = coastKm > 15 ? 'Safe' : 'Prone'

  const susc = getMgbSusceptibilityAtPoint(coords, mgbFlood)
  let floodValue: string
  if (!mgbFlood?.features?.length) {
    floodValue = 'Unavailable — run npm run fetch:flood to load MGB susceptibility'
  } else if (!susc) {
    floodValue = 'Outside mapped MGB flood susceptibility (or Safe)'
  } else {
    const entry = MGB_FLOOD_LEGEND.find((e) => e.key === susc)
    floodValue = entry
      ? `${entry.label} — ${entry.description}`
      : susc
  }

  return [
    { label: 'Flood (MGB)', value: floodValue },
    { label: 'Storm Surge (PAGASA)', value: stormSurge },
    { label: 'Severe Wind (PAGASA)', value: SEVERE_WIND_DEMO },
  ]
}
