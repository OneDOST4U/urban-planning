import type { FloodWorkerRequest, FloodWorkerResponse } from '@/workers/flood-propagate.worker'
import type { ElevationGrid } from '@/types'

/** Run flood propagation in a Web Worker when available; falls back to sync. */
export function propagateFloodAsync(
  grid: ElevationGrid,
  seeds: number[],
  waterSurfaceM: number,
  maxCells: number,
): Promise<{ flooded: number[]; depths: number[] }> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve(runSync(grid, seeds, waterSurfaceM, maxCells))
  }

  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../workers/flood-propagate.worker.ts', import.meta.url),
        { type: 'module' },
      )
      const payload: FloodWorkerRequest = {
        type: 'propagate',
        values: grid.values,
        cols: grid.cols,
        rows: grid.rows,
        seeds,
        waterSurfaceM,
        maxCells,
      }
      worker.onmessage = (event: MessageEvent<FloodWorkerResponse>) => {
        resolve({ flooded: event.data.flooded, depths: event.data.depths })
        worker.terminate()
      }
      worker.onerror = (err) => {
        worker.terminate()
        reject(err)
      }
      worker.postMessage(payload)
    } catch {
      resolve(runSync(grid, seeds, waterSurfaceM, maxCells))
    }
  })
}

function runSync(
  grid: ElevationGrid,
  seeds: number[],
  waterSurfaceM: number,
  maxCells: number,
) {
  const flooded = new Set<number>()
  const depths = new Array(grid.values.length).fill(0)
  const queue = [...seeds]
  for (const s of seeds) {
    if (grid.values[s] < waterSurfaceM) {
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
      }
    }
  }
  return { flooded: [...flooded], depths }
}
