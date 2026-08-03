import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'data')
mkdirSync(outDir, { recursive: true })

/** Lasam municipality — Nominatim relation 19879891 */
const LASAM_RELATION_AREA_ID = 3619879891

export const LASAM_CENTRO = { lng: 121.6015, lat: 18.0645 }
const CENTRO_SPLIT_LAT = 18.0645
const FLOOR_HEIGHT_M = 3

/** Municipal bounds (Lasam, Cagayan only) */
const LASAM_BBOX = {
  south: 17.9963404,
  west: 121.4036639,
  north: 18.1177601,
  east: 121.6534445,
}

const TYPE_COLORS = {
  Residential: '#b8bcc4',
  Commercial: '#7a8fa6',
  School: '#eab308',
  Institutional: '#1e3a8a',
  Industrial: '#4b5563',
  'Mixed Use': '#94a3b8',
}

const OVERPASS_QUERY = `
[out:json][timeout:180];
area(${LASAM_RELATION_AREA_ID})->.lasam;
(
  way["building"](area.lasam);
);
out geom;
`.trim()

async function fetchLasamBoundary() {
  const response = await fetch(
    'https://nominatim.openstreetmap.org/lookup?osm_ids=R19879891&format=json&polygon_geojson=1',
    {
      headers: {
        'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Nominatim boundary lookup failed (${response.status})`)
  }

  const results = await response.json()
  const geojson = results[0]?.geojson
  if (!geojson) {
    throw new Error('Lasam municipality boundary polygon not found.')
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        name: 'Lasam, Cagayan',
        admin_level: '6',
        data_source: 'OpenStreetMap',
      },
      geometry: geojson,
    }],
  }
}

function fallbackBoundary() {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'Lasam, Cagayan (approximate)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [LASAM_BBOX.west, LASAM_BBOX.south],
          [LASAM_BBOX.east, LASAM_BBOX.south],
          [LASAM_BBOX.east, LASAM_BBOX.north],
          [LASAM_BBOX.west, LASAM_BBOX.north],
          [LASAM_BBOX.west, LASAM_BBOX.south],
        ]],
      },
    }],
  }
}

async function fetchOsmBuildings() {
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY)}`,
    {
      headers: {
        'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Overpass API failed (${response.status})`)
  }

  return response.json()
}

function classifyBuilding(tags) {
  if (tags.amenity === 'school' || tags.amenity === 'college' || tags.amenity === 'university') {
    return 'School'
  }
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'Institutional'
  if (tags.amenity === 'townhall' || tags.amenity === 'place_of_worship') return 'Institutional'
  if (tags.shop || tags.amenity === 'marketplace' || tags.amenity === 'bank') return 'Commercial'

  const buildingType = tags.building ?? 'yes'
  if (['warehouse', 'industrial', 'factory', 'garage'].includes(buildingType)) return 'Industrial'
  if (['commercial', 'retail', 'office', 'supermarket'].includes(buildingType)) return 'Commercial'
  if (['school', 'hospital', 'public', 'government', 'civic'].includes(buildingType)) {
    return buildingType === 'school' ? 'School' : 'Institutional'
  }
  if (['apartments', 'dormitory', 'hotel'].includes(buildingType)) return 'Mixed Use'
  return 'Residential'
}

function estimateHeight(tags, buildingType) {
  if (tags['building:height']) {
    const parsed = Number.parseFloat(String(tags['building:height']))
    if (!Number.isNaN(parsed) && parsed > 0) {
      return {
        height: Number(parsed.toFixed(1)),
        floors: Math.max(1, Math.round(parsed / FLOOR_HEIGHT_M)),
        heightEstimated: false,
      }
    }
  }

  const levelTag = tags['building:levels'] ?? tags.levels
  if (levelTag) {
    const floors = Number.parseInt(String(levelTag), 10)
    if (!Number.isNaN(floors) && floors > 0) {
      return {
        height: Number((floors * FLOOR_HEIGHT_M).toFixed(1)),
        floors,
        heightEstimated: false,
      }
    }
  }

  if (buildingType === 'School' || buildingType === 'Institutional') {
    return { height: 8, floors: 2, heightEstimated: true }
  }
  if (buildingType === 'Industrial') return { height: 6.5, floors: 1, heightEstimated: true }
  if (buildingType === 'Commercial' || buildingType === 'Mixed Use') {
    return { height: 6, floors: 2, heightEstimated: true }
  }

  return { height: FLOOR_HEIGHT_M, floors: 1, heightEstimated: true }
}

function getBarangay(lat, lng) {
  if (lat >= 18.062 && lat <= 18.068 && lng >= 121.598 && lng <= 121.608) {
    return lat >= CENTRO_SPLIT_LAT ? 'Centro I' : 'Centro II'
  }
  return 'Lasam'
}

function ringCentroid(ring) {
  let lngSum = 0
  let latSum = 0
  const count = ring.length - 1
  for (let i = 0; i < count; i += 1) {
    lngSum += ring[i][0]
    latSum += ring[i][1]
  }
  return [lngSum / count, latSum / count]
}

function ringArea(ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

function wayToPolygon(way) {
  if (!way.geometry?.length) return null

  const ring = way.geometry.map((node) => [node.lon, node.lat])
  if (ring.length < 4) return null

  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first])
  }

  return ring
}

function convertOsmToBuildings(elements) {
  const features = []
  const seenOsmIds = new Set()
  let id = 1

  for (const element of elements) {
    if (element.type !== 'way' || !element.tags?.building) continue
    if (seenOsmIds.has(element.id)) continue

    const ring = wayToPolygon(element)
    if (!ring) continue
    if (ringArea(ring) < 8e-10) continue

    seenOsmIds.add(element.id)
    const tags = element.tags
    const [centroidLng, centroidLat] = ringCentroid(ring)
    const buildingType = classifyBuilding(tags)
    const { height, floors, heightEstimated } = estimateHeight(tags, buildingType)
    const buildingId = `LAS-BLDG-${String(id).padStart(5, '0')}`
    const baseColor = TYPE_COLORS[buildingType] ?? TYPE_COLORS.Residential

    features.push({
      type: 'Feature',
      properties: {
        id: buildingId,
        building_id: buildingId,
        type: buildingType,
        building_type: buildingType.toLowerCase().replace(/\s+/g, '_'),
        barangay: getBarangay(centroidLat, centroidLng),
        floors,
        height,
        height_estimated: heightEstimated,
        baseColor,
        data_source: 'OpenStreetMap',
        validation_status: 'unverified',
        name: tags.name ?? null,
        osm_id: element.id,
      },
      geometry: { type: 'Polygon', coordinates: [ring] },
    })

    id += 1
  }

  return features
}

/** Riverside flood plain — used only when flood simulation is enabled */
const floodZone = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Cagayan River Flood Plain (Sample)' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [121.5945, 18.0620],
        [121.5998, 18.0620],
        [121.5998, 18.0675],
        [121.5945, 18.0675],
        [121.5945, 18.0620],
      ]],
    },
  }],
}

const rivers = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Cagayan River (west of Lasam poblacion)' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [121.5965, 18.0610],
        [121.5960, 18.0640],
        [121.5965, 18.0675],
      ],
    },
  }],
}

const faultLine = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Sample Fault Segment (Centro Lasam)' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [121.5998, 18.0662],
        [121.6018, 18.0648],
        [121.6045, 18.0632],
      ],
    },
  }],
}

async function main() {
  console.log('Fetching Lasam municipality boundary…')
  let lasamBoundary
  try {
    lasamBoundary = await fetchLasamBoundary()
    console.log('Municipal boundary loaded from OpenStreetMap.')
  } catch (error) {
    console.warn(`Boundary fallback used: ${error.message}`)
    lasamBoundary = fallbackBoundary()
  }

  console.log('Fetching all OSM building polygons within Lasam municipality…')
  const osm = await fetchOsmBuildings()
  const buildings = convertOsmToBuildings(osm.elements ?? [])

  if (buildings.length === 0) {
    throw new Error('No OSM buildings found in Lasam municipality.')
  }

  writeFileSync(
    join(outDir, 'lasam-buildings.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: buildings }),
  )
  writeFileSync(join(outDir, 'lasam-boundary.geojson'), JSON.stringify(lasamBoundary, null, 2))
  writeFileSync(join(outDir, 'lasam-rivers.geojson'), JSON.stringify(rivers, null, 2))
  writeFileSync(join(outDir, 'sample-flood-zone.geojson'), JSON.stringify(floodZone, null, 2))
  writeFileSync(join(outDir, 'sample-fault-line.geojson'), JSON.stringify(faultLine, null, 2))

  // New layout (terrain/hydrology plan)
  const adminDir = join(outDir, 'administrative')
  mkdirSync(adminDir, { recursive: true })
  writeFileSync(
    join(adminDir, 'lasam-buildings.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: buildings }),
  )
  writeFileSync(join(adminDir, 'lasam-boundary.geojson'), JSON.stringify(lasamBoundary, null, 2))

  const stats = buildings.reduce((acc, b) => {
    acc[b.properties.barangay] = (acc[b.properties.barangay] || 0) + 1
    return acc
  }, {})

  const typeStats = buildings.reduce((acc, b) => {
    acc[b.properties.type] = (acc[b.properties.type] || 0) + 1
    return acc
  }, {})

  console.log(`Prepared ${buildings.length} building polygons for Lasam municipality`)
  console.log('Barangay split:', stats)
  console.log('Building types:', typeStats)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
