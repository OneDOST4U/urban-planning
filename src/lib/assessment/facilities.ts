import distance from '@turf/distance'
import { point } from '@turf/turf'
import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import { formatFacilityDistance } from '@/lib/assessment/format'
import type { AssessmentRow } from '@/types'

export type FacilityCategory =
  | 'emergency_response'
  | 'govt_health'
  | 'public_school'
  | 'primary_road'

const CATEGORY_LABELS: Record<FacilityCategory, string> = {
  emergency_response: 'Nearest Emergency / Disaster Facility',
  govt_health: 'Nearest Government Health Facility',
  public_school: 'Nearest Public Educational Facility',
  primary_road: 'Nearest Primary Road Network',
}

function facilityName(props: Record<string, unknown> | null | undefined): string {
  if (!props) return 'Unnamed'
  return String(props.name ?? props.highway ?? 'Unnamed facility')
}

function nearestInCategory(
  site: [number, number],
  facilities: FeatureCollection | null,
  category: FacilityCategory,
): { name: string; distanceM: number } | null {
  if (!facilities?.features?.length) return null

  const from = point(site)
  let best: { name: string; distanceM: number } | null = null

  for (const f of facilities.features) {
    if (String(f.properties?.category) !== category) continue
    if (!f.geometry) continue

    let distM: number
    if (f.geometry.type === 'Point') {
      distM = distance(from, f as Feature<Point>, { units: 'meters' })
    } else if (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') {
      const nearest = nearestPointOnLine(f as Feature<LineString | MultiLineString>, from)
      distM = distance(from, nearest, { units: 'meters' })
    } else {
      continue
    }

    const name = facilityName(f.properties as Record<string, unknown>)
    if (!best || distM < best.distanceM) best = { name, distanceM: distM }
  }

  return best
}

export function assessFacilities(
  coords: [number, number],
  facilities: FeatureCollection | null,
): AssessmentRow[] {
  const order: FacilityCategory[] = [
    'emergency_response',
    'govt_health',
    'public_school',
    'primary_road',
  ]

  const rows: AssessmentRow[] = []

  for (const category of order) {
    const nearest = nearestInCategory(coords, facilities, category)
    if (!nearest) continue

    rows.push({
      label: CATEGORY_LABELS[category],
      value: formatFacilityDistance(nearest.name, nearest.distanceM),
    })
  }

  if (rows.length === 0) {
    return [
      {
        label: 'Nearby Critical Facilities',
        value: 'No validated facility data within assessment radius',
      },
    ]
  }

  return rows
}
