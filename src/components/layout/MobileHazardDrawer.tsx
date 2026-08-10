import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HazardPanel } from '@/components/layout/HazardPanel'
import type { ComponentProps } from 'react'

type HazardPanelProps = ComponentProps<typeof HazardPanel>

interface MobileHazardDrawerProps extends HazardPanelProps {
  isOpen: boolean
  onToggle: () => void
}

/** Below app header (h-14) + spacing */
const PANEL_TOGGLE_TOP = 'top-[calc(3.5rem+0.75rem)]'

export function MobileHazardDrawer({ isOpen, onToggle, ...panelProps }: MobileHazardDrawerProps) {
  const [desktopOpen, setDesktopOpen] = useState(true)

  return (
    <>
      <div className={`fixed right-3 z-20 lg:hidden ${PANEL_TOGGLE_TOP}`}>
        <Button size="sm" onClick={onToggle} className="shadow-lg">
          <Layers className="mr-2 h-4 w-4" />
          Hazard Panel
        </Button>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Close hazard panel"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-sm transform bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold">Hazard Controls</h2>
            <Button variant="ghost" size="sm" onClick={onToggle}>Close</Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <HazardPanel {...panelProps} />
          </div>
        </div>
      </div>

      {desktopOpen ? (
        <div className="hidden shrink-0 lg:flex">
          <HazardPanel {...panelProps} onCollapse={() => setDesktopOpen(false)} />
        </div>
      ) : (
        <Button
          size="sm"
          className={`fixed right-3 z-20 hidden shadow-lg lg:inline-flex ${PANEL_TOGGLE_TOP}`}
          onClick={() => setDesktopOpen(true)}
          title="Show hazard panel"
        >
          <Layers className="mr-2 h-4 w-4" />
          Hazard Panel
        </Button>
      )}
    </>
  )
}
