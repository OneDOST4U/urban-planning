# Lasam Urban Hazard Planning Prototype

Interactive browser-based hazard simulation demonstration for Lasam, Cagayan.

> **For demonstration only.** Results are not official hazard assessments.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
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
- Fault line drawing and danger buffer
- Live scenario statistics dashboard
- 2D/3D map toggle

## Data

Sample GeoJSON files live in `public/data/`:

- `lasam-buildings.geojson` (~295 sample buildings)
- `lasam-boundary.geojson`
- `lasam-rivers.geojson`
- `sample-flood-zone.geojson`
- `sample-fault-line.geojson`
- `sample-earthquake-scenarios.json`

## Deployment

Deploy the `dist/` folder to Vercel or any static host.

Suggested domain: `hazard-map.lasam-mpdc.obratech.net`

## Documentation

- Full SDLC docs: `docs/`
- **Demonstration guide:** `docs/DEMONSTRATION-GUIDE.md`
- AI model policy: `.cursor/rules/composer-model.mdc` (Composer 2.5 Fast)
