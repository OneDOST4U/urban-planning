# 03 — MVP Scope

## In Scope

| Feature | Description |
|---------|-------------|
| 3D Buildings | OSM footprints extruded with `ground_elevation_m` base |
| Terrain foundation | MapLibre 3D terrain (Terrarium), hillshade, contours, cursor elevation |
| Hydrology layers | OSM main rivers, tributaries, drainage, optional flow arrows |
| Flood Simulation | Terrain-connected river overflow (stage + rise), not static rectangle |
| Earthquake Simulation | Magnitude, epicenter, impact radius |
| Fault Line Tool | Draw line, buffer zones, exposure count |
| Building Inspection | Ground elevation, flood depth, hazard status |
| Scenario Summary | Bottom dashboard with live stats |

## Out of Scope (this sprint)

- Login / RBAC (designed for future)
- PostgreSQL / PostGIS
- Official validated flood maps / HEC-RAS 2D (Phase E)
- File uploads
- Real-time hazard feeds
- LiDAR DTM replacement (documented path only)

## Demo Area

Municipality of Lasam, Cagayan — ~13,500 OSM buildings, municipal boundary, OSM waterways, preliminary DEM / elevation grid.
