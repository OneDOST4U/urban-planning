# 08 — GIS Data Structure

## Layout

```
public/data/
├── administrative/
│   ├── lasam-boundary.geojson
│   └── lasam-buildings.geojson
├── terrain/
│   ├── elevation-grid.json
│   ├── dem-metadata.json
│   ├── contours.geojson
│   ├── preserved-depressions.geojson
│   ├── terrain-rgb/tiles.json
│   └── *.tif / *.npy (conditioning outputs)
├── hydrology/
│   ├── rivers-main.geojson
│   ├── rivers-tributaries.geojson
│   ├── drainage.geojson
│   ├── riverbanks.geojson
│   ├── watersheds.geojson
│   ├── flow-arrows.geojson
│   └── structures.geojson
├── flood-results/          (optional precomputed scenarios)
├── lasam-*.geojson         (legacy root copies for compatibility)
├── sample-flood-zone.geojson
└── sample-fault-line.geojson
```

## Building Properties

```json
{
  "id": "LAS-BLDG-0025",
  "type": "Residential",
  "barangay": "Lasam (OSM)",
  "floors": 2,
  "height": 7,
  "height_estimated": true,
  "ground_elevation_m": 14.8,
  "roof_elevation_m": 21.8,
  "nearest_river_m": 120,
  "nearest_river_name": "Cagayan River",
  "drainage_direction": "SE"
}
```

## Pipeline Commands

```bash
npm run fetch:dem
npm run fetch:hydrology
npm run process:terrain
npm run enrich:buildings
# or all:
npm run prepare:terrain
```

Optional: set `OPENTOPOGRAPHY_API_KEY` in `.env` (see `.env.example`) for SRTM download. Without a key, a synthetic elevation grid is generated for demos.

Python deps: `pip install -r requirements.txt` (rasterio optional; `.npy` sidecars are written if missing).
