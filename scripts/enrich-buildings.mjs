/**
 * Enrich building footprints with ground elevation from elevation-grid.json.
 * Uses minimum elevation among polygon vertices (and centroid).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const gridPath = join(root, 'public', 'data', 'terrain', 'elevation-grid.json')
const buildingsPath = join(root, 'public', 'data', 'administrative', 'lasam-buildings.geojson')
const legacyBuildingsPath = join(root, 'public', 'data', 'lasam-buildings.geojson')
const riversPath = join(root, 'public', 'data', 'hydrology', 'rivers-main.geojson')
const tributariesPath = join(root, 'public', 'data', 'hydrology', 'rivers-tributaries.geojson')

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function sampleGrid(grid, lng, lat) {
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

function minElevationUnderFootprint(grid, ring) {
  let minElev = Infinity
  let sample = null
  const points = [...ring]
  // centroid
  let lngSum = 0
  let latSum = 0
  const n = ring.length - 1
  for (let i = 0; i < n; i += 1) {
    lngSum += ring[i][0]
    latSum += ring[i][1]
  }
  points.push([lngSum / n, latSum / n])

  for (const [lng, lat] of points) {
    const s = sampleGrid(grid, lng, lat)
    if (s.elevation != null && s.elevation < minElev) {
      minElev = s.elevation
      sample = s
    }
  }
  return sample ?? { elevation: 15, slope: 0, flowDir: 'SE' }
}

function haversineM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function nearestRiver(centroid, rivers) {
  let best = { distance: Infinity, name: null }
  for (const river of rivers) {
    const coords = river.geometry.coordinates
    for (const pt of coords) {
      const d = haversineM(centroid, pt)
      if (d < best.distance) {
        best = { distance: d, name: river.properties.name ?? river.properties.waterway }
      }
    }
  }
  return {
    nearest_river_m: Number(best.distance.toFixed(0)),
    nearest_river_name: best.name,
  }
}

function centroidOfRing(ring) {
  let lng = 0
  let lat = 0
  const n = ring.length - 1
  for (let i = 0; i < n; i += 1) {
    lng += ring[i][0]
    lat += ring[i][1]
  }
  return [lng / n, lat / n]
}

function main() {
  if (!existsSync(gridPath)) {
    throw new Error('elevation-grid.json missing — run npm run fetch:dem first')
  }

  const sourcePath = existsSync(buildingsPath) ? buildingsPath : legacyBuildingsPath
  const buildings = loadJson(sourcePath)
  const grid = loadJson(gridPath)

  let rivers = []
  if (existsSync(riversPath)) rivers = loadJson(riversPath).features ?? []
  if (existsSync(tributariesPath)) {
    rivers = rivers.concat(loadJson(tributariesPath).features ?? [])
  }

  let enriched = 0
  for (const feature of buildings.features) {
    const ring = feature.geometry.coordinates[0]
    const sample = minElevationUnderFootprint(grid, ring)
    const height = feature.properties.height ?? 3
    const ground = sample.elevation ?? 15
    const center = centroidOfRing(ring)
    const riverInfo = rivers.length ? nearestRiver(center, rivers) : {}

    feature.properties = {
      ...feature.properties,
      ground_elevation_m: ground,
      roof_elevation_m: Number((ground + height).toFixed(2)),
      drainage_direction: sample.flowDir ?? 'SE',
      slope_deg: sample.slope,
      ...riverInfo,
    }
    enriched += 1
  }

  writeFileSync(buildingsPath, JSON.stringify(buildings))
  writeFileSync(legacyBuildingsPath, JSON.stringify(buildings))
  console.log(`Enriched ${enriched} buildings with ground elevation`)
}

main()
