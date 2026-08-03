import type { ElevationGrid } from '@/types'
import { sampleElevation } from '@/lib/terrain/elevation'

/** Thin wrapper around elevation-grid.json for flood sampling. */
export class FloodGrid {
  constructor(public readonly grid: ElevationGrid) {}

  get cols() {
    return this.grid.cols
  }

  get rows() {
    return this.grid.rows
  }

  elevationAt(lng: number, lat: number): number | null {
    return sampleElevation(this.grid, lng, lat).elevation
  }

  index(lng: number, lat: number): number | null {
    const c = Math.floor((lng - this.grid.west) / this.grid.cellSizeDeg)
    const r = Math.floor((this.grid.north - lat) / this.grid.cellSizeDeg)
    if (c < 0 || r < 0 || c >= this.grid.cols || r >= this.grid.rows) return null
    return r * this.grid.cols + c
  }
}
