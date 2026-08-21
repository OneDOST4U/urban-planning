import { open } from 'shapefile'
import proj4 from 'proj4'

proj4.defs('EPSG:32651', '+proj=utm +zone=51 +datum=WGS84 +units=m +no_defs')

const layers = [
  { name: 'Flood_2020_Lasam', classFields: ['SUSCEPTIBI', 'gridcode'] },
  { name: 'Liquifacation_Lasam_2013', classFields: null },
  { name: 'Land_Erosion_Lasam_2020', classFields: ['Erosion', 'Barangay'] },
  { name: 'EXISTING_LAND_USE_LASAM_2020', classFields: ['LANDUSE'] },
]

function walkCoords(coords, out = []) {
  if (typeof coords[0] === 'number') {
    const [x, y] = coords
    out.push(x > 1000 ? proj4('EPSG:32651', 'WGS84', [x, y]) : [x, y])
    return out
  }
  for (const part of coords) walkCoords(part, out)
  return out
}

for (const layer of layers) {
  const path = `HAZARDS LAYERS/${layer.name}.shp`
  const source = await open(path)
  let count = 0
  const classes = new Map()
  let fields = null
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  while (true) {
    const result = await source.read()
    if (result.done) break
    count += 1
    const props = result.value.properties
    if (!fields) fields = Object.keys(props)

    for (const [lon, lat] of walkCoords(result.value.geometry.coordinates)) {
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    const key = layer.classFields
      ? layer.classFields.map((field) => String(props[field] ?? '')).join(' | ')
      : JSON.stringify(props)
    classes.set(key, (classes.get(key) ?? 0) + 1)
  }

  console.log(`\n=== ${layer.name} ===`)
  console.log('features:', count)
  console.log('fields:', fields?.join(', '))
  console.log(
    'bbox (WGS84):',
    [minLon.toFixed(5), minLat.toFixed(5), maxLon.toFixed(5), maxLat.toFixed(5)].join(', '),
  )
  console.log('classes:')
  for (const [key, value] of [...classes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${value}x ${key}`)
  }
}
