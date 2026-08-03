/** Bump when sample GeoJSON in public/data/ changes to bust browser cache. */
export const DATA_VERSION = 'terrain-hydro-20260724'

export function dataUrl(path: string): string {
  return `${path}?v=${DATA_VERSION}`
}

