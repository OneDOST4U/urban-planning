import { useEffect, useState } from 'react'
import type { Feature, FeatureCollection, LineString } from 'geojson'
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
  mgbFlood: FeatureCollection
  defaultFaults: FeatureCollection
  volcanoes: FeatureCollection
  facilities: FeatureCollection
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

function asFaultCollection(
  data: FeatureCollection | { features?: Feature[] } | null,
): FeatureCollection {
  if (!data?.features?.length) return emptyFc
  return {
    type: 'FeatureCollection',
    features: data.features.filter(
      (f): f is Feature =>
        f?.geometry?.type === 'LineString' || f?.geometry?.type === 'MultiLineString',
    ),
  }
}

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
          psaBoundary,
          osmBoundary,
          riversLegacy,
          riversMain,
          riversTributaries,
          drainage,
          riverbanks,
          watersheds,
          flowArrows,
          contours,
          elevationGrid,
          mgbFlood,
          phivolcsFaults,
          sampleFault,
          volcanoes,
          facilities,
        ] = await Promise.all([
          fetchJson<BuildingCollection>(dataUrl('/data/administrative/lasam-buildings.geojson'))
            .catch(() => fetchJson<BuildingCollection>(dataUrl('/data/lasam-buildings.geojson'))),
          fetchJsonOptional<FeatureCollection>(
            dataUrl('/data/administrative/psa-lasam-boundary.geojson'),
            emptyFc,
          ),
          fetchJsonOptional<FeatureCollection>(
            dataUrl('/data/administrative/lasam-boundary.geojson'),
            emptyFc,
          ).catch(() =>
            fetchJsonOptional<FeatureCollection>(dataUrl('/data/lasam-boundary.geojson'), emptyFc),
          ),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/lasam-rivers.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/rivers-main.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/rivers-tributaries.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/drainage.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/riverbanks.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/watersheds.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/hydrology/flow-arrows.geojson'), emptyFc),
          fetchJsonOptional<FeatureCollection>(dataUrl('/data/terrain/contours.geojson'), emptyFc),
          fetchJsonOptional<ElevationGrid | null>(dataUrl('/data/terrain/elevation-grid.json'), null),
          fetchJsonOptional<FeatureCollection>(
            dataUrl('/data/hazards/mgb-flood-lasam.geojson'),
            emptyFc,
          ),
          fetchJsonOptional<FeatureCollection | null>(
            dataUrl('/data/hazards/phivolcs-faults-lasam.geojson'),
            null,
          ),
          fetchJsonOptional<{ features: Feature<LineString>[] } | null>(
            dataUrl('/data/sample-fault-line.geojson'),
            null,
          ),
          fetchJsonOptional<FeatureCollection>(
            dataUrl('/data/hazards/phivolcs-volcanoes-northern-luzon.geojson'),
            emptyFc,
          ),
          fetchJsonOptional<FeatureCollection>(
            dataUrl('/data/facilities/lasam-critical-facilities.geojson'),
            emptyFc,
          ),
        ])

        if (cancelled) return

        const boundary =
          psaBoundary.features.length > 0
            ? psaBoundary
            : osmBoundary.features.length > 0
              ? osmBoundary
              : emptyFc

        if (boundary.features.length === 0) {
          throw new Error(
            'Municipal boundary missing. Run npm run fetch:boundary (or ensure OSM lasam-boundary.geojson exists).',
          )
        }

        if (mgbFlood.features.length === 0) {
          console.warn(
            'MGB flood GeoJSON missing — run: npm run fetch:boundary && npm run fetch:flood',
          )
        }

        const defaultFaults = asFaultCollection(phivolcsFaults)
        const faults =
          defaultFaults.features.length > 0
            ? defaultFaults
            : asFaultCollection(sampleFault)

        if (faults.features.length === 0) {
          console.warn('No fault line GeoJSON loaded — fault simulation will be inactive.')
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
          mgbFlood,
          defaultFaults: faults,
          volcanoes,
          facilities,
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
