/**
 * Fetch or synthesize a DEM covering Lasam + upstream buffer.
 * Prefer OpenTopography SRTMGL1 when OPENTOPOGRAPHY_API_KEY is set;
 * otherwise generate a hydrologically plausible synthetic DEM for demos.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'data', 'terrain')
mkdirSync(outDir, { recursive: true })

/** Lasam municipal bbox + ~8 km upstream buffer */
export const DEM_EXTENT = {
  west: 121.35,
  south: 17.97,
  east: 121.68,
  north: 18.15,
}

const CELL_DEG = 0.0009 // ~100 m at this latitude
const RIVER_LNG = 121.5965
const CENTRO = { lng: 121.6015, lat: 18.0645 }

function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim()
    }
  }
}

function syntheticElevation(lng, lat) {
  // Base: lowland near Cagayan River (~8–16 m), rising east/west inland
  const distRiverKm = Math.abs(lng - RIVER_LNG) * 111
  const distCentroKm = Math.hypot((lng - CENTRO.lng) * 111, (lat - CENTRO.lat) * 111)
  let elev = 10 + distRiverKm * 1.8
  elev += Math.max(0, distCentroKm - 2) * 0.6
  // Gentle north–south slope into the valley
  elev += (18.15 - lat) * 25
  // Small undulation for visual terrain
  elev += Math.sin(lng * 400) * 1.2 + Math.cos(lat * 380) * 0.9
  // Poblacion terrace ~14–16 m (PhilAtlas)
  if (distCentroKm < 1.2) elev = 14.2 + distCentroKm * 1.5
  return Number(Math.max(2, elev).toFixed(2))
}

function buildElevationGrid() {
  const cols = Math.ceil((DEM_EXTENT.east - DEM_EXTENT.west) / CELL_DEG) + 1
  const rows = Math.ceil((DEM_EXTENT.north - DEM_EXTENT.south) / CELL_DEG) + 1
  const values = new Array(rows * cols)
  const slope = new Array(rows * cols)
  const flowDir = new Array(rows * cols)

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const lng = DEM_EXTENT.west + c * CELL_DEG
      const lat = DEM_EXTENT.north - r * CELL_DEG
      const i = r * cols + c
      values[i] = syntheticElevation(lng, lat)
    }
  }

  // Simple slope (degrees) + D8 flow toward lowest neighbor
  const D8 = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]
  const DIR_LABELS = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE']

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c
      let maxDrop = 0
      let best = 4 // E default
      for (let d = 0; d < D8.length; d += 1) {
        const rr = r + D8[d][0]
        const cc = c + D8[d][1]
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue
        const drop = values[i] - values[rr * cols + cc]
        if (drop > maxDrop) {
          maxDrop = drop
          best = d
        }
      }
      const cellM = CELL_DEG * 111000
      slope[i] = Number((Math.atan(maxDrop / cellM) * (180 / Math.PI)).toFixed(2))
      flowDir[i] = DIR_LABELS[best]
    }
  }

  return {
    type: 'ElevationGrid',
    crs: 'EPSG:4326',
    west: DEM_EXTENT.west,
    south: DEM_EXTENT.south,
    east: DEM_EXTENT.east,
    north: DEM_EXTENT.north,
    cellSizeDeg: CELL_DEG,
    cols,
    rows,
    values,
    slope,
    flowDir,
    source: 'synthetic-prototype',
    unit: 'meters',
  }
}

async function tryOpenTopography(apiKey) {
  const south = DEM_EXTENT.south
  const north = DEM_EXTENT.north
  const west = DEM_EXTENT.west
  const east = DEM_EXTENT.east
  const url =
    `https://portal.opentopography.org/API/globaldem?demtype=SRTMGL1` +
    `&south=${south}&north=${north}&west=${west}&east=${east}` +
    `&outputFormat=GTiff&API_Key=${apiKey}`

  console.log('Requesting SRTMGL1 from OpenTopography…')
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OpenTopography failed (${response.status})`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(join(outDir, 'lasam-dem.tif'), buffer)
  console.log(`Wrote lasam-dem.tif (${(buffer.length / 1e6).toFixed(1)} MB)`)
}

function writeMetadata(source) {
  const meta = {
    name: 'Lasam Terrain DEM',
    source,
    resolution_m: source === 'SRTMGL1' ? 30 : 90,
    vertical_datum: 'EGM96-approx',
    crs: 'EPSG:4326',
    extent: DEM_EXTENT,
    disclaimer:
      'Preliminary DEM for demonstration only. Replace with Copernicus GLO-30 / LiDAR DTM before official planning use.',
    generated_at: new Date().toISOString(),
  }
  writeFileSync(join(outDir, 'dem-metadata.json'), JSON.stringify(meta, null, 2))
}

async function main() {
  loadEnv()
  const apiKey = process.env.OPENTOPOGRAPHY_API_KEY

  let source = 'synthetic-prototype'
  if (apiKey) {
    try {
      await tryOpenTopography(apiKey)
      source = 'SRTMGL1'
    } catch (err) {
      console.warn(`OpenTopography unavailable (${err.message}); using synthetic DEM.`)
    }
  } else {
    console.log('No OPENTOPOGRAPHY_API_KEY — generating synthetic DEM grid for prototype.')
  }

  const grid = buildElevationGrid()
  writeFileSync(join(outDir, 'elevation-grid.json'), JSON.stringify(grid))
  writeMetadata(source)
  console.log(
    `Elevation grid: ${grid.cols}×${grid.rows} cells (~${(JSON.stringify(grid).length / 1e6).toFixed(1)} MB)`,
  )
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
