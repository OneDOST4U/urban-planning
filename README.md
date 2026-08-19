# Lasam Urban Hazard Planning Prototype

Interactive browser-based hazard simulation demonstration for Lasam, Cagayan.

> **For demonstration only.** Results are not official hazard assessments.

## Quick Start

```bash
npm install
npm run fetch:boundary
npm run fetch:flood
npm run fetch:faults
npm run dev
```

Open `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run fetch:boundary` | Download PSA municipal boundary for Lasam (PSGC 0201517000) |
| `npm run fetch:flood` | Download DENR-MGB flood susceptibility clipped to Lasam |
| `npm run fetch:faults` | Download PHIVOLCS faults within 50 km of Lasam |
| `npm run fetch:facilities` | Refresh critical facilities from OSM Overpass (keeps seed on failure) |
| `node scripts/generate-buildings.mjs` | Regenerate sample GeoJSON data |

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn-style UI components
- MapLibre GL JS (3D building extrusions)
- Turf.js (spatial calculations)
- Terra Draw (planned for advanced fault drawing)

## Features (Prototype)

- 3D building boxes with click-to-inspect
- Flood simulation with water depth slider
- Earthquake simulation with epicenter placement
- PHIVOLCS fault lines (Active / Potentially Active) within 50 km of Lasam
- Fault buffer exposure + optional user-drawn what-if line
- Cagua volcano (Gonzaga) planning buffers + Lasam building exposure counts
- **Assess tab** — enter coordinates + building type, fly to pin, Hazard Hunter–style report (Flood MGB pending)
- Live scenario statistics dashboard
- 2D/3D map toggle

## Data

Sample GeoJSON files live in `public/data/`:

- `administrative/lasam-buildings.geojson`
- `administrative/lasam-boundary.geojson`
- `hydrology/*.geojson`
- `hazards/phivolcs-faults-lasam.geojson` (PHIVOLCS / GeoRisk ULAP)
- `hazards/cagua-volcano.geojson` (Cagua summit — Gonzaga; demo)
- `hazards/phivolcs-volcanoes-northern-luzon.geojson` (site assessment inventory)
- `facilities/lasam-critical-facilities.geojson` (schools, health, roads)
- `sample-flood-zone.geojson`
- `sample-fault-line.geojson` (fallback)
- `sample-earthquake-scenarios.json`

## Deployment

**Vercel:** deploy the `dist/` folder from `main`.

**On-prem (dedicated server + Cloudflare Tunnel):** same general pattern as events, but on a **separate** Ubuntu host with its **own** tunnel. See [docs/ONPREM_SETUP.md](docs/ONPREM_SETUP.md). Local origin is `http://127.0.0.1:80`. Example public host: `lasam.dost02.com` (change to whatever you create in Cloudflare DNS).

## Documentation

- Full SDLC docs: `docs/`
- **Demonstration guide:** `docs/DEMONSTRATION-GUIDE.md`
- AI model policy: `.cursor/rules/composer-model.mdc` (Composer 2.5 Fast)
