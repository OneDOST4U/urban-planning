/** PHIVOLCS Active Fault legend labels — GeoRisk ULAP coded domains */

export const FCCODE_LABEL: Record<string, string> = {
  '01': 'Active',
  '02': 'Potentially Active',
}

export const TTCODE_LABELS: Record<string, string> = {
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

/** Subtype fname → fault system name (Lasam 50 km + common nearby) */
export const FNAME_LABELS: Record<number, string> = {
  102: 'Dummon River Fault System',
  103: 'Taboan River Fault',
  159: 'Bangui Fault',
  162: 'East Cordillera Fault',
  172: 'Unnamed Offshore Projection',
  179: 'Naglibacan Fault',
  180: 'Sicalao Fault',
}

export type FaultLegendStyle = {
  key: string
  label: string
  color: string
  dash: 'solid' | 'dashed' | 'dotted'
  /** Official legend prefix shown in GeoRisk */
  category: 'Active Fault' | 'Potentially Active Fault'
}

/**
 * MapLibre-friendly style groups from fccode + ttcode.
 * Approximates PHIVOLCS line symbology (no hachures/sawteeth).
 */
export function faultLegendStyleFromCodes(
  fccode: string | null | undefined,
  ttcode: string | null | undefined,
): FaultLegendStyle {
  const fc = String(fccode ?? '')
  const tt = String(ttcode ?? '')
  const isPotential = fc === '02'
  const category = isPotential ? 'Potentially Active Fault' : 'Active Fault'
  const trace = TTCODE_LABELS[tt] ?? 'Unknown'
  const label = `${category}, ${trace}`

  if (isPotential) {
    const solid = tt === '05' || tt === '06' || tt === '08'
    return {
      key: solid ? 'potential-certain' : 'potential-approximate',
      label,
      color: '#171717',
      dash: solid ? 'solid' : 'dashed',
      category,
    }
  }

  if (tt === '09') {
    return {
      key: 'active-fissures',
      label,
      color: '#ca8a04',
      dash: 'solid',
      category,
    }
  }

  if (tt === '07' || tt === '04') {
    return {
      key: 'active-concealed',
      label,
      color: '#dc2626',
      dash: 'dotted',
      category,
    }
  }

  if (tt === '05' || tt === '06' || tt === '08') {
    return {
      key: 'active-certain',
      label,
      color: '#dc2626',
      dash: 'solid',
      category,
    }
  }

  // Approximate family (01, 02, 03, 10) and unknown
  return {
    key: 'active-approximate',
    label,
    color: '#dc2626',
    dash: 'dashed',
    category,
  }
}

/** Compact legend rows for map overlay + Hazard panel (GeoRisk-style wording) */
export const FAULT_LEGEND_ENTRIES: {
  key: string
  label: string
  color: string
  dash: 'solid' | 'dashed' | 'dotted'
}[] = [
  { key: 'active-certain', label: 'Active Fault, Certain', color: '#dc2626', dash: 'solid' },
  {
    key: 'active-certain-up',
    label: 'Active Fault, Certain - Upthrown Area',
    color: '#dc2626',
    dash: 'solid',
  },
  {
    key: 'active-certain-down',
    label: 'Active Fault, Certain - Downthrown Area',
    color: '#dc2626',
    dash: 'solid',
  },
  {
    key: 'active-fissures',
    label: 'Active Fault, Fault with fissures',
    color: '#ca8a04',
    dash: 'solid',
  },
  { key: 'active-approximate', label: 'Active Fault, Approximate', color: '#dc2626', dash: 'dashed' },
  {
    key: 'active-approx-flex',
    label: 'Active Fault, Approximate - Flexure / Warp',
    color: '#dc2626',
    dash: 'dashed',
  },
  {
    key: 'active-approx-up',
    label: 'Active Fault, Approximate - Upthrown Area',
    color: '#dc2626',
    dash: 'dashed',
  },
  {
    key: 'active-approx-down',
    label: 'Active Fault, Approximate - Downthrown Area',
    color: '#dc2626',
    dash: 'dashed',
  },
  { key: 'active-concealed', label: 'Active Fault, Concealed', color: '#dc2626', dash: 'dotted' },
  {
    key: 'active-offshore',
    label: 'Active Fault, Approximate Offshore Projection',
    color: '#dc2626',
    dash: 'dotted',
  },
  {
    key: 'potential-certain',
    label: 'Potentially Active Fault, Certain',
    color: '#171717',
    dash: 'solid',
  },
  {
    key: 'potential-approximate',
    label: 'Potentially Active Fault, Approximate',
    color: '#171717',
    dash: 'dashed',
  },
]

export const FAULT_LAYER_IDS = [
  'fault-line-active-certain',
  'fault-line-active-approximate',
  'fault-line-active-concealed',
  'fault-line-active-fissures',
  'fault-line-potential-certain',
  'fault-line-potential-approximate',
] as const

export function resolveFaultName(fname: number | string | null | undefined): string {
  const n = Number(fname)
  if (Number.isFinite(n) && FNAME_LABELS[n]) return FNAME_LABELS[n]
  if (fname != null && fname !== '') return `PHIVOLCS Fault ${fname}`
  return 'PHIVOLCS Fault'
}

/** Detailed legend row keys currently represented in a feature collection */
export function collectPresentLegendKeys(
  features: { properties?: Record<string, unknown> | null }[],
): string[] {
  const keys = new Set<string>()
  for (const f of features) {
    const p = f.properties ?? {}
    const fc = String(p.fccode ?? (p.fault_class === 'Potentially Active' ? '02' : '01'))
    const tt = String(p.ttcode ?? '')
    const lk = p.legend_key != null ? String(p.legend_key) : faultLegendStyleFromCodes(fc, tt).key
    keys.add(lk)

    if (fc === '02') {
      if (tt === '05' || tt === '06' || tt === '08') keys.add('potential-certain')
      else keys.add('potential-approximate')
      continue
    }

    if (tt === '05') keys.add('active-certain')
    if (tt === '06') keys.add('active-certain-up')
    if (tt === '08') keys.add('active-certain-down')
    if (tt === '09') keys.add('active-fissures')
    if (tt === '01') keys.add('active-approximate')
    if (tt === '02') keys.add('active-approx-flex')
    if (tt === '03') keys.add('active-approx-up')
    if (tt === '10') keys.add('active-approx-down')
    if (tt === '07') keys.add('active-concealed')
    if (tt === '04') keys.add('active-offshore')
  }
  return [...keys]
}

