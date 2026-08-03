"""
Export web assets from conditioned elevation grid:
- contours.geojson
- flow-arrows.geojson
- terrain-rgb tile manifest (MapLibre uses public Terrarium tiles)
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
TERRAIN = ROOT / "public" / "data" / "terrain"
HYDRO = ROOT / "public" / "data" / "hydrology"
RGB_DIR = TERRAIN / "terrain-rgb"
RGB_DIR.mkdir(parents=True, exist_ok=True)


def load_grid() -> dict:
    path = TERRAIN / "elevation-grid.json"
    if not path.exists():
        raise SystemExit("elevation-grid.json missing")
    return json.loads(path.read_text(encoding="utf-8"))


def export_contours(grid: dict, interval: float = 5.0) -> None:
    rows, cols = grid["rows"], grid["cols"]
    values = np.array(grid["values"], dtype=np.float32).reshape(rows, cols)
    west, north, cell = grid["west"], grid["north"], grid["cellSizeDeg"]
    vmin, vmax = float(np.nanmin(values)), float(np.nanmax(values))
    levels = np.arange(math.ceil(vmin / interval) * interval, vmax + interval, interval)

    features = []
    fid = 1
    for level in levels:
        for r in range(rows - 1):
            for c in range(cols - 1):
                a = values[r, c]
                b = values[r, c + 1]
                if (a - level) * (b - level) > 0 or a == b:
                    continue
                t = (level - a) / (b - a)
                lng = west + (c + t) * cell
                lat = north - r * cell
                features.append({
                    "type": "Feature",
                    "properties": {"id": f"CTR-{fid:05d}", "elevation_m": round(float(level), 1)},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[lng, lat], [lng + cell * 0.6, lat]],
                    },
                })
                fid += 1
                if fid > 8000:
                    break
            if fid > 8000:
                break
        if fid > 8000:
            break

    (TERRAIN / "contours.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}),
        encoding="utf-8",
    )
    print(f"Wrote contours.geojson ({len(features)} segments)")


def export_flow_arrows(grid: dict, stride: int = 8, min_acc: float = 5.0) -> None:
    rows, cols = grid["rows"], grid["cols"]
    west, north, cell = grid["west"], grid["north"], grid["cellSizeDeg"]
    flow_dir = grid.get("flowDir") or ["SE"] * (rows * cols)
    flow_acc = grid.get("flowAcc") or [1.0] * (rows * cols)
    values = grid["values"]

    dir_vec = {
        "N": (0, 1), "S": (0, -1), "E": (1, 0), "W": (-1, 0),
        "NE": (0.7, 0.7), "NW": (-0.7, 0.7), "SE": (0.7, -0.7), "SW": (-0.7, -0.7),
    }

    features = []
    fid = 1
    for r in range(0, rows, stride):
        for c in range(0, cols, stride):
            i = r * cols + c
            acc = float(flow_acc[i]) if i < len(flow_acc) else 0
            if acc < min_acc:
                continue
            label = flow_dir[i] if i < len(flow_dir) else "SE"
            dx, dy = dir_vec.get(label, (1, 0))
            lng = west + (c + 0.5) * cell
            lat = north - (r + 0.5) * cell
            length = cell * 0.7
            features.append({
                "type": "Feature",
                "properties": {
                    "id": f"FLOW-{fid:05d}",
                    "direction": label,
                    "accumulation": round(acc, 1),
                    "elevation_m": values[i],
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [lng, lat],
                        [lng + dx * length, lat + dy * length],
                    ],
                },
            })
            fid += 1

    (HYDRO / "flow-arrows.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}),
        encoding="utf-8",
    )
    print(f"Wrote flow-arrows.geojson ({len(features)} arrows)")


def export_tile_manifest() -> None:
    manifest = {
        "tilejson": "2.2.0",
        "name": "AWS Terrarium (global) for Lasam terrain visualization",
        "tiles": ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        "minzoom": 0,
        "maxzoom": 15,
        "encoding": "terrarium",
        "attribution": "Terrain tiles by Mapzen / AWS Public Dataset",
        "bounds": [121.35, 17.97, 121.68, 18.15],
    }
    (RGB_DIR / "tiles.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Wrote terrain-rgb/tiles.json (AWS Terrarium)")


def main() -> None:
    grid = load_grid()
    export_contours(grid, interval=5.0)
    export_flow_arrows(grid)
    export_tile_manifest()
    print("Web terrain assets exported.")


if __name__ == "__main__":
    main()
