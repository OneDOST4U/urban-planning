/**
 * Fetch PSA municipal boundary for Lasam (PSGC 0201517000).
 * Source: https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Municipal/MapServer/0
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'data', 'administrative')
mkdirSync(outDir, { recursive: true })

const LASAM_PSGC = '0201517000'

const SERVICE_URL =
  'https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Municipal/MapServer/0/query'

async function fetchBoundary() {
  const params = new URLSearchParams({
    where: `psgc_10d='${LASAM_PSGC}'`,
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  })

  const url = `${SERVICE_URL}?${params.toString()}`
  console.log('Fetching PSA municipal boundary for Lasam…')
  console.log(url)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LasamUrbanPlanningDemo/1.0 (education prototype)',
      Accept: 'application/geo+json, application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`PSA Municipal query failed (${response.status})`)
  }

  const data = await response.json()
  if (!data?.features?.length) {
    throw new Error(`No PSA municipality found for psgc_10d=${LASAM_PSGC}`)
  }

  const features = data.features.map((f, i) => {
    const p = f.properties ?? {}
    return {
      type: 'Feature',
      properties: {
        id: `PSA-${p.psgc_10d ?? LASAM_PSGC}`,
        name: p.city_name ?? 'Lasam',
        city_name: p.city_name ?? 'Lasam',
        prov_name: p.prov_name ?? 'Cagayan',
        reg_name: p.reg_name ?? null,
        city_code: p.city_code ?? null,
        psgc_10d: String(p.psgc_10d ?? LASAM_PSGC),
        data_source: 'PSA / GeoRisk',
        objectid: p.OBJECTID ?? p.objectid ?? i + 1,
      },
      geometry: f.geometry,
    }
  })

  const collection = {
    type: 'FeatureCollection',
    features,
    properties: {
      name: 'PSA Municipal Boundary — Lasam, Cagayan',
      source: 'PSA / GeoRisk ULAP Municipal MapServer',
      source_url: SERVICE_URL.replace('/query', ''),
      psgc_10d: LASAM_PSGC,
      fetched_at: new Date().toISOString(),
      disclaimer:
        'Official PSA administrative boundary via GeoRisk. For demonstration planning prototype use.',
    },
  }

  const outPath = join(outDir, 'psa-lasam-boundary.geojson')
  writeFileSync(outPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${features.length} feature(s) → ${outPath}`)
  console.log('Municipality:', features[0].properties.city_name, features[0].properties.prov_name)
}

fetchBoundary().catch((err) => {
  console.error(err)
  process.exit(1)
})
