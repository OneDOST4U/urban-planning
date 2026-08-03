import { Maximize2, RotateCcw, Map, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_DISCLAIMER } from '@/lib/constants'

interface HeaderProps {
  is3D: boolean
  onToggle3D: () => void
  onReset: () => void
  onFullscreen: () => void
}

export function Header({ is3D, onToggle3D, onReset, onFullscreen }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
          LGU
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
            Lasam Urban Hazard Planning
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">Interactive demonstration prototype</p>
        </div>
        <Badge className="hidden bg-amber-50 text-amber-800 sm:inline-flex">Demo Mode</Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={is3D ? 'default' : 'outline'} size="sm" onClick={onToggle3D}>
          {is3D ? <Box className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          {is3D ? '3D' : '2D'}
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button variant="outline" size="icon" onClick={onFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

export function DisclaimerBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
      {DEMO_DISCLAIMER}
    </div>
  )
}
