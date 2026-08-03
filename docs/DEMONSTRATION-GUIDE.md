# Lasam Hazard Map — Demonstration Guide

Use this guide when presenting the prototype to MPDC, MDRRMO, engineering staff, or municipal officials.

> **Important:** This system is for demonstration only. Results are not official hazard assessments.

## Before the Meeting

1. Open the application in Chrome or Edge (full screen recommended).
2. Confirm the amber disclaimer banner is visible at the top.
3. Click **Reset** to return to the default view.
4. Test your internet connection (basemap tiles load from OpenFreeMap).

## Recommended Demo Flow (15 minutes)

### 1. Introduction (2 min)

- Show the 3D map of Lasam with sample buildings, river, and boundary.
- Explain that building boxes represent structures and colors will change during scenarios.
- Toggle **2D / 3D** to show presentation flexibility.

### 2. Flood Scenario (4 min)

1. Open the **Flood** tab in the hazard panel.
2. Select **6-hour rainfall** scenario preset.
3. Slowly move the **Water depth** slider from 0 to 3 meters.
4. Point out:
   - Blue water layer rising in the flood zone
   - Building colors changing (gray → yellow → orange → red)
   - **Flood Affected** count updating in the bottom bar
5. Press **Play** to animate the flood timeline.
6. Click a red building → show the inspection popup with simulated flood depth.

### 3. Earthquake Scenario (4 min)

1. Switch to the **Quake** tab.
2. Select the **Epicenter** tool in the map toolbar.
3. Click the map to place the epicenter near Centro.
4. Increase **Magnitude** to M 6.5+ and observe:
   - Concentric impact rings
   - Map shake effect during playback
   - Building damage colors
5. Press **Play** to animate magnitude increase.

### 4. Fault Line Scenario (3 min)

1. Switch to the **Fault** tab.
2. Select **Draw Fault** tool → click several points → double-click to finish.
3. Try buffer options: **250 m** and **500 m**.
4. Highlight the **Exposed buildings** count.
5. Switch to **Select** tool on fault tab to drag and edit the line (Terra Draw).

### 5. Summary and Q&A (2 min)

- Review bottom dashboard: total buildings, affected counts, risk tiers.
- Open **Layers** tab to toggle rivers, buildings, or flood layer.
- Click **Reset** to prepare for the next scenario.

## Mobile / Tablet

On smaller screens, tap **Hazard Panel** (bottom-right) to open controls.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Map blank | Check internet; reload page |
| No buildings | Run `node scripts/generate-buildings.mjs` |
| Draw tool stuck | Click Reset or switch to Select tool |

## Local Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to Vercel. See `docs/12-deployment-plan.md`.
