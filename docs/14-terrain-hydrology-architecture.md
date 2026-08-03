# 14 — Terrain & Hydrology Architecture

## Purpose

Provide a **preliminary** terrain and hydrology foundation for the Lasam urban hazard planning prototype: DEM-backed elevation, OSM waterways, MapLibre 3D terrain, building ground elevation, and connectivity-based river-overflow flood visualization.

This is **not** a substitute for validated hydraulic modelling or official flood hazard maps.

## Phases A–D (implemented)

| Phase | Capability |
|-------|------------|
| A | DEM / elevation grid, MapLibre terrain + hillshade, building `ground_elevation_m`, TerrainInfoBar |
| B | OSM rivers / tributaries / drainage layers, layer toggles, RiverInfoCard |
| C | Python conditioning (sink fill with preserved depressions), slope, D8 flow, contours & flow arrows |
| D | Terrain-connected flood fill from river stage + rise; dynamic inundation; Web Worker helper |

## Data sources

| Asset | Source | Notes |
|-------|--------|-------|
| Elevation grid | Synthetic prototype **or** OpenTopography SRTMGL1 | Synthetic used when no API key |
| MapLibre terrain tiles | AWS Terrarium public DEM tiles | Visualization only |
| Waterways | OpenStreetMap Overpass | Clip to Lasam relation |
| Buildings | OpenStreetMap footprints | Min elevation under footprint |

**Disclaimer:** Copernicus GLO-30 / SRTM are closer to DSM than bare-earth DTM. Elevations may include vegetation and rooftops. Label all products as preliminary.

## Flood algorithm (Phase D)

```
water_surface = min(river_stage + river_rise, max_water)
seed = river cells where elev < water_surface
while queue:
  expand to 8-neighbors with elev < water_surface
building_depth = water_surface - ground_elevation_m  (if footprint intersects flooded cells)
```

No Manning roughness, dikes, or unsteady flow in this phase. Barriers from `hydrology/structures.geojson` are reserved for a future update.

## Phase E — Future roadmap (not implemented)

1. **HEC-RAS 2D** (or similar) precomputed depth rasters → `public/data/flood-results/*.tif` as map overlays
2. **LiPAD / LiDAR DTM** replacement for GLO-30 / synthetic DEM
3. Barangay boundaries, bridges/culverts inventory, Manning roughness surfaces
4. Formal data licensing review before public deployment
5. HydroSHEDS / HydroRIVERS validated network overlay (replace watershed stub)

## Safeguards

- `terrain/preserved-depressions.geojson` — exclude real ponds from sink fill
- `terrain/processing-log.json` — audit trail of conditioning steps
- Persistent UI banner: *Preliminary Planning Simulation — not validated for official decisions*
- Never commit API keys; use `.env` / `.env.example`

## Commands

```bash
pip install -r requirements.txt
npm run prepare:terrain
npm run dev
```
