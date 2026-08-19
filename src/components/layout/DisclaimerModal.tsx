import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMO_DISCLAIMER, SIMULATION_DISCLAIMER, APP_BRAND, APP_DEMO_SUBTITLE, APP_LOGO_PATH } from '@/lib/constants'

interface DisclaimerModalProps {
  open: boolean
  onClose: () => void
}

export function DisclaimerModal({ open, onClose }: DisclaimerModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-amber-50 shadow-2xl">
        <div className="border-b border-amber-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_PATH}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              aria-hidden
            />
            <div>
              <h2 id="disclaimer-title" className="text-sm font-semibold text-amber-950 sm:text-base">
                {APP_BRAND.name}
              </h2>
              <p className="text-xs leading-snug text-amber-800">{APP_BRAND.tagline}</p>
              <p className="mt-1 text-[10px] text-amber-700">{APP_DEMO_SUBTITLE}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm leading-relaxed text-amber-950">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <p>{DEMO_DISCLAIMER}</p>
          </div>
          <p className="border-t border-amber-200 pt-4 text-xs text-amber-900">{SIMULATION_DISCLAIMER}</p>
        </div>

        <div className="border-t border-amber-200 px-5 py-4">
          <Button className="w-full" onClick={onClose}>
            I Understand — Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
