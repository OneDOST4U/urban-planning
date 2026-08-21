/** Open Google Earth Web centered on WGS84 coordinates. */
export function getGoogleEarthWebUrl(lat: number, lng: number): string {
  const safeLat = Number(lat.toFixed(6))
  const safeLng = Number(lng.toFixed(6))
  return `https://earth.google.com/web/@${safeLat},${safeLng},800a,2000d,35y,0h,0t,0r`
}
