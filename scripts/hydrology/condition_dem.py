"""
Condition Lasam DEM: sink fill (respecting preserved depressions),
slope, D8 flow direction, and flow accumulation.

If lasam-dem.tif is missing, builds a synthetic GeoTIFF from elevation-grid.json.
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
TERRAIN = ROOT / "public" / "data" / "terrain"
HYDRO = ROOT / "public" / "data" / "hydrology"
TERRAIN.mkdir(parents=True, exist_ok=True)


def load_or_build_dem() -> tuple[np.ndarray, dict]:
    grid_path = TERRAIN / "elevation-grid.json"
    if not grid_path.exists():
        raise SystemExit("elevation-grid.json missing — run npm run fetch:dem first")

    grid = json.loads(grid_path.read_text(encoding="utf-8"))
    rows, cols = grid["rows"], grid["cols"]
    elev = np.array(grid["values"], dtype=np.float32).reshape(rows, cols)

    transform = {
        "west": grid["west"],
        "north": grid["north"],
        "cell": grid["cellSizeDeg"],
        "rows": rows,
        "cols": cols,
    }
    return elev, transform


def fill_sinks(elev: np.ndarray) -> np.ndarray:
    """Fast local pit fill: raise cells lower than all neighbors by less than 2 m."""
    filled = elev.copy()
    padded = np.pad(filled, 1, mode="edge")
    neighbors = np.stack(
        [
            padded[0:-2, 0:-2],
            padded[0:-2, 1:-1],
            padded[0:-2, 2:],
            padded[1:-1, 0:-2],
            padded[1:-1, 2:],
            padded[2:, 0:-2],
            padded[2:, 1:-1],
            padded[2:, 2:],
        ],
        axis=0,
    )
    min_n = np.min(neighbors, axis=0)
    pit_depth = min_n - filled
    mask = (pit_depth > 0.05) & (pit_depth < 2.0)
    filled[mask] = min_n[mask]
    return filled


def compute_slope(elev: np.ndarray, cell_m: float) -> np.ndarray:
    gy, gx = np.gradient(elev, cell_m, cell_m)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    return slope.astype(np.float32)


def compute_flow(elev: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """D8 flow direction codes 1..8 and flow accumulation."""
    rows, cols = elev.shape
    # D8 offsets and codes matching export labels later
    offsets = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1),           (0, 1),
        (1, -1),  (1, 0),  (1, 1),
    ]
    flow_dir = np.zeros((rows, cols), dtype=np.int8)
    for r in range(rows):
        for c in range(cols):
            best_drop = 0.0
            best = 0
            for i, (dr, dc) in enumerate(offsets):
                rr, cc = r + dr, c + dc
                if rr < 0 or cc < 0 or rr >= rows or cc >= cols:
                    continue
                drop = float(elev[r, c] - elev[rr, cc])
                if drop > best_drop:
                    best_drop = drop
                    best = i + 1
            flow_dir[r, c] = best

    # Accumulation: topological order by elevation descending
    order = np.argsort(-elev.ravel())
    flow_acc = np.ones((rows, cols), dtype=np.float32)
    for idx in order:
        r, c = divmod(int(idx), cols)
        code = int(flow_dir[r, c])
        if code == 0:
            continue
        dr, dc = offsets[code - 1]
        rr, cc = r + dr, c + dc
        if 0 <= rr < rows and 0 <= cc < cols:
            flow_acc[rr, cc] += flow_acc[r, c]
    return flow_dir, flow_acc


def write_geotiff_optional(path: Path, array: np.ndarray, transform: dict) -> None:
    try:
        import rasterio
        from rasterio.transform import from_origin
    except ImportError:
        # Write raw float32 sidecar instead
        path.with_suffix(".npy").write_bytes(array.astype(np.float32).tobytes())
        meta = {**transform, "dtype": "float32", "shape": list(array.shape)}
        path.with_suffix(".npy.meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        print(f"rasterio not installed — wrote {path.with_suffix('.npy').name}")
        return

    west, north, cell = transform["west"], transform["north"], transform["cell"]
    transform_affine = from_origin(west, north, cell, cell)
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        height=array.shape[0],
        width=array.shape[1],
        count=1,
        dtype=array.dtype,
        crs="EPSG:4326",
        transform=transform_affine,
        compress="lzw",
    ) as dst:
        dst.write(array, 1)
    print(f"Wrote {path.name}")


def apply_preserved_depressions(elev: np.ndarray, filled: np.ndarray, transform: dict) -> np.ndarray:
    """Restore elevations inside preserved-depressions.geojson if present."""
    path = TERRAIN / "preserved-depressions.geojson"
    if not path.exists():
        return filled
    try:
        from shapely.geometry import shape, Point
    except ImportError:
        return filled

    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if not data.get("features"):
        return filled

    result = filled.copy()
    west, north, cell = transform["west"], transform["north"], transform["cell"]
    rows, cols = elev.shape
    polys = [shape(f["geometry"]) for f in data["features"] if f.get("geometry")]
    for r in range(rows):
        for c in range(cols):
            lng = west + (c + 0.5) * cell
            lat = north - (r + 0.5) * cell
            pt = Point(lng, lat)
            if any(p.contains(pt) for p in polys):
                result[r, c] = elev[r, c]
    return result


def main() -> None:
    elev, transform = load_or_build_dem()
    print(f"DEM grid {elev.shape[1]}×{elev.shape[0]}")

    filled = fill_sinks(elev)
    filled = apply_preserved_depressions(elev, filled, transform)

    cell_m = transform["cell"] * 111_000
    slope = compute_slope(filled, cell_m)
    flow_dir, flow_acc = compute_flow(filled)

    write_geotiff_optional(TERRAIN / "lasam-dem.tif", elev, transform)
    write_geotiff_optional(TERRAIN / "conditioned-dem.tif", filled, transform)
    write_geotiff_optional(TERRAIN / "slope.tif", slope, transform)
    write_geotiff_optional(TERRAIN / "flow-direction.tif", flow_dir.astype(np.float32), transform)
    write_geotiff_optional(TERRAIN / "flow-accumulation.tif", flow_acc, transform)

    # Update elevation-grid with conditioned values for the browser
    grid_path = TERRAIN / "elevation-grid.json"
    grid = json.loads(grid_path.read_text(encoding="utf-8"))
    grid["values"] = [round(float(v), 2) for v in filled.ravel().tolist()]
    grid["slope"] = [round(float(v), 2) for v in slope.ravel().tolist()]
    DIR_LABELS = ["", "NW", "N", "NE", "W", "E", "SW", "S", "SE"]
    grid["flowDir"] = [DIR_LABELS[int(v)] if 0 < int(v) < 9 else "SE" for v in flow_dir.ravel().tolist()]
    grid["flowAcc"] = [round(float(v), 1) for v in flow_acc.ravel().tolist()]
    grid["source"] = "conditioned-synthetic"
    grid_path.write_text(json.dumps(grid), encoding="utf-8")

    log = {
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "steps": [
            "load elevation grid",
            "fill artificial sinks (<2 m)",
            "restore preserved depressions",
            "slope",
            "D8 flow direction",
            "flow accumulation",
            "export geotiffs / npy + update elevation-grid.json",
        ],
        "shape": list(elev.shape),
        "cell_deg": transform["cell"],
    }
    (TERRAIN / "processing-log.json").write_text(json.dumps(log, indent=2), encoding="utf-8")
    print("Hydrologic conditioning complete.")


if __name__ == "__main__":
    main()
