/** Default appearance by building type (MVP prototype). */
export const BUILDING_TYPE_COLORS: Record<string, string> = {
  Residential: '#b8bcc4',
  Commercial: '#7a8fa6',
  School: '#eab308',
  Institutional: '#1e3a8a',
  Industrial: '#4b5563',
  'Mixed Use': '#94a3b8',
}

export function getTypeColor(buildingType: string): string {
  return BUILDING_TYPE_COLORS[buildingType] ?? BUILDING_TYPE_COLORS.Residential
}
