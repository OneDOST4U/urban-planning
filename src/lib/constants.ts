/** Lasam poblacion / Centro — PhilAtlas municipal center */
export const LASAM_CENTER: [number, number] = [121.6015, 18.0645]
export const DEFAULT_ZOOM = 17
export { MAPLIBRE_DEMO_STYLE as MAP_STYLE } from '@/lib/map/styles'

export const FLOOD_SCENARIOS = [
  { id: '1h', label: '1-hour rainfall', hours: 1 },
  { id: '3h', label: '3-hour rainfall', hours: 3 },
  { id: '6h', label: '6-hour rainfall', hours: 6 },
  { id: '12h', label: '12-hour rainfall', hours: 12 },
  { id: '24h', label: '24-hour rainfall', hours: 24 },
  { id: 'custom', label: 'Custom scenario', hours: 0 },
] as const

export const FAULT_BUFFER_OPTIONS = [
  { value: 100, label: '100 meters' },
  { value: 250, label: '250 meters' },
  { value: 500, label: '500 meters' },
  { value: 1000, label: '1 kilometer' },
] as const

export const FLOOD_COLORS = {
  none: '#94a3b8',
  low: '#facc15',
  moderate: '#fb923c',
  high: '#ef4444',
  severe: '#991b1b',
} as const

export const EARTHQUAKE_COLORS = {
  minimal: '#22c55e',
  light: '#facc15',
  moderate: '#fb923c',
  severe: '#ef4444',
  critical: '#991b1b',
} as const

export const DEMO_DISCLAIMER =
  'For demonstration only. Results are not official hazard assessments and must not be used for planning decisions without validated GIS and engineering review.'
