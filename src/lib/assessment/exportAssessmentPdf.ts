import { jsPDF } from 'jspdf'
import {
  REPORT_COORDINATOR,
  REPORT_HEADER,
  REPORT_LAYOUT,
  REPORT_PAGE,
  reportBodyHeightMm,
  reportColumnWidthsMm,
} from '@/lib/assessment/reportLayout'
import type { AssessmentRow, SiteAssessmentResult } from '@/types'

const ROW_PAD_X = 1.5
const LABEL_RATIO = 0.44
const SECTION_TITLE_H = 4.2
const SECTION_BOTTOM_PAD = 1.2
const MIN_SECTION_GAP = 1.2

export interface ExportAssessmentPdfInput {
  mapDataUrl: string
  result: SiteAssessmentResult
  logoDataUrl?: string
}

function pdfText(text: string): string {
  return text
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00b0/g, ' deg')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadImageDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

interface LayoutConfig {
  fontSize: number
  lineH: number
  sectionGap: number
}

function measureRowHeight(
  pdf: jsPDF,
  label: string,
  value: string,
  innerW: number,
  cfg: LayoutConfig,
): number {
  pdf.setFontSize(cfg.fontSize)
  const labelW = innerW * LABEL_RATIO
  const valueW = innerW * (1 - LABEL_RATIO) - 1.5
  const labelLines = pdf.splitTextToSize(pdfText(label), labelW)
  const valueLines = pdf.splitTextToSize(pdfText(value), valueW)
  const lines = Math.max(labelLines.length, valueLines.length, 1)
  return lines * cfg.lineH + 1.4
}

function measureSectionHeight(
  pdf: jsPDF,
  rows: AssessmentRow[],
  innerW: number,
  cfg: LayoutConfig,
): number {
  const rowsH = rows.reduce(
    (sum, row) => sum + measureRowHeight(pdf, row.label, row.value, innerW, cfg),
    0,
  )
  return SECTION_TITLE_H + rowsH + SECTION_BOTTOM_PAD
}

function resolveLayout(
  pdf: jsPDF,
  sections: AssessmentRow[][],
  innerW: number,
  availableH: number,
): LayoutConfig {
  let fontSize = 6.8
  let lineH = 3.1
  let sectionGap = MIN_SECTION_GAP

  const totalFor = (cfg: LayoutConfig) =>
    sections.reduce((sum, rows) => sum + measureSectionHeight(pdf, rows, innerW, cfg), 0) +
    sectionGap * (sections.length - 1)

  let cfg: LayoutConfig = { fontSize, lineH, sectionGap }
  let total = totalFor(cfg)

  while (total < availableH * 0.96 && fontSize < 7.5) {
    fontSize += 0.12
    lineH = 3 + fontSize * 0.02
    cfg = { fontSize, lineH, sectionGap }
    total = totalFor(cfg)
  }

  while (total > availableH && fontSize > 5.4) {
    fontSize -= 0.12
    lineH = 3 + fontSize * 0.02
    cfg = { fontSize, lineH, sectionGap }
    total = totalFor(cfg)
  }

  if (total < availableH && sections.length > 1) {
    sectionGap = MIN_SECTION_GAP + (availableH - total) / (sections.length - 1)
    cfg = { ...cfg, sectionGap }
  }

  return cfg
}

function drawRow(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  cfg: LayoutConfig,
): number {
  pdf.setFontSize(cfg.fontSize)
  const innerW = w - ROW_PAD_X * 2
  const labelW = innerW * LABEL_RATIO
  const valueW = innerW * (1 - LABEL_RATIO) - 1.5
  const valueX = x + ROW_PAD_X + labelW + 1.5
  const rowH = measureRowHeight(pdf, label, value, innerW, cfg)
  const labelLines = pdf.splitTextToSize(pdfText(label), labelW)
  const valueLines = pdf.splitTextToSize(pdfText(value), valueW)
  const startY = y + cfg.fontSize * 0.4

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(71, 85, 105)
  labelLines.forEach((line: string, i: number) => {
    pdf.text(line, x + ROW_PAD_X, startY + i * cfg.lineH)
  })

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  valueLines.forEach((line: string, i: number) => {
    pdf.text(line, valueX, startY + i * cfg.lineH)
  })

  return rowH
}

function drawAssessmentSection(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  title: string,
  rows: AssessmentRow[],
  cfg: LayoutConfig,
): number {
  const innerW = w - ROW_PAD_X * 2
  const sectionH = measureSectionHeight(pdf, rows, innerW, cfg)

  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(x, y, w, sectionH, 0.8, 0.8, 'S')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(cfg.fontSize + 0.15)
  pdf.setTextColor(15, 118, 110)
  pdf.text(title, x + ROW_PAD_X, y + 3.4)

  let rowY = y + SECTION_TITLE_H
  rows.forEach((row, index) => {
    const rowH = measureRowHeight(pdf, row.label, row.value, innerW, cfg)

    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252)
      pdf.rect(x + 0.4, rowY, w - 0.8, rowH, 'F')
    }

    drawRow(pdf, x, rowY, w, row.label, row.value, cfg)

    if (index < rows.length - 1) {
      pdf.setDrawColor(241, 245, 249)
      pdf.setLineWidth(0.12)
      pdf.line(x + ROW_PAD_X, rowY + rowH, x + w - ROW_PAD_X, rowY + rowH)
    }

    rowY += rowH
  })

  return y + sectionH
}

function drawAssessmentPanel(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  result: SiteAssessmentResult,
) {
  const sections: { title: string; rows: AssessmentRow[] }[] = [
    { title: 'SEISMIC HAZARD', rows: result.seismic },
    { title: 'VOLCANIC HAZARD', rows: result.volcanic },
    { title: 'HYDRO-MET HAZARD', rows: result.hydromet },
  ]

  const innerW = w - ROW_PAD_X * 2
  const cfg = resolveLayout(
    pdf,
    sections.map((s) => s.rows),
    innerW,
    h - 10,
  )

  let cursorY = y
  sections.forEach((section, index) => {
    cursorY = drawAssessmentSection(pdf, x, cursorY, w, section.title, section.rows, cfg)
    if (index < sections.length - 1) cursorY += cfg.sectionGap
  })
}

/** Centered logo + LGU titles only — building type/coords go on the map overlay */
function drawReportHeader(pdf: jsPDF, x: number, y: number, w: number, logo: string | null) {
  const centerX = x + w / 2

  if (logo) {
    pdf.addImage(logo, 'PNG', centerX - 7.5, y + 1.5, 15, 15)
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(15, 23, 42)
  pdf.text(REPORT_HEADER.titleLine1, centerX, y + 19.5, { align: 'center' })

  pdf.setFontSize(8)
  pdf.text(REPORT_HEADER.titleLine2, centerX, y + 24, { align: 'center' })

  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.25)
  pdf.line(x, y + REPORT_LAYOUT.headerMm, x + w, y + REPORT_LAYOUT.headerMm)
}

/** White card bottom-left of map — mirrors MapSiteInfoOverlay in the screen view */
function drawMapSiteInfoOverlay(
  pdf: jsPDF,
  mapX: number,
  mapY: number,
  mapH: number,
  buildingType: string,
  lat: number,
  lng: number,
) {
  const boxW = 58
  const pad = 3
  const titleLines = pdf.splitTextToSize(pdfText(buildingType), boxW - 4)
  const titleLineCount = Array.isArray(titleLines) ? titleLines.length : 1
  const boxH = 6 + titleLineCount * 3.2 + 4.5
  const boxX = mapX + pad
  const boxY = mapY + mapH - boxH - pad

  pdf.setFillColor(255, 255, 255)
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(boxX, boxY, boxW, boxH, 0.6, 0.6, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(30, 58, 138)
  pdf.text(titleLines, boxX + 2, boxY + 4.5)

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`${lat.toFixed(5)} N, ${lng.toFixed(5)} E`, boxX + 2, boxY + 4.5 + titleLineCount * 3.2)
}

function drawReportFooter(pdf: jsPDF, x: number, y: number, w: number) {
  // Centered signature blank — leave clear space above for handwritten signature
  const sigW = Math.min(90, w * 0.42)
  const sigX = x + (w - sigW) / 2
  const sigY = y + 12

  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.9)
  pdf.line(sigX, sigY, sigX + sigW, sigY)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(15, 23, 42)
  pdf.text(REPORT_COORDINATOR.name, x + w / 2, sigY + 5, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(71, 85, 105)
  pdf.text(REPORT_COORDINATOR.title, x + w / 2, sigY + 9, { align: 'center' })
}

export async function exportAssessmentReportPdf(input: ExportAssessmentPdfInput): Promise<void> {
  const { mapDataUrl, result, logoDataUrl } = input
  const { buildingType, lat, lng } = result.input

  const logo = logoDataUrl
    ? logoDataUrl
    : await loadImageDataUrl('/lasam-logo.png').catch(() => null)

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const margin = REPORT_PAGE.margin
  const { left: leftW, right: rightW, contentW } = reportColumnWidthsMm()
  const bodyH = reportBodyHeightMm()

  const x0 = margin
  const headerY = margin
  const bodyY = margin + REPORT_LAYOUT.headerMm
  const footerY = bodyY + bodyH
  const rightX = x0 + leftW

  drawReportHeader(pdf, x0, headerY, contentW, logo)

  // Map — left column, full body height
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)
  pdf.rect(x0, bodyY, leftW, bodyH, 'S')
  pdf.addImage(mapDataUrl, 'PNG', x0, bodyY, leftW, bodyH)
  drawMapSiteInfoOverlay(pdf, x0, bodyY, bodyH, buildingType, lat, lng)

  // Assessment — right column
  pdf.setDrawColor(226, 232, 240)
  pdf.line(rightX, bodyY, rightX, bodyY + bodyH)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(15, 23, 42)
  pdf.text('Hazard Assessment', rightX + 2.5, bodyY + 5)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(5.8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('Demonstration report - not an official certificate', rightX + 2.5, bodyY + 8.5)

  pdf.setDrawColor(241, 245, 249)
  pdf.line(rightX, bodyY + 10, rightX + rightW, bodyY + 10)

  drawAssessmentPanel(pdf, rightX + 1.5, bodyY + 11, rightW - 3, bodyH - 12, result)

  drawReportFooter(pdf, x0, footerY, contentW)

  const stamp = new Date().toISOString().slice(0, 10)
  pdf.save(`lasam-site-assessment-${stamp}.pdf`)
}
