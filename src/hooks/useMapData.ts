import { useEffect, useState } from 'react'
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson'
import { dataUrl } from '@/lib/dataVersion'
import type { BuildingCollection, ElevationGrid } from '@/types'

export interface MapData {
  buildings: BuildingCollection
  boundary: FeatureCollection
  rivers: FeatureCollection
  riversMain: FeatureCollection
  riversTributaries: FeatureCollection
  drainage: FeatureCollection
  riverbanks: FeatureCollection
  watersheds: FeatureCollection
  flowArrows: FeatureCollection
  contours: FeatureCollection
  elevationGrid: ElevationGrid | null
  floodZone: Feature<Polygon>
  defaultFaultLine: Feature<LineString>
}

interface UseMapDataResult {
  data: MapData | null
  error: string | null
  isLoading: boolean
  retry: () => void
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`)
  }
  return response.json() as Promise<T>
}

async function fetchJsonOptional<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url)
  } catch {
    return fallback
  }
}

const emptyFc: FeatureCollection = { type: 'FeatureCollection', features: [] }

export function useMapData(): UseMapDataResult {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const [
          buildings,
          boundary,
          riversLegacy,
          riversMain,
          riversTributaries,
          drainage,
          riverbanks,
          watersheds,
          flowArrows,
          contours,
          elevationGrid,
          flood,
          fault,
        ] = await Promise.all([
          fetchJson<BuildingCollection>(dataUrl('/data/administrative/lasam-buildings.geojson'))
            .catch(() => fetchJson<BuildingCollection>(dataUrl('/data/lasam-buildings.geojson'))),
          fetchJson<FeatureCollection>(dataUrl('/data/administrative/lasam-boundary.geojson'))
            .catch(() => fetchJson<FeatureCollection>(dataUrl('/data/lasam-boundary.geojson'))),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/lasam-rivers.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/rivers-main.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/rivers-tributaries.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/drainage.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/riverbanks.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/watersheds.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/flow-arrows.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/terrain/contours.geojson'), emptyFc),
          fetchJsonOptional<ElevationGrid | null>(dataUrl('/data/terrain/elevation-grid.json'), null),
          fetchJson<{ features: Feature<Polygon>[] }>(dataUrl('/data/sample-flood-zone.geojson')),
          fetchJson<{ features: Feature<LineString>[] }>(dataUrl('/data/sample-fault-line.geojson')),
        ])

        if (cancelled) return

        if (!flood.features[0] || !fault.features[0]) {
          throw new Error('Required GeoJSON features are missing from sample data.')
        }

        const riversMainSafe = riversMain.features.length ? riversMain : riversLegacy
        const allRivers: FeatureCollection = {
          type: 'FeatureCollection',
          features: [...riversMainSafe.features, ...riversTributaries.features],
        }

        setData({
          buildings,
          boundary,
          rivers: allRivers,
          riversMain: riversMainSafe,
          riversTributaries,
          drainage,
          riverbanks,
          watersheds,
          flowArrows,
          contours,
          elevationGrid,
          floodZone: flood.features[0],
          defaultFaultLine: fault.features[0],
        })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error loading map data.')
          setData(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  return {
    data,
    error,
    isLoading,
    retry: () => setAttempt((a) => a + 1),
  }
}
