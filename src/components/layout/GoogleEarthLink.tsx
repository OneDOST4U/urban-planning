import { ExternalLink } from 'lucide-react'
import { getGoogleEarthWebUrl } from '@/lib/assessment/googleEarth'

interface GoogleEarthLinkProps {
  lat: number
  lng: number
  className?: string
  label?: string
}

export function GoogleEarthLink({
  lat,
  lng,
  className = '',
  label = 'View in Google Earth',
}: GoogleEarthLinkProps) {
  return (
    <a
      href={getGoogleEarthWebUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline ${className}`}
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  )
}
