/**
 * Fetch OSM waterways for Lasam municipality and write hydrology GeoJSON layers.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'data', 'hydrology')
mkdirSync(outDir, { recursive: true })

const LASAM_RELATION_AREA_ID = 3619879891

const QUERY = `
[out:json][timeout:180];
area(${LASAM_RELATION_AREA_ID})->.lasam;
(
  way["waterway"~"^(river|stream|canal|drain|ditch|tidal_channel)$"](area.lasam);
  relation["waterway"~"^(river|stream|canal)$"](area.lasam);
);
out geom;
`.trim()

async function fetchOsm() {
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(QUERY)}`,
    {
      headers: {
        'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
        Accept: 'application/json',
      },
    },
  )
  if (!response.ok) throw new Error(`Overpass failed (${response.status})`)
  return response.json()
}

function wayToCoords(way) {
  if (!way.geometry?.length) return null
  const coords = way.geometry.map((n) => [n.lon, n.lat])
  return coords.length >= 2 ? coords : null
}

function classify(tags) {
  const w = tags.waterway ?? 'stream'
  if (w === 'river') return 'main'
  if (w === 'stream' || w === 'tidal_channel') return 'tributary'
  return 'drainage'
}

function convert(elements) {
  const main = []
  const tributaries = []
  const drainage = []
  let id = 1

  for (const el of elements) {
    if (el.type !== 'way' || !el.tags?.waterway) continue
    const coords = wayToCoords(el)
    if (!coords) continue

    const kind = classify(el.tags)
    const feature = {
      type: 'Feature',
      properties: {
        id: `LAS-RIV-${String(id).padStart(4, '0')}`,
        name: el.tags.name ?? el.tags.waterway,
        waterway: el.tags.waterway,
        class: kind,
        osm_id: el.id,
        data_source: 'OpenStreetMap',
      },
      geometry: { type: 'LineString', coordinates: coords },
    }
    id += 1

    if (kind === 'main') main.push(feature)
    else if (kind === 'tributary') tributaries.push(feature)
    else drainage.push(feature)
  }

  return { main, tributaries, drainage }
}

function lengthKm(coords) {
  let sum = 0
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dx = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180)
    const dy = (lat2 - lat1) * 111
    sum += Math.hypot(dx, dy)
  }
  return Number(sum.toFixed(3))
}

function bufferBanks(rivers, bufferDeg = 0.00025) {
  // Simple rectangular corridor around each segment as a bank stub
  const features = []
  for (const river of rivers) {
    const coords = river.geometry.coordinates
    if (coords.length < 2) continue
    const ring = []
    for (let i = 0; i < coords.length; i += 1) {
      ring.push([coords[i][0] - bufferDeg, coords[i][1] + bufferDeg * 0.3])
    }
    for (let i = coords.length - 1; i >= 0; i -= 1) {
      ring.push([coords[i][0] + bufferDeg, coords[i][1] - bufferDeg * 0.3])
    }
    ring.push(ring[0])
    features.push({
      type: 'Feature',
      properties: {
        name: `${river.properties.name} banks`,
        parent_id: river.properties.id,
        data_source: 'Derived buffer (stub)',
      },
      geometry: { type: 'Polygon', coordinates: [ring] },
    })
  }
  return features
}

function watershedStub() {
  // Approximate Lasam sub-basin as municipal bbox (replace with HydroSHEDS later)
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        name: 'Lasam contributing watershed (approximate)',
        data_source: 'Municipal bbox stub — replace with HydroSHEDS',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.35, 17.97],
          [121.68, 17.97],
          [121.68, 18.15],
          [121.35, 18.15],
          [121.35, 17.97],
        ]],
      },
    }],
  }
}

async function main() {
  console.log('Fetching OSM waterways for Lasam…')
  const osm = await fetchOsm()
  const { main, tributaries, drainage } = convert(osm.elements ?? [])

  for (const f of [...main, ...tributaries, ...drainage]) {
    f.properties.length_km = lengthKm(f.geometry.coordinates)
  }

  writeFileSync(join(outDir, 'rivers-main.geojson'), JSON.stringify({ type: 'FeatureCollection', features: main }))
  writeFileSync(join(outDir, 'rivers-tributaries.geojson'), JSON.stringify({ type: 'FeatureCollection', features: tributaries }))
  writeFileSync(join(outDir, 'drainage.geojson'), JSON.stringify({ type: 'FeatureCollection', features: drainage }))
  writeFileSync(
    join(outDir, 'riverbanks.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: bufferBanks(main) }),
  )
  writeFileSync(join(outDir, 'watersheds.geojson'), JSON.stringify(watershedStub(), null, 2))

  // Keep legacy path in sync for old loaders
  writeFileSync(
    join(__dirname, '..', 'public', 'data', 'lasam-rivers.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: [...main, ...tributaries] }),
  )

  console.log(`Main rivers: ${main.length}, tributaries: ${tributaries.length}, drainage: ${drainage.length}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
