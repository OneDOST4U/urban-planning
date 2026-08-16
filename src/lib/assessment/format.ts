/** Compass direction labels and Hazard Hunter–style distance strings */

export function bearingToDirection(bearingDeg: number): string {
  const dirs = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
  ]
  const normalized = ((bearingDeg % 360) + 360) % 360
  const index = Math.round(normalized / 45) % 8
  return dirs[index]
}

export function formatApproxDistanceKm(distanceKm: number, direction: string, ofName: string): string {
  return `Approximately ${distanceKm.toFixed(1)} km ${direction} of ${ofName}`
}

/** Rough Lasam municipal bbox for form validation */
export const LASAM_ASSESS_BBOX = {
  west: 121.45,
  east: 121.75,
  south: 18.0,
  north: 18.15,
} as const

/** Aparri / Babuyan coast reference for tsunami & storm surge demo */
export const COAST_REFERENCE: [number, number] = [121.64, 18.35]

export function isWithinLasamBbox(lng: number, lat: number): boolean {
  return (
    lng >= LASAM_ASSESS_BBOX.west &&
    lng <= LASAM_ASSESS_BBOX.east &&
    lat >= LASAM_ASSESS_BBOX.south &&
    lat <= LASAM_ASSESS_BBOX.north
  )
}
