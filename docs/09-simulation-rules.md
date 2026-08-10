# 09 — Simulation Rules

> **Preliminary Planning Prototype** — rules for demonstration UX. Not validated for official hazard assessment or engineering design.

## Flood (DENR-MGB susceptibility)

1. Official MGB flood susceptibility polygons are fetched from controlmap.mgb.gov.ph (`FloodSusc`: LF / MF / HF / VHF).
2. Polygons are clipped to the PSA Lasam municipal boundary (`psgc_10d=0201517000`).
3. Classes: Low (≤0.5 m, 1–3 days), Moderate (>0.5–1.0 m), High (>1–2 m), Very High (>2 m).
4. Building exposure = centroid point-in-polygon against MGB classes (highest class wins if polygons overlap).
5. Map fills are classified colors — not a river-stage / DEM overflow simulation.
6. Site assessment reports the MGB class at the assessed coordinates.
7. Future optional layers (not in v1): UP DREAM / Phil-LiDAR rainfall return-period maps, Project NOAH cross-check. Require LiPAD EULA / redistribution permission before publishing.

Deprecated (removed from primary flood UI): terrain-connected river overflow (`terrain-flood.ts`) and static `sample-flood-zone.geojson`. Terrain DEM modules may still exist for hillshade / elevation sampling only.

## Earthquake

- Epicenter placed by user on map
- Damage based on distance from epicenter and magnitude (M 4.0–8.0)
- Impact radius derived from magnitude
- Categories: minimal, light, moderate, severe, critical
- No camera-shake animation (rings + building damage colors only)

## Fault Line

- Default geometry: official **PHIVOLCS** Active Fault polylines clipped to **50 km** of Lasam center (`public/data/hazards/phivolcs-faults-lasam.geojson`)
- Includes Active (`fccode` 01) and Potentially Active (`fccode` 02) segments
- Trace styles from `ttcode` (Certain / Approximate / Concealed / fissures / upthrown / downthrown) with MapLibre line color + dash approximation of the GeoRisk legend
- Feature names decoded from `fname` subtypes (e.g. Dummon River Fault System, Bangui Fault)
- Building `faultDistance` = distance from centroid to the **nearest** segment (meters)
- Turf.js buffer at 100 m, 250 m, 500 m, or 1 km across all segments (union for map fill)
- Buildings within buffer of **any** segment are counted as exposed
- Optional: user-drawn LineString temporarily replaces the PHIVOLCS set for what-if demos
- Demo only — not an official PHIVOLCS hazard certificate for Lasam LGU decisions

## Cagua Volcano (Gonzaga)

- Summit reference: Gonzaga, Cagayan (`122.123, 18.222`) — PHIVOLCS / Smithsonian GVP metadata for demo
- Planning buffers at 10 / 20 / 30 / 50 / 60 km (slider also allows 5–80 km)
- Building distance = centroid → summit (km); exposure tiers by buffer band when inside the active assessment radius
- Lasam is roughly 50–60 km from Cagua — default assessment radius **60 km** so outer-buffer demos reach Lasam buildings
- **Not** official PHIVOLCS eruption / ashfall / lahar hazard maps

## Site assessment (Site Assessment popup)

Point-based Hazard Hunter–style report for a proposed building at `[lng, lat]`:

| Field | Demo rule |
|-------|-----------|
| Nearest Active Fault | Distance + compass direction to nearest Active PHIVOLCS segment |
| Ground Rupture | Prone if &lt; 250 m from active trace; else Safe |
| Ground Shaking | Approx. MMI from distance to nearest fault (regional M6.5 demo) |
| Landslide / Liquefaction | Temporarily Unavailable |
| Tsunami | Safe if &gt; 25 km from Aparri coast reference |
| Volcanoes | Nearest Active / Potentially Active / Inactive from northern Luzon inventory |
| Ashfall | Prone &lt; 60 km from Cagua; Moderate 60–100 km; else Low |
| Flood (MGB) | Susceptibility class from clipped MGB polygons at site |
| Storm Surge | Safe if &gt; 15 km inland of coast reference |
| Severe Wind | Static PAGASA-style Cagayan Valley demo text |
| Critical facilities | Nearest school / health / road features from facilities GeoJSON |

Building type (Small House, Warehouse, Common Building) is shown in the report header only — it does not change hazard math in v1.
