/** Proposed building / establishment types for site assessment (display only in v1). */
export const PROPOSED_BUILDING_TYPE_GROUPS = [
  {
    label: 'Residential',
    types: [
      'Single-family house',
      'Small house (bungalow)',
      'Duplex / townhouse',
      'Apartment / condominium',
      'Boarding house / dormitory',
      'Socialized housing',
    ],
  },
  {
    label: 'Commercial & business',
    types: [
      'Sari-sari store / retail shop',
      'Restaurant / eatery',
      'Office / business center',
      'Hotel / lodging',
      'Bank / financial service',
      'Gas station / service station',
    ],
  },
  {
    label: 'Industrial',
    types: ['Warehouse', 'Factory / light industrial', 'Cold storage'],
  },
  {
    label: 'Institutional',
    types: [
      'School / classroom building',
      'Hospital / health center',
      'Government building',
      'Place of worship',
      'Barangay hall / community center',
    ],
  },
  {
    label: 'Other',
    types: [
      'Agricultural structure (barn, poultry shed)',
      'Mixed-use building',
      'Other establishment',
    ],
  },
] as const

export const PROPOSED_BUILDING_TYPES = PROPOSED_BUILDING_TYPE_GROUPS.flatMap((g) => g.types)

export type ProposedBuildingType = (typeof PROPOSED_BUILDING_TYPES)[number]

export const DEFAULT_PROPOSED_BUILDING_TYPE: ProposedBuildingType = 'Single-family house'
