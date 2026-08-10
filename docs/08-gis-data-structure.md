# 08 — GIS Data Structure

## Layout

```
public/data/
├── administrative/
│   ├── lasam-boundary.geojson          (legacy OSM/Nominatim)
│   ├── psa-lasam-boundary.geojson      (PSA / GeoRisk, PSGC 0201517000)
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
├── hazards/
│   ├── mgb-flood-lasam.geojson         (DENR-MGB flood susceptibility clipped to PSA Lasam)
│   ├── phivolcs-faults-lasam.geojson   (PHIVOLCS Active Fault, 50 km of Lasam)
│   ├── cagua-volcano.geojson           (Cagua summit point, Gonzaga)
│   └── phivolcs-volcanoes-northern-luzon.geojson  (assessment volcano inventory)
├── facilities/
│   └── lasam-critical-facilities.geojson  (schools, health, roads — seed / Overpass)
├── flood-results/          (optional future DREAM/NOAH scenarios)
├── lasam-*.geojson         (legacy root copies for compatibility)
└── sample-fault-line.geojson  (fallback if PHIVOLCS file missing)
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

## Fault properties (PHIVOLCS)

Normalized fields in `hazards/phivolcs-faults-lasam.geojson`:

| Field | Description |
|-------|-------------|
| `id` | `afcodepk` or `objectid` |
| `name` | Display label: `{fault_name} ({category}, {trace_type})` |
| `fault_name` | Decoded system name from `fname` subtype (e.g. Bangui Fault) |
| `fault_class` | `Active` or `Potentially Active` |
| `category_label` | `Active Fault` / `Potentially Active Fault` |
| `trace_type` | PHIVOLCS domain from `ttcode` (Certain, Approximate, Concealed, …) |
| `line_type` | Optional line symbology hint from `ltcode` |
| `legend_key` | MapLibre style group (`active-certain`, `active-approximate`, …) |
| `mechanism` | e.g. Strike-Slip (when present) |
| `data_source` | `PHIVOLCS / GeoRisk ULAP` |
| `fname`, `segname`, `afcode`, `fccode`, `ttcode`, `ltcode` | Raw PHIVOLCS attributes |

## Cagua volcano (Gonzaga)

Point feature in `hazards/cagua-volcano.geojson` (summit ≈ `[122.123, 18.222]`):

| Field | Description |
|-------|-------------|
| `name` | Cagua Volcano |
| `municipality` | Gonzaga |
| `elevation_m` | ~1133 |
| `last_eruption` | 1860 CE (phreatic; demo metadata) |
| `data_source` | PHIVOLCS / Smithsonian GVP (demonstration) |

Planning rings (10 / 20 / 30 / 50 / 60 km) are computed in the app with Turf `circle` — not official PHIVOLCS hazard zones.

## Volcano inventory (site assessment)

`hazards/phivolcs-volcanoes-northern-luzon.geojson` — northern Luzon subset for Assess tab:

| Field | Description |
|-------|-------------|
| `name` | Volcano name |
| `status` | `Active` / `Potentially Active` / `Inactive` |
| `data_source` | PHIVOLCS / GVP demonstration |

## Critical facilities

`facilities/lasam-critical-facilities.geojson` — seed or Overpass (`npm run fetch:facilities`):

| Field | Description |
|-------|-------------|
| `name` | Facility or road label |
| `category` | `elementary_school`, `secondary_school`, `govt_health`, `private_health`, `primary_road`, `secondary_road` |

## Pipeline Commands

```bash
npm run fetch:boundary   # PSA Lasam polygon (PSGC 0201517000)
npm run fetch:flood      # DENR-MGB flood susceptibility clipped to Lasam
npm run fetch:dem
npm run fetch:hydrology
npm run fetch:faults
npm run fetch:facilities
npm run process:terrain
npm run enrich:buildings
# or terrain stack:
npm run prepare:terrain
```

Optional: set `OPENTOPOGRAPHY_API_KEY` in `.env` (see `.env.example`) for SRTM download. Without a key, a synthetic elevation grid is generated for demos.

Python deps: `pip install -r requirements.txt` (rasterio optional; `.npy` sidecars are written if missing).

## MGB flood properties

`hazards/mgb-flood-lasam.geojson` — clipped to PSA Lasam:

| Field | Description |
|-------|-------------|
| `susceptibility` | `low` / `moderate` / `high` / `very_high` |
| `susceptibility_label` | Display label |
| `raw_class` | Original MGB `FloodSusc` code (LF/MF/HF/VHF) |
| `data_source` | DENR-MGB / controlmap.mgb.gov.ph |

## PSA boundary

`administrative/psa-lasam-boundary.geojson` — preferred municipal outline (`psgc_10d=0201517000`). OSM `lasam-boundary.geojson` remains as fallback.
