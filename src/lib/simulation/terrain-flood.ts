import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { cellCenter, cellIndex, sampleElevation } from '@/lib/terrain/elevation'
import type { BuildingCollection, ElevationGrid, FloodExposure } from '@/types'

export interface FloodPropagationResult {
  waterSurfaceM: number
  floodedIndices: number[]
  depths: Float32Array
  inundation: FeatureCollection
  progress: number
}

function exposureFromDepth(depth: number): FloodExposure {
  if (depth <= 0) return 'none'
  if (depth >= 4) return 'severe'
  if (depth >= 3) return 'high'
  if (depth >= 2) return 'moderate'
  if (depth >= 1) return 'low'
  return 'low'
}

/** Seed flood cells along river lines where ground < water surface. */
export function seedRiverCells(
  grid: ElevationGrid,
  rivers: FeatureCollection,
  waterSurfaceM: number,
): number[] {
  const seeds = new Set<number>()
  for (const feature of rivers.features) {
    if (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString') continue
    const lines =
      feature.geometry.type === 'LineString'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    for (const line of lines) {
      for (const [lng, lat] of line as [number, number][]) {
        const idx = cellIndex(grid, lng, lat)
        if (idx == null) continue
        if (grid.values[idx] < waterSurfaceM) seeds.add(idx)
        // also seed neighbors
        const r = Math.floor(idx / grid.cols)
        const c = idx % grid.cols
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            const rr = r + dr
            const cc = c + dc
            if (rr < 0 || cc < 0 || rr >= grid.rows || cc >= grid.cols) continue
            const ni = rr * grid.cols + cc
            if (grid.values[ni] < waterSurfaceM) seeds.add(ni)
          }
        }
      }
    }
  }
  return [...seeds]
}

/**
 * Connectivity flood fill: expand from river seeds into cells below water surface.
 * `maxCells` limits work per call for animation steps.
 */
export function propagateFlood(
  grid: ElevationGrid,
  seeds: number[],
  waterSurfaceM: number,
  maxCells = Infinity,
  alreadyFlooded?: Set<number>,
): { flooded: Set<number>; depths: Float32Array } {
  const flooded = alreadyFlooded ? new Set(alreadyFlooded) : new Set<number>()
  const depths = new Float32Array(grid.values.length)
  const queue = [...seeds]

  for (const s of seeds) {
    if (!flooded.has(s) && grid.values[s] < waterSurfaceM) {
      flooded.add(s)
      depths[s] = waterSurfaceM - grid.values[s]
    }
  }

  let processed = 0
  while (queue.length > 0 && processed < maxCells) {
    const idx = queue.shift()!
    const r = Math.floor(idx / grid.cols)
    const c = idx % grid.cols
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue
        const rr = r + dr
        const cc = c + dc
        if (rr < 0 || cc < 0 || rr >= grid.rows || cc >= grid.cols) continue
        const ni = rr * grid.cols + cc
        if (flooded.has(ni)) continue
        if (grid.values[ni] >= waterSurfaceM) continue
        flooded.add(ni)
        depths[ni] = waterSurfaceM - grid.values[ni]
        queue.push(ni)
        processed += 1
        if (processed >= maxCells) break
      }
      if (processed >= maxCells) break
    }
  }

  return { flooded, depths }
}

/** Convert flooded cells to a MultiPolygon of cell squares (simplified). */
export function floodedCellsToGeoJSON(
  grid: ElevationGrid,
  flooded: Iterable<number>,
): FeatureCollection {
  const features: Feature[] = []
  const half = grid.cellSizeDeg / 2
  for (const idx of flooded) {
    const [lng, lat] = cellCenter(grid, idx)
    features.push({
      type: 'Feature',
      properties: {
        elevation: grid.values[idx],
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - half, lat - half],
          [lng + half, lat - half],
          [lng + half, lat + half],
          [lng - half, lat + half],
          [lng - half, lat - half],
        ]],
      },
    })
  }
  return { type: 'FeatureCollection', features }
}

/** Merge flooded cells into a single polygon envelope (faster for large fills). */
export function floodedExtentPolygon(
  grid: ElevationGrid,
  flooded: number[],
): Feature<Polygon> | null {
  if (flooded.length === 0) return null
  let minC = Infinity
  let maxC = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  for (const idx of flooded) {
    const r = Math.floor(idx / grid.cols)
    const c = idx % grid.cols
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
  }
  const west = grid.west + minC * grid.cellSizeDeg
  const east = grid.west + (maxC + 1) * grid.cellSizeDeg
  const north = grid.north - minR * grid.cellSizeDeg
  const south = grid.north - (maxR + 1) * grid.cellSizeDeg
  return {
    type: 'Feature',
    properties: { name: 'Terrain-connected inundation (preliminary)' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ]],
    },
  }
}

export function applyTerrainFloodToBuildings(
  buildings: BuildingCollection,
  grid: ElevationGrid,
  flooded: Set<number>,
  waterSurfaceM: number,
): BuildingCollection {
  return {
    ...buildings,
    features: buildings.features.map((feature) => {
      const ground =
        feature.properties.ground_elevation_m ??
        sampleElevation(
          grid,
          feature.geometry.coordinates[0][0][0],
          feature.geometry.coordinates[0][0][1],
        ).elevation ??
        15

      // Building flooded if ground below water AND near a flooded cell (or directly below water if river-connected area)
      const ring = feature.geometry.coordinates[0]
      let nearFlood = false
      for (const [lng, lat] of ring) {
        const idx = cellIndex(grid, lng, lat)
        if (idx != null && flooded.has(idx)) {
          nearFlood = true
          break
        }
      }

      const depth = nearFlood && ground < waterSurfaceM ? waterSurfaceM - ground : 0
      const floodExposure = exposureFromDepth(depth)

      return {
        ...feature,
        properties: {
          ...feature.properties,
          ground_elevation_m: ground,
          flood_depth_m: Number(depth.toFixed(2)),
          floodExposure,
        },
      }
    }),
  }
}

export function runTerrainFloodScenario(
  grid: ElevationGrid,
  rivers: FeatureCollection,
  riverStageM: number,
  riverRiseM: number,
  maxWaterElevationM: number,
  progress = 1,
): FloodPropagationResult {
  const waterSurfaceM = Math.min(riverStageM + riverRiseM, maxWaterElevationM)
  if (waterSurfaceM <= 0 || riverRiseM <= 0) {
    return {
      waterSurfaceM,
      floodedIndices: [],
      depths: new Float32Array(grid.values.length),
      inundation: { type: 'FeatureCollection', features: [] },
      progress: 0,
    }
  }

  const seeds = seedRiverCells(grid, rivers, waterSurfaceM)
  // Limit cells by progress for animation (0–1)
  const maxCells = Math.max(50, Math.floor(seeds.length + progress * grid.values.length * 0.15))
  const { flooded, depths } = propagateFlood(grid, seeds, waterSurfaceM, maxCells)
  const indices = [...flooded]

  // Prefer cell polygons when small; use extent when large for performance
  const inundation =
    indices.length < 2500
      ? floodedCellsToGeoJSON(grid, indices)
      : {
          type: 'FeatureCollection' as const,
          features: floodedExtentPolygon(grid, indices)
            ? [floodedExtentPolygon(grid, indices)!]
            : [],
        }

  return {
    waterSurfaceM,
    floodedIndices: indices,
    depths,
    inundation,
    progress,
  }
}

export function floodStatusLabel(exposure: FloodExposure): string {
  const labels: Record<FloodExposure, string> = {
    none: 'Not Affected',
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    severe: 'Severe Exposure',
  }
  return labels[exposure]
}

export function getFloodDepthAtBuildingFromProps(building: {
  properties: { flood_depth_m?: number }
}): number {
  return building.properties.flood_depth_m ?? 0
}
