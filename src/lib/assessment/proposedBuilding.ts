import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { ProposedBuildingType } from '@/lib/assessment/buildingTypes'
import { getProposedBuildingDimensions, PROPOSED_BUILDING_COLOR } from '@/lib/assessment/buildingDimensions'

/** Build a north-aligned rectangular footprint centered on [lng, lat]. */
export function createProposedBuildingFeature(
  lng: number,
  lat: number,
  buildingType: ProposedBuildingType,
): Feature<Polygon> {
  const dims = getProposedBuildingDimensions(buildingType)
  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180)
  const halfW = dims.widthM / 2 / metersPerDegLng
  const halfD = dims.depthM / 2 / metersPerDegLat

  const ring: [number, number][] = [
    [lng - halfW, lat - halfD],
    [lng + halfW, lat - halfD],
    [lng + halfW, lat + halfD],
    [lng - halfW, lat + halfD],
    [lng - halfW, lat - halfD],
  ]

  return {
    type: 'Feature',
    properties: {
      id: 'proposed-building',
      name: buildingType,
      type: buildingType,
      floors: dims.floors,
      height: dims.heightM,
      width_m: dims.widthM,
      depth_m: dims.depthM,
      color: PROPOSED_BUILDING_COLOR,
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

export function createProposedBuildingCollection(
  lng: number,
  lat: number,
  buildingType: ProposedBuildingType,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [createProposedBuildingFeature(lng, lat, buildingType)],
  }
}
