/**
 * Flood propagation worker — runs connectivity flood off the main thread.
 * Message: { type: 'propagate', grid, seeds, waterSurfaceM, maxCells }
 */
export type FloodWorkerRequest = {
  type: 'propagate'
  values: number[]
  cols: number
  rows: number
  seeds: number[]
  waterSurfaceM: number
  maxCells: number
}

export type FloodWorkerResponse = {
  type: 'result'
  flooded: number[]
  depths: number[]
}

self.onmessage = (event: MessageEvent<FloodWorkerRequest>) => {
  const { values, cols, rows, seeds, waterSurfaceM, maxCells } = event.data
  const flooded = new Set<number>()
  const depths = new Array(values.length).fill(0)
  const queue = [...seeds]

  for (const s of seeds) {
    if (values[s] < waterSurfaceM) {
      flooded.add(s)
      depths[s] = waterSurfaceM - values[s]
    }
  }

  let processed = 0
  while (queue.length > 0 && processed < maxCells) {
    const idx = queue.shift()!
    const r = Math.floor(idx / cols)
    const c = idx % cols
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue
        const rr = r + dr
        const cc = c + dc
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue
        const ni = rr * cols + cc
        if (flooded.has(ni)) continue
        if (values[ni] >= waterSurfaceM) continue
        flooded.add(ni)
        depths[ni] = waterSurfaceM - values[ni]
        queue.push(ni)
        processed += 1
        if (processed >= maxCells) break
      }
      if (processed >= maxCells) break
    }
  }

  const response: FloodWorkerResponse = {
    type: 'result',
    flooded: [...flooded],
    depths,
  }
  ;(self as unknown as Worker).postMessage(response)
}
