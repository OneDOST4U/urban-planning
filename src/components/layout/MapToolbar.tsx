import type { ComponentType } from 'react'
import {
  MousePointer2,
  Hand,
  PencilLine,
  Target,
  Ruler,
  Home,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MapTool } from '@/types'

interface MapToolbarProps {
  activeTool: MapTool
  onToolChange: (tool: MapTool) => void
  onClearDrawings: () => void
}

const tools: { id: MapTool; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pan', label: 'Pan', icon: Hand },
  { id: 'draw-fault', label: 'Draw Fault', icon: PencilLine },
  { id: 'epicenter', label: 'Epicenter', icon: Target },
  { id: 'measure', label: 'Measure', icon: Ruler },
  { id: 'zoom-home', label: 'Zoom Home', icon: Home },
]

export function MapToolbar({ activeTool, onToolChange, onClearDrawings }: MapToolbarProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
      {tools.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={activeTool === id ? 'default' : 'ghost'}
          size="icon"
          title={label}
          onClick={() => onToolChange(id)}
          className={cn('h-9 w-9', activeTool === id && 'shadow-sm')}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="my-1 h-px bg-slate-200" />
      <Button variant="ghost" size="icon" title="Clear drawings" onClick={onClearDrawings} className="h-9 w-9 text-red-600">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
