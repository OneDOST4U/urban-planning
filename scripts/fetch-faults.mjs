/**
 * Fetch PHIVOLCS Active Fault segments within 50 km of Lasam and write GeoJSON.
 * Source: https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/ActiveFault/MapServer/0
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'data', 'hazards')
mkdirSync(outDir, { recursive: true })

/** Lasam poblacion / Centro — matches src/lib/constants.ts */
const LASAM_LNG = 121.6015
const LASAM_LAT = 18.0645
const RADIUS_M = 50_000

const SERVICE_URL =
  'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/ActiveFault/MapServer/0/query'

const FCCODE_LABEL = {
  '01': 'Active',
  '02': 'Potentially Active',
}

const TTCODE_LABELS = {
  '01': 'Approximate',
  '02': 'Approximate - Flexure / Warp',
  '03': 'Approximate - Upthrown Area',
  '04': 'Approximate Offshore Projection',
  '05': 'Certain',
  '06': 'Certain - Upthrown Area',
  '07': 'Concealed',
  '08': 'Certain - Downthrown Area',
  '09': 'Fault with fissures',
  '10': 'Approximate - Downthrown Area',
}

const LTCODE_LABELS = {
  '01': 'Dashed - black',
  '02': 'Dashed - red',
  '14': 'Dotted - red',
  '23': 'Solid - black',
  '24': 'Solid - red',
}

/** Subtype fname → fault system name (near Lasam) */
const FNAME_LABELS = {
  102: 'Dummon River Fault System',
  103: 'Taboan River Fault',
  159: 'Bangui Fault',
  162: 'East Cordillera Fault',
  172: 'Unnamed Offshore Projection',
  179: 'Naglibacan Fault',
  180: 'Sicalao Fault',
}

function resolveFaultName(fname) {
  const n = Number(fname)
  if (Number.isFinite(n) && FNAME_LABELS[n]) return FNAME_LABELS[n]
  if (fname != null && fname !== '') return `PHIVOLCS Fault ${fname}`
  return 'PHIVOLCS Fault'
}

function legendKeyFromCodes(fccode, ttcode) {
  const fc = String(fccode ?? '')
  const tt = String(ttcode ?? '')
  if (fc === '02') {
    return tt === '05' || tt === '06' || tt === '08' ? 'potential-certain' : 'potential-approximate'
  }
  if (tt === '09') return 'active-fissures'
  if (tt === '07' || tt === '04') return 'active-concealed'
  if (tt === '05' || tt === '06' || tt === '08') return 'active-certain'
  return 'active-approximate'
}

function lengthKm(coords) {
  let meters = 0
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    meters += 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return meters / 1000
}

function normalizeFeature(feature, index) {
  const p = feature.properties ?? {}
  const fccode = String(p.fccode ?? '')
  const ttcode = String(p.ttcode ?? '')
  const ltcode = String(p.ltcode ?? '')
  const faultClass = FCCODE_LABEL[fccode] ?? 'Unknown'
  const traceType = TTCODE_LABELS[ttcode] ?? 'Unknown'
  const lineType = LTCODE_LABELS[ltcode] ?? (ltcode ? `Line type ${ltcode}` : null)
  const faultName = resolveFaultName(p.fname)
  const seg = p.segname != null ? String(p.segname) : String(index)
  const id = String(p.afcodepk ?? p.objectid ?? `PHIVOLCS-${index}`)
  const categoryLabel = fccode === '02' ? 'Potentially Active Fault' : 'Active Fault'
  const legendKey = legendKeyFromCodes(fccode, ttcode)

  return {
    type: 'Feature',
    properties: {
      id,
      name: `${faultName} (${categoryLabel}, ${traceType})`,
      fault_name: faultName,
      fault_class: faultClass,
      category_label: categoryLabel,
      trace_type: traceType,
      line_type: lineType,
      legend_key: legendKey,
      mechanism: p.mechanism ?? null,
      scale: p.scale ?? null,
      datemapped: p.datemapped ?? null,
      data_source: 'PHIVOLCS / GeoRisk ULAP',
      fname: p.fname ?? null,
      segname: p.segname ?? null,
      segment_label: seg,
      afcode: p.afcode ?? null,
      afcodepk: p.afcodepk ?? null,
      fccode: p.fccode ?? null,
      ttcode: p.ttcode ?? null,
      ltcode: p.ltcode ?? null,
      objectid: p.objectid ?? null,
    },
    geometry: feature.geometry,
  }
}

function flattenCoords(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return [geometry.coordinates]
  if (geometry.type === 'MultiLineString') return geometry.coordinates
  return []
}

async function fetchFaults() {
  const params = new URLSearchParams({
    geometry: `${LASAM_LNG},${LASAM_LAT}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    distance: String(RADIUS_M),
    units: 'esriSRUnit_Meter',
    spatialRel: 'esriSpatialRelIntersects',
    where: "fccode IN ('01','02')",
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  })

  const url = `${SERVICE_URL}?${params.toString()}`
  console.log('Fetching PHIVOLCS Active Fault layer (50 km of Lasam)…')
  console.log(url)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
      Accept: 'application/geo+json, application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`PHIVOLCS query failed (${response.status})`)
  }

  const data = await response.json()
  if (!data?.features || !Array.isArray(data.features)) {
    throw new Error('Unexpected response: missing features array')
  }

  // Client-side filter in case where-clause is ignored by the service
  const allowed = new Set(['01', '02'])
  const filtered = data.features.filter((f) => allowed.has(String(f.properties?.fccode ?? '')))

  const features = filtered
    .filter((f) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
    .map((f, i) => normalizeFeature(f, i + 1))

  let totalKm = 0
  for (const f of features) {
    for (const line of flattenCoords(f.geometry)) {
      totalKm += lengthKm(line)
    }
  }

  const collection = {
    type: 'FeatureCollection',
    features,
    properties: {
      name: 'PHIVOLCS Active Faults (Lasam 50 km)',
      source: 'PHIVOLCS / GeoRisk ULAP ActiveFault MapServer',
      source_url: SERVICE_URL.replace('/query', ''),
      center: [LASAM_LNG, LASAM_LAT],
      radius_m: RADIUS_M,
      fccode_filter: ['01', '02'],
      fetched_at: new Date().toISOString(),
      disclaimer:
        'For demonstration only. Not validated for official hazard assessment or planning decisions.',
    },
  }

  const outPath = join(outDir, 'phivolcs-faults-lasam.geojson')
  writeFileSync(outPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8')

  console.log(`Wrote ${features.length} segments (${totalKm.toFixed(1)} km) → ${outPath}`)
  const byClass = {}
  const byLegend = {}
  for (const f of features) {
    const k = f.properties.fault_class
    byClass[k] = (byClass[k] ?? 0) + 1
    const lk = f.properties.legend_key
    byLegend[lk] = (byLegend[lk] ?? 0) + 1
  }
  console.log('By class:', byClass)
  console.log('By legend_key:', byLegend)
  const names = [...new Set(features.map((f) => f.properties.fault_name))]
  console.log('Fault names:', names)
}

fetchFaults().catch((err) => {
  console.error(err)
  process.exit(1)
})
