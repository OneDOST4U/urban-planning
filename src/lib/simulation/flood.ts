/**
 * Compatibility wrapper — prefer terrain-flood for new logic.
 * Keeps legacy polygon API available during migration.
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { centroid } from '@turf/turf'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { FLOOD_COLORS } from '@/lib/constants'
import {
  applyTerrainFloodToBuildings,
  floodStatusLabel as terrainFloodStatusLabel,
  runTerrainFloodScenario,
} from '@/lib/simulation/terrain-flood'
import type { BuildingCollection, ElevationGrid, FloodExposure } from '@/types'

export { terrainFloodStatusLabel as floodStatusLabel }

export function getFloodExposure(
  building: Feature<Polygon>,
  floodZone: Feature<Polygon>,
  waterDepth: number,
): FloodExposure {
  if (waterDepth <= 0) return 'none'
  const center = centroid(building)
  const inZone = booleanPointInPolygon(center, floodZone)
  if (!inZone) return 'none'
  if (waterDepth >= 4) return 'severe'
  if (waterDepth >= 3) return 'high'
  if (waterDepth >= 2) return 'moderate'
  if (waterDepth >= 1) return 'low'
  return 'low'
}

export function floodExposureColor(exposure: FloodExposure): string {
  return FLOOD_COLORS[exposure]
}

/** Legacy static-zone flood (fallback when no elevation grid). */
export function applyFloodSimulation(
  buildings: BuildingCollection,
  floodZone: Feature<Polygon>,
  waterDepth: number,
): BuildingCollection {
  return {
    ...buildings,
    features: buildings.features.map((feature) => {
      const floodExposure = getFloodExposure(feature, floodZone, waterDepth)
      const multipliers: Record<FloodExposure, number> = {
        none: 0,
        low: 0.4,
        moderate: 0.65,
        high: 0.85,
        severe: 1,
      }
      return {
        ...feature,
        properties: {
          ...feature.properties,
          floodExposure,
          flood_depth_m: Number((waterDepth * multipliers[floodExposure]).toFixed(2)),
        },
      }
    }),
  }
}

export function applyTerrainAwareFlood(
  buildings: BuildingCollection,
  grid: ElevationGrid,
  rivers: FeatureCollection,
  riverStageM: number,
  riverRiseM: number,
  maxWaterElevationM: number,
  progress = 1,
) {
  const result = runTerrainFloodScenario(
    grid,
    rivers,
    riverStageM,
    riverRiseM,
    maxWaterElevationM,
    progress,
  )
  const flooded = new Set(result.floodedIndices)
  const updated = applyTerrainFloodToBuildings(
    buildings,
    grid,
    flooded,
    result.waterSurfaceM,
  )
  return { buildings: updated, inundation: result.inundation, waterSurfaceM: result.waterSurfaceM }
}

export function countFloodAffected(buildings: BuildingCollection): number {
  return buildings.features.filter(
    (f) => f.properties.floodExposure && f.properties.floodExposure !== 'none',
  ).length
}

export function getFloodDepthAtBuilding(
  building: Feature<Polygon> & { properties: { flood_depth_m?: number; floodExposure?: FloodExposure } },
  floodZone: Feature<Polygon>,
  waterDepth: number,
): number {
  if (building.properties.flood_depth_m != null) return building.properties.flood_depth_m
  const exposure = getFloodExposure(building, floodZone, waterDepth)
  if (exposure === 'none') return 0
  const multipliers: Record<FloodExposure, number> = {
    none: 0,
    low: 0.4,
    moderate: 0.65,
    high: 0.85,
    severe: 1,
  }
  return Number((waterDepth * multipliers[exposure]).toFixed(2))
}
