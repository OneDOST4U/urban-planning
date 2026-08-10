import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'

/** Approximate footprint (m) and height for demo 3D box preview */
export interface ProposedBuildingDimensions {
  widthM: number
  depthM: number
  floors: number
  heightM: number
  color: string
}

const FLOOR_M = 3.2

/** Highlight color for proposed building 3D box (stands out from gray nearby buildings) */
export const PROPOSED_BUILDING_COLOR = '#FACC15'

function dims(
  widthM: number,
  depthM: number,
  floors: number,
  color: string,
  heightOverride?: number,
): ProposedBuildingDimensions {
  return {
    widthM,
    depthM,
    floors,
    heightM: heightOverride ?? Number((floors * FLOOR_M).toFixed(1)),
    color,
  }
}

const DIMENSIONS: Record<ProposedBuildingType, ProposedBuildingDimensions> = {
  'Single-family house': dims(10, 12, 2, '#94a3b8'),
  'Small house (bungalow)': dims(8, 10, 1, '#b8bcc4'),
  'Duplex / townhouse': dims(12, 14, 2, '#7a8fa6'),
  'Apartment / condominium': dims(18, 24, 4, '#64748b'),
  'Boarding house / dormitory': dims(14, 20, 3, '#78716c'),
  'Socialized housing': dims(16, 22, 3, '#a8a29e'),
  'Sari-sari store / retail shop': dims(6, 8, 1, '#7a8fa6', 3.5),
  'Restaurant / eatery': dims(12, 16, 1, '#7a8fa6', 4.5),
  'Office / business center': dims(18, 22, 3, '#475569'),
  'Hotel / lodging': dims(20, 28, 4, '#334155'),
  'Bank / financial service': dims(14, 18, 2, '#1e3a8a'),
  'Gas station / service station': dims(20, 24, 1, '#4b5563', 5),
  Warehouse: dims(25, 40, 1, '#4b5563', 8),
  'Factory / light industrial': dims(30, 45, 1, '#374151', 9),
  'Cold storage': dims(22, 35, 1, '#6b7280', 7),
  'School / classroom building': dims(16, 30, 2, '#eab308'),
  'Hospital / health center': dims(22, 32, 3, '#dc2626'),
  'Government building': dims(20, 28, 3, '#1e3a8a'),
  'Place of worship': dims(16, 24, 1, '#7c3aed', 8),
  'Barangay hall / community center': dims(14, 20, 2, '#0369a1'),
  'Agricultural structure (barn, poultry shed)': dims(12, 24, 1, '#78716c', 5),
  'Mixed-use building': dims(16, 20, 3, '#94a3b8'),
  'Other establishment': dims(12, 14, 2, '#64748b'),
}

export function getProposedBuildingDimensions(
  type: ProposedBuildingType,
): ProposedBuildingDimensions {
  return DIMENSIONS[type] ?? dims(10, 12, 2, '#94a3b8')
}

/** Zoom so the footprint fills the preview comfortably */
export function suggestedPreviewZoom(dims: ProposedBuildingDimensions): number {
  const span = Math.max(dims.widthM, dims.depthM)
  if (span >= 40) return 16.2
  if (span >= 25) return 16.8
  if (span >= 15) return 17.4
  return 18
}
