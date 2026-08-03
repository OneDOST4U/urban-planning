import { getTypeColor } from '@/lib/buildings/colors'
import type { BuildingCollection, SimulationStats } from '@/types'

export function computeStats(buildings: BuildingCollection): SimulationStats {
  let floodAffected = 0
  let faultExposed = 0
  let earthquakeAffected = 0
  let lowRisk = 0
  let moderateRisk = 0
  let highRisk = 0

  for (const feature of buildings.features) {
    const { floodExposure, earthquakeDamage, faultDistance } = feature.properties

    if (floodExposure && floodExposure !== 'none') floodAffected += 1
    if (earthquakeDamage && earthquakeDamage !== 'minimal') earthquakeAffected += 1
    if (faultDistance !== undefined && faultDistance <= 500) faultExposed += 1

    const riskScore =
      (floodExposure === 'high' || floodExposure === 'severe' ? 2 : floodExposure === 'moderate' ? 1 : 0) +
      (earthquakeDamage === 'severe' || earthquakeDamage === 'critical' ? 2 : earthquakeDamage === 'moderate' ? 1 : 0) +
      (faultDistance !== undefined && faultDistance <= 250 ? 1 : 0)

    if (riskScore >= 3) highRisk += 1
    else if (riskScore >= 1) moderateRisk += 1
    else lowRisk += 1
  }

  return {
    totalBuildings: buildings.features.length,
    floodAffected,
    faultExposed,
    earthquakeAffected,
    lowRisk,
    moderateRisk,
    highRisk,
  }
}

export function getBuildingColor(
  floodExposure: string | undefined,
  earthquakeDamage: string | undefined,
  faultDistance: number | undefined,
  hazardMode: string | undefined,
  baseColor?: string,
  buildingType?: string,
): string {
  const defaultColor = baseColor ?? getTypeColor(buildingType ?? 'Residential')

  if (hazardMode === 'flood' && floodExposure && floodExposure !== 'none') {
    const colors: Record<string, string> = {
      low: '#facc15',
      moderate: '#fb923c',
      high: '#ef4444',
      severe: '#991b1b',
    }
    return colors[floodExposure] ?? defaultColor
  }

  if (hazardMode === 'earthquake' && earthquakeDamage && earthquakeDamage !== 'minimal') {
    const colors: Record<string, string> = {
      light: '#facc15',
      moderate: '#fb923c',
      severe: '#ef4444',
      critical: '#991b1b',
    }
    return colors[earthquakeDamage] ?? defaultColor
  }

  if (hazardMode === 'fault' && faultDistance !== undefined && faultDistance <= 500) {
    return faultDistance <= 250 ? '#ef4444' : '#fb923c'
  }

  return defaultColor
}
