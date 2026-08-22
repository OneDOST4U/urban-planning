/**
 * DENR-MGB flood susceptibility helpers for Lasam.
 * Classes: low | moderate | high | very_high (from FloodSusc LF/MF/HF/VHF).
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import centroid from '@turf/centroid'
import bbox from '@turf/bbox'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { BuildingCollection, FloodExposure } from '@/types'

export type MgbSusceptibility = 'low' | 'moderate' | 'high' | 'very_high'

export const MGB_FLOOD_COLORS: Record<MgbSusceptibility, string> = {
  low: '#facc15',
  moderate: '#fb923c',
  high: '#ef4444',
  very_high: '#7f1d1d',
}

export const MGB_FLOOD_LEGEND: {
  key: MgbSusceptibility
  label: string
  color: string
  description: string
}[] = [
  {
    key: 'low',
    label: 'Low',
    color: MGB_FLOOD_COLORS.low,
    description: '≤ 0.5 m flood height, usually 1–3 days',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    color: MGB_FLOOD_COLORS.moderate,
    description: '> 0.5–1.0 m, usually 1–3 days',
  },
  {
    key: 'high',
    label: 'High',
    color: MGB_FLOOD_COLORS.high,
    description: '> 1–2 m, potentially > 3 days',
  },
  {
    key: 'very_high',
    label: 'Very High',
    color: MGB_FLOOD_COLORS.very_high,
    description: '> 2 m, potentially > 3 days',
  },
]

const RANK: Record<MgbSusceptibility, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
}

/** Map MGB class → existing FloodExposure used by building paint */
export function mgbToFloodExposure(susc: MgbSusceptibility | null | undefined): FloodExposure {
  if (!susc) return 'none'
  if (susc === 'very_high') return 'severe'
  if (susc === 'high') return 'high'
  if (susc === 'moderate') return 'moderate'
  return 'low'
}

export function floodExposureToMgbLabel(exposure: FloodExposure | undefined): string {
  switch (exposure) {
    case 'severe':
      return 'Very High (MGB)'
    case 'high':
      return 'High (MGB)'
    case 'moderate':
      return 'Moderate (MGB)'
    case 'low':
      return 'Low (MGB)'
    default:
      return 'Outside mapped flood susceptibility'
  }
}

export function getMgbSusceptibilityAtPoint(
  coords: [number, number],
  mgbFlood: FeatureCollection | null | undefined,
): MgbSusceptibility | null {
  if (!mgbFlood?.features?.length) return null

  let best: MgbSusceptibility | null = null
  let bestRank = 0

  for (const feature of mgbFlood.features) {
    if (
      feature.geometry?.type !== 'Polygon' &&
      feature.geometry?.type !== 'MultiPolygon'
    ) {
      continue
    }
    const susc = feature.properties?.susceptibility as MgbSusceptibility | undefined
    if (!susc || !RANK[susc]) continue
    try {
      if (booleanPointInPolygon(coords, feature as Feature<Polygon | MultiPolygon>)) {
        if (RANK[susc] > bestRank) {
          best = susc
          bestRank = RANK[susc]
        }
      }
    } catch {
      // skip invalid ring
    }
  }

  return best
}

function getApproximateCenter(feature: Feature): [number, number] {
  if (feature.geometry?.type === 'Polygon') {
    const ring = (feature.geometry as Polygon).coordinates[0]
    if (ring && ring.length > 0) {
      const mid = Math.floor(ring.length / 2)
      return [(ring[0][0] + ring[mid][0]) / 2, (ring[0][1] + ring[mid][1]) / 2]
    }
  }
  const center = centroid(feature)
  return center.geometry.coordinates as [number, number]
}

export function applyMgbFloodExposure(
  buildings: BuildingCollection,
  mgbFlood: FeatureCollection | null | undefined,
): BuildingCollection {
  if (!mgbFlood?.features?.length) {
    return {
      ...buildings,
      features: buildings.features.map((f) => ({
        ...f,
        properties: { ...f.properties, floodExposure: 'none' as FloodExposure, flood_depth_m: undefined },
      })),
    }
  }

  const floodIndex = mgbFlood.features
    .filter((f) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
    .map((f) => {
      const [minX, minY, maxX, maxY] = bbox(f)
      return {
        feature: f as Feature<Polygon | MultiPolygon>,
        susc: f.properties?.susceptibility as MgbSusceptibility | undefined,
        minX,
        minY,
        maxX,
        maxY,
      }
    })

  return {
    ...buildings,
    features: buildings.features.map((feature) => {
      const [lng, lat] = getApproximateCenter(feature)
      let bestSusc: MgbSusceptibility | null = null
      let bestRank = 0

      for (const item of floodIndex) {
        if (lng >= item.minX && lng <= item.maxX && lat >= item.minY && lat <= item.maxY) {
          if (item.susc && RANK[item.susc] > bestRank) {
            try {
              if (booleanPointInPolygon([lng, lat], item.feature)) {
                bestSusc = item.susc
                bestRank = RANK[item.susc]
              }
            } catch {
              // skip invalid ring
            }
          }
        }
      }

      const floodExposure = mgbToFloodExposure(bestSusc)
      return {
        ...feature,
        properties: {
          ...feature.properties,
          floodExposure,
          flood_depth_m: undefined,
        },
      }
    }),
  }
}

export function countMgbExposureByClass(
  buildings: BuildingCollection,
): Record<MgbSusceptibility | 'none', number> {
  const counts: Record<MgbSusceptibility | 'none', number> = {
    none: 0,
    low: 0,
    moderate: 0,
    high: 0,
    very_high: 0,
  }
  for (const f of buildings.features) {
    const exp = f.properties.floodExposure ?? 'none'
    if (exp === 'severe') counts.very_high += 1
    else if (exp === 'high') counts.high += 1
    else if (exp === 'moderate') counts.moderate += 1
    else if (exp === 'low') counts.low += 1
    else counts.none += 1
  }
  return counts
}

export function mgbFillColorExpression() {
  return [
    'match',
    ['get', 'susceptibility'],
    'low',
    MGB_FLOOD_COLORS.low,
    'moderate',
    MGB_FLOOD_COLORS.moderate,
    'high',
    MGB_FLOOD_COLORS.high,
    'very_high',
    MGB_FLOOD_COLORS.very_high,
    '#94a3b8',
  ] as const
}
