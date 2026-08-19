import { Maximize2, RotateCcw, Map, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { APP_BRAND, APP_DEMO_SUBTITLE, APP_LOGO_ALT, APP_LOGO_PATH } from '@/lib/constants'

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
        <img
          src={APP_LOGO_PATH}
          alt={APP_LOGO_ALT}
          className="h-9 w-9 shrink-0 object-contain"
        />
        <div>
          <h1 className="text-xs font-semibold tracking-wide text-slate-900 sm:text-sm">
            {APP_BRAND.name}
          </h1>
          <p className="hidden max-w-xl text-xs leading-snug text-slate-500 sm:block">
            {APP_BRAND.tagline}
          </p>
          <p className="text-[10px] text-slate-400 sm:hidden">{APP_DEMO_SUBTITLE}</p>
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
