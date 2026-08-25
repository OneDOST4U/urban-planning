import distance from '@turf/distance'
import { point } from '@turf/turf'
import type { FeatureCollection, Point } from 'geojson'
import { CAGUA_CENTER, CAGUA_NAME } from '@/lib/simulation/volcano'
import {
  bearingToDirection,
  formatApproxDistanceKm,
} from '@/lib/assessment/format'
import type { AssessmentRow } from '@/types'
import bearing from '@turf/bearing'

type VolcanoStatus = 'Active' | 'Potentially Active' | 'Inactive'

interface NearestVolcano {
  name: string
  status: VolcanoStatus
  distanceKm: number
  bearing: number
}

function collectVolcanoes(inventory: FeatureCollection | null): {
  name: string
  status: VolcanoStatus
  coords: [number, number]
}[] {
  const fallback = [
    {
      name: CAGUA_NAME,
      status: 'Active' as const,
      coords: CAGUA_CENTER,
    },
  ]

  if (!inventory?.features?.length) return fallback

  const list = inventory.features
    .filter((f) => f.geometry?.type === 'Point')
    .map((f) => {
      const status = String(f.properties?.status ?? 'Active') as VolcanoStatus
      const name = String(f.properties?.name ?? 'Volcano')
      const coords = (f.geometry as Point).coordinates as [number, number]
      return { name, status, coords }
    })

  return list.length ? list : fallback
}

function nearestByStatus(
  site: [number, number],
  volcanoes: ReturnType<typeof collectVolcanoes>,
  status: VolcanoStatus,
): NearestVolcano | null {
  let best: NearestVolcano | null = null
  const from = point(site)
  for (const v of volcanoes) {
    if (v.status !== status) continue
    const distKm = distance(from, point(v.coords), { units: 'kilometers' })
    const brg = bearing(from, point(v.coords))
    if (!best || distKm < best.distanceKm) {
      best = { name: v.name, status, distanceKm: distKm, bearing: brg }
    }
  }
  return best
}

function describeVolcano(n: NearestVolcano | null, farKm: number, farNote: string): string {
  if (!n) return 'No data available'
  const direction = bearingToDirection((n.bearing + 180) % 360)
  const base = formatApproxDistanceKm(n.distanceKm, direction, n.name)
  if (n.distanceKm > farKm) return `${base}; ${farNote}`
  return base
}

function ashfallFromCaguaKm(distKm: number): string {
  if (distKm < 60) return 'Prone'
  if (distKm < 100) return 'Moderate'
  return 'Low'
}

export function assessVolcanic(
  coords: [number, number],
  inventory: FeatureCollection | null,
): AssessmentRow[] {
  const volcanoes = collectVolcanoes(inventory)
  const active = nearestByStatus(coords, volcanoes, 'Active')

  const cagua = volcanoes.find((v) => /cagua/i.test(v.name)) ?? {
    name: CAGUA_NAME,
    status: 'Active' as const,
    coords: CAGUA_CENTER,
  }
  const caguaKm = distance(point(coords), point(cagua.coords), { units: 'kilometers' })

  return [
    {
      label: 'Nearest Active Volcano',
      value: describeVolcano(active, 100, 'No immediate volcanic hazard threat'),
    },
    { label: 'Ashfall', value: ashfallFromCaguaKm(caguaKm) },
  ]
}
