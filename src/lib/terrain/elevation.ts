import type { ElevationGrid, TerrainSample } from '@/types'

export function sampleElevation(
  grid: ElevationGrid,
  lng: number,
  lat: number,
): { elevation: number | null; slope: number | null; flowDir: string | null } {
  const { west, north, cellSizeDeg, cols, rows, values, slope, flowDir } = grid
  const c = (lng - west) / cellSizeDeg
  const r = (north - lat) / cellSizeDeg
  if (c < 0 || r < 0 || c >= cols - 1 || r >= rows - 1) {
    return { elevation: null, slope: null, flowDir: null }
  }

  const c0 = Math.floor(c)
  const r0 = Math.floor(r)
  const fc = c - c0
  const fr = r - r0
  const i00 = r0 * cols + c0
  const i10 = r0 * cols + c0 + 1
  const i01 = (r0 + 1) * cols + c0
  const i11 = (r0 + 1) * cols + c0 + 1

  const elev =
    values[i00] * (1 - fc) * (1 - fr) +
    values[i10] * fc * (1 - fr) +
    values[i01] * (1 - fc) * fr +
    values[i11] * fc * fr

  return {
    elevation: Number(elev.toFixed(2)),
    slope: slope?.[i00] ?? null,
    flowDir: flowDir?.[i00] ?? null,
  }
}

export function cellIndex(grid: ElevationGrid, lng: number, lat: number): number | null {
  const c = Math.floor((lng - grid.west) / grid.cellSizeDeg)
  const r = Math.floor((grid.north - lat) / grid.cellSizeDeg)
  if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return null
  return r * grid.cols + c
}

export function cellCenter(grid: ElevationGrid, index: number): [number, number] {
  const r = Math.floor(index / grid.cols)
  const c = index % grid.cols
  const lng = grid.west + (c + 0.5) * grid.cellSizeDeg
  const lat = grid.north - (r + 0.5) * grid.cellSizeDeg
  return [lng, lat]
}

export function buildTerrainSample(
  grid: ElevationGrid,
  lng: number,
  lat: number,
  extras?: Partial<TerrainSample>,
): TerrainSample {
  const sample = sampleElevation(grid, lng, lat)
  return {
    lng,
    lat,
    elevation: sample.elevation,
    slope: sample.slope,
    flowDir: sample.flowDir,
    nearestRiver: extras?.nearestRiver ?? null,
    nearestRiverM: extras?.nearestRiverM ?? null,
    barangay: extras?.barangay ?? null,
  }
}
