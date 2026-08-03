# 09 — Simulation Rules

> **Preliminary Planning Simulation** — prototype rules only. Not validated for official hazard assessment or engineering design.

## Flood (terrain-connected river overflow)

1. Inputs: river stage (m ASL), river rise (m), max water elevation cap.
2. Water surface = `min(riverStage + riverRise, maxWaterElevation)`.
3. Seed flooded cells along OSM river/stream geometry where `ground_elevation < water_surface`.
4. Expand to 8-connected neighbors while neighbor elevation stays below the water surface (connectivity fill — **not** a hydraulic / HEC-RAS model).
5. Building flood depth = `max(0, water_surface − ground_elevation_m)` when the footprint intersects flooded cells.
6. Exposure tiers from depth: 1 m low, 2 m moderate, 3 m high, 4 m+ severe.
7. Static `sample-flood-zone.geojson` is retained only as a legacy fallback when no elevation grid / rise is configured.

## Earthquake

- Epicenter placed by user on map
- Damage based on distance from epicenter and magnitude (M 4.0–8.0)
- Impact radius derived from magnitude
- Categories: minimal, light, moderate, severe, critical

## Fault Line

- User draws LineString on map (double-click to finish)
- Turf.js buffer at 100 m, 250 m, 500 m, or 1 km
- Buildings within buffer highlighted; distance calculated to nearest point on line

## Statistics

Aggregated counts update on every control change: total, flood affected, fault exposed, earthquake affected, risk tiers.
