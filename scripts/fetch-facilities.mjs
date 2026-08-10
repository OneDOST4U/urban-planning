/**
 * Fetch / refresh Lasam critical facilities from Overpass (OSM).
 * Falls back to keeping the seed file if Overpass fails.
 *
 * Output: public/data/facilities/lasam-critical-facilities.geojson
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'data', 'facilities')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'lasam-critical-facilities.geojson')

const BBOX = '18.00,121.45,18.15,121.75' // south,west,north,east (Overpass)

const QUERY = `
[out:json][timeout:60];
(
  node["amenity"="school"](${BBOX});
  way["amenity"="school"](${BBOX});
  node["amenity"="hospital"](${BBOX});
  node["amenity"="clinic"](${BBOX});
  node["amenity"="doctors"](${BBOX});
  way["highway"="primary"](${BBOX});
  way["highway"="trunk"](${BBOX});
  way["highway"="secondary"](${BBOX});
);
out center tags;
`

function classify(tags) {
  const amenity = tags.amenity
  const highway = tags.highway
  if (highway === 'primary' || highway === 'trunk') return 'primary_road'
  if (highway === 'secondary') return 'secondary_road'
  if (amenity === 'hospital') {
    return tags.operator?.toLowerCase?.().includes('private') || tags.ownership === 'private'
      ? 'private_health'
      : 'govt_health'
  }
  if (amenity === 'clinic' || amenity === 'doctors') {
    return tags.operator?.toLowerCase?.().includes('private') ? 'private_health' : 'govt_health'
  }
  if (amenity === 'school') {
    const level = String(tags['school:level'] ?? tags.isced ?? '').toLowerCase()
    const name = String(tags.name ?? '').toLowerCase()
    if (level.includes('secondary') || name.includes('high') || name.includes('nhs')) {
      return 'secondary_school'
    }
    return 'elementary_school'
  }
  return null
}

function elementToFeature(el) {
  const tags = el.tags ?? {}
  const category = classify(tags)
  if (!category) return null

  let geometry
  if (el.type === 'node' && el.lon != null && el.lat != null) {
    geometry = { type: 'Point', coordinates: [el.lon, el.lat] }
  } else if (el.center?.lon != null && el.center?.lat != null) {
    if (category === 'primary_road' || category === 'secondary_road') {
      // Keep as point fallback when full way geometry isn't returned
      geometry = { type: 'Point', coordinates: [el.center.lon, el.center.lat] }
    } else {
      geometry = { type: 'Point', coordinates: [el.center.lon, el.center.lat] }
    }
  } else {
    return null
  }

  return {
    type: 'Feature',
    properties: {
      id: `${el.type}/${el.id}`,
      name: tags.name ?? tags.ref ?? (tags.highway ? `OSM ${tags.highway}` : 'Unnamed'),
      category,
      amenity: tags.amenity ?? null,
      highway: tags.highway ?? null,
      data_source: 'OpenStreetMap Overpass',
    },
    geometry,
  }
}

async function fetchFacilities() {
  console.log('Querying Overpass for Lasam facilities…')
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(QUERY)}`,
    })
    if (!response.ok) throw new Error(`Overpass ${response.status}`)
    const data = await response.json()
    const features = (data.elements ?? []).map(elementToFeature).filter(Boolean)

    if (features.length < 3) {
      throw new Error(`Too few features (${features.length}); keeping seed file`)
    }

    const collection = {
      type: 'FeatureCollection',
      properties: {
        name: 'Lasam critical facilities',
        fetched_at: new Date().toISOString(),
        data_source: 'OpenStreetMap Overpass',
        disclaimer: 'For demonstration only.',
      },
      features,
    }
    writeFileSync(outPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8')
    console.log(`Wrote ${features.length} features → ${outPath}`)
  } catch (err) {
    console.warn('Overpass fetch failed:', err.message)
    if (existsSync(outPath)) {
      console.warn('Keeping existing seed file at', outPath)
      const existing = JSON.parse(readFileSync(outPath, 'utf8'))
      console.log(`Existing features: ${existing.features?.length ?? 0}`)
    } else {
      throw err
    }
  }
}

fetchFacilities().catch((err) => {
  console.error(err)
  process.exit(1)
})
