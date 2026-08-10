import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SelectedBuilding } from '@/types'

interface BuildingInfoPanelProps {
  building: SelectedBuilding | null
}

export function BuildingInfoPanel({ building }: BuildingInfoPanelProps) {
  if (!building) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Click a building on the map to inspect hazard exposure.</p>
        </CardContent>
      </Card>
    )
  }

  const rows = [
    ['Building ID', building.id],
    ['Type', building.type],
    ['Barangay', building.barangay],
    ['Estimated Floors', String(building.floors)],
    [
      'Ground Elevation',
      building.groundElevation != null ? `${building.groundElevation.toFixed(1)} m` : '—',
    ],
    ['Flood Status', building.floodStatus],
    ['Flood Note', building.floodDepth],
    ['Earthquake Status', building.earthquakeStatus],
    ['Distance from Fault', building.faultDistance],
    ['Cagua Volcano', building.volcanoStatus ?? '—'],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Building Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900 text-right">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
