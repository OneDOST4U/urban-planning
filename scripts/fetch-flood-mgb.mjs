/**
 * Fetch DENR-MGB flood susceptibility polygons intersecting Lasam and clip to PSA boundary.
 *
 * Primary source (queryable Feature Layer):
 * https://controlmap.mgb.gov.ph/arcgis/rest/services/GeospatialDataInventory/GDI_Detailed_Flood_Susceptibility/MapServer/0
 *
 * Note: GeoRisk ULAP MGBPublic/Flood rejects Query capability for feature downloads.
 * Spatial queries with returnGeometry=true often 500 on large polygons; we therefore:
 * 1) Spatial query with returnGeometry=false to collect OBJECTIDs
 * 2) Fetch each feature by OBJECTID (with geometry simplification)
 * 3) Clip to PSA Lasam boundary via Turf
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { bbox, booleanIntersects, featureCollection, intersect, multiPolygon, polygon } from '@turf/turf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const hazardsDir = join(root, 'public', 'data', 'hazards')
const adminDir = join(root, 'public', 'data', 'administrative')
mkdirSync(hazardsDir, { recursive: true })

const SERVICE_URL =
  'https://controlmap.mgb.gov.ph/arcgis/rest/services/GeospatialDataInventory/GDI_Detailed_Flood_Susceptibility/MapServer/0/query'

const CODE_MAP = {
  LF: 'low',
  MF: 'moderate',
  HF: 'high',
  VHF: 'very_high',
}

const LABEL = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
}

function normalizeSusceptibility(raw) {
  const s = String(raw ?? '').trim()
  if (CODE_MAP[s]) return CODE_MAP[s]
  const lower = s.toLowerCase().replace(/[_-]+/g, ' ')
  if (lower.includes('very') && lower.includes('high')) return 'very_high'
  if (lower.includes('high') || lower === 'hf') return 'high'
  if (lower.includes('moderate') || lower.includes('medium') || lower === 'mf') return 'moderate'
  if (lower.includes('low') || lower === 'lf') return 'low'
  return null
}

function asPolygonFeature(geom, props) {
  if (!geom) return null
  if (geom.type === 'Polygon') return polygon(geom.coordinates, props)
  if (geom.type === 'MultiPolygon') return multiPolygon(geom.coordinates, props)
  return null
}

function clipToBoundary(feature, boundaryPoly) {
  if (!feature?.geometry || !boundaryPoly) return null
  try {
    if (!booleanIntersects(feature, boundaryPoly)) return null
    return intersect(featureCollection([feature, boundaryPoly]), {
      properties: feature.properties,
    })
  } catch {
    return booleanIntersects(feature, boundaryPoly) ? feature : null
  }
}

async function postJson(params) {
  const response = await fetch(SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
      Accept: 'application/json, application/geo+json',
    },
    body: new URLSearchParams(params),
  })
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`MGB non-JSON response (${response.status}): ${text.slice(0, 120)}`)
  }
}

async function fetchIntersectingIds(envelope) {
  const all = []
  let offset = 0
  for (let page = 0; page < 20; page += 1) {
    const data = await postJson({
      geometry: envelope.join(','),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      where: '1=1',
      outFields: 'OBJECTID,FloodSusc',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '2000',
      resultOffset: String(offset),
    })
    if (data.error) {
      throw new Error(`MGB ID query failed: ${JSON.stringify(data.error)}`)
    }
    const features = data.features ?? []
    for (const f of features) {
      all.push({
        objectid: f.attributes?.OBJECTID ?? f.properties?.OBJECTID,
        floodSusc: f.attributes?.FloodSusc ?? f.properties?.FloodSusc,
      })
    }
    if (!data.exceededTransferLimit || features.length === 0) break
    offset += features.length
  }
  return all
}

async function fetchFeatureGeometry(objectid) {
  const offsets = ['0.00005', '0.0002', '0.001', '0.005']
  for (const maxAllowableOffset of offsets) {
    try {
      const data = await postJson({
        where: `OBJECTID=${objectid}`,
        outFields: 'OBJECTID,FloodSusc',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson',
        maxAllowableOffset,
      })
      if (data.error) continue
      const feature = data.features?.[0]
      if (feature?.geometry) return feature
    } catch {
      // try coarser simplification
    }
  }
  return null
}

async function fetchFlood() {
  const boundaryPath = join(adminDir, 'psa-lasam-boundary.geojson')
  if (!existsSync(boundaryPath)) {
    throw new Error(`Missing ${boundaryPath}. Run: npm run fetch:boundary`)
  }

  const boundaryFc = JSON.parse(readFileSync(boundaryPath, 'utf8'))
  const boundaryFeature = boundaryFc.features?.[0]
  if (!boundaryFeature?.geometry) {
    throw new Error('PSA boundary GeoJSON has no geometry')
  }

  const boundaryPoly = asPolygonFeature(boundaryFeature.geometry, boundaryFeature.properties)
  if (!boundaryPoly) {
    throw new Error('PSA boundary is not a Polygon/MultiPolygon')
  }

  const envelope = bbox(boundaryPoly)
  const pad = 0.02
  const padded = [envelope[0] - pad, envelope[1] - pad, envelope[2] + pad, envelope[3] + pad]

  console.log('Fetching MGB flood susceptibility intersecting Lasam…')
  console.log('Source:', SERVICE_URL.replace('/query', ''))
  console.log('Bbox:', padded.map((n) => n.toFixed(4)).join(', '))

  const idRows = await fetchIntersectingIds(padded)
  console.log(`Found ${idRows.length} intersecting MGB features (IDs only)`)
  if (idRows.length === 0) {
    throw new Error('MGB returned zero features for Lasam envelope')
  }

  const clipped = []
  const byClass = { low: 0, moderate: 0, high: 0, very_high: 0 }
  let failed = 0

  for (let i = 0; i < idRows.length; i += 1) {
    const { objectid, floodSusc } = idRows[i]
    process.stdout.write(`  [${i + 1}/${idRows.length}] OBJECTID=${objectid} (${floodSusc})… `)
    const susc = normalizeSusceptibility(floodSusc)
    if (!susc) {
      console.log('skip (unknown class)')
      continue
    }

    const raw = await fetchFeatureGeometry(objectid)
    if (!raw?.geometry) {
      failed += 1
      console.log('geometry failed')
      continue
    }

    const poly = asPolygonFeature(raw.geometry, {})
    if (!poly) {
      failed += 1
      console.log('unsupported geometry')
      continue
    }

    const result = clipToBoundary(poly, boundaryPoly)
    if (!result?.geometry) {
      console.log('no overlap after clip')
      continue
    }

    byClass[susc] += 1
    clipped.push({
      type: 'Feature',
      properties: {
        id: `MGB-FLD-${objectid}`,
        susceptibility: susc,
        susceptibility_label: LABEL[susc],
        raw_class: String(floodSusc),
        data_source: 'DENR-MGB / controlmap.mgb.gov.ph',
        objectid,
      },
      geometry: result.geometry,
    })
    console.log('ok')
  }

  if (clipped.length === 0) {
    throw new Error(`No polygons clipped to Lasam (${failed} geometry failures)`)
  }

  const collection = {
    type: 'FeatureCollection',
    features: clipped,
    properties: {
      name: 'MGB Flood Susceptibility — Lasam, Cagayan',
      source: 'DENR-MGB Detailed Flood Susceptibility (controlmap.mgb.gov.ph)',
      source_url: SERVICE_URL.replace('/query', ''),
      clipped_to: 'PSA Lasam psgc_10d=0201517000',
      fetched_at: new Date().toISOString(),
      counts: byClass,
      geometry_failures: failed,
      disclaimer:
        'Official MGB flood susceptibility clipped to PSA Lasam boundary. Prototype use — verify with DENR-MGB for official decisions.',
    },
  }

  const outPath = join(hazardsDir, 'mgb-flood-lasam.geojson')
  writeFileSync(outPath, `${JSON.stringify(collection)}\n`, 'utf8')
  console.log(`Wrote ${clipped.length} clipped polygons → ${outPath}`)
  console.log('By class:', byClass)
  if (failed) console.log(`Geometry fetch failures: ${failed}`)
}

fetchFlood().catch((err) => {
  console.error(err)
  process.exit(1)
})
