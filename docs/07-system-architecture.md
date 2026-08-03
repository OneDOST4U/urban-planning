# 07 — System Architecture

```
React Application
├── MapLibre Map
│   ├── Basemap (OpenFreeMap / OSM fallback)
│   ├── Raster-DEM terrain (AWS Terrarium) + hillshade
│   ├── Contours / hydrology vector layers
│   ├── 3D Building Layer (extrusion base = ground elevation)
│   ├── Dynamic inundation Layer
│   ├── Fault-Line Layer
│   └── Earthquake Impact Layer
├── Simulation Engine (browser)
│   ├── Terrain-connected flood fill (river overflow)
│   ├── Optional Web Worker propagation
│   ├── Earthquake UI Rules
│   └── Exposure Calculations (Turf.js)
├── Offline Data Pipeline
│   ├── Node: fetch DEM / hydrology / enrich buildings
│   └── Python: sink fill, slope, D8 flow, web exports
└── Local assets (public/data/{administrative,terrain,hydrology}/)
```

All interactive calculations run client-side. DEM conditioning is offline in scripts.

## Key Paths

- `src/components/map/MapView.tsx` — MapLibre + terrain
- `src/lib/simulation/terrain-flood.ts` — connectivity flood model
- `src/lib/terrain/` — elevation sampling, flood grid helpers
- `scripts/hydrology/` — Python conditioning + export
- `public/data/` — GeoJSON / elevation-grid assets

See also [14-terrain-hydrology-architecture.md](./14-terrain-hydrology-architecture.md).
