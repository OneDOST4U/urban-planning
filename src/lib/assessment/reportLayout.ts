/** Shared A4 landscape report layout — used by on-screen preview and PDF export */
export const REPORT_COORDINATOR = {
  name: 'Ar./EnP. Rodel T. Urian',
  title: 'Municipal Planning and Development Coordinator',
} as const

export const REPORT_HEADER = {
  titleLine1: 'LGU LASAM',
  titleLine2: 'URBAN PLANNING ASSESSMENT',
} as const

export const A4_LANDSCAPE_RATIO = 297 / 210

/** PDF page geometry (mm) */
export const REPORT_PAGE = {
  width: 297,
  height: 210,
  margin: 10,
} as const

export const REPORT_LAYOUT = {
  leftColRatio: 0.62,
  /** Room for centered logo + two title lines */
  headerMm: 28,
  /** Blank area for signature above line + name + title */
  footerMm: 24,
  bodyGapMm: 0,
} as const

export function reportBodyHeightMm(): number {
  const contentH = REPORT_PAGE.height - REPORT_PAGE.margin * 2
  return contentH - REPORT_LAYOUT.headerMm - REPORT_LAYOUT.footerMm
}

export function reportColumnWidthsMm(): { left: number; right: number; contentW: number } {
  const contentW = REPORT_PAGE.width - REPORT_PAGE.margin * 2
  const left = contentW * REPORT_LAYOUT.leftColRatio
  const right = contentW - left
  return { left, right, contentW }
}
