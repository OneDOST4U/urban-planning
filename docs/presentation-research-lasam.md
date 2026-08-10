# Research Presentation  
## Lasam Urban Hazard Planning: From Global Risk to Local Decision Support

**Municipality:** Lasam, Cagayan, Philippines  
**Focus:** Urban planning, multi-hazard exposure, and a prototype GIS decision-support tool  
**Audience:** LGU officials, MPDC, MDRRMO, academia / research panel  
**Disclaimer:** Demonstration prototype — not an official PHIVOLCS / MGB / PAGASA certificate

---

## How to use this deck

Copy each **Slide** block into PowerPoint or Google Slides (title = slide title; bullets = body).  
*Speaker notes* are optional talking points under each slide.

Suggested length: **12–15 minutes** + Q&A.

---

# PART 1 — Global context

## Slide 1 — Title

**Lasam Urban Hazard Planning Prototype**  
From World Risk → Philippines → Cagayan → Lasam  
A local solution where interactive hazard planning tools do not yet exist

- Presenter: _______________________________  
- Affiliation: LGU Lasam / Urban Planning Assessment  
- Date: _______________________________

*Speaker notes:* Open with one sentence: “We start at the world, then zoom into Lasam, then show why a local prototype is needed.”

---

## Slide 2 — Agenda

1. Global urban risk and climate pressure  
2. Philippines and Northern Luzon hazard setting  
3. Lasam: urban planning problem and effects  
4. Current practice — gap (no existing interactive system)  
5. Proposed solution — the Lasam prototype  
6. Features, data sources, impact, limits, next steps  

*Speaker notes:* Promise a funnel structure: world → nation → municipality → solution.

---

## Slide 3 — The world problem

**Cities and growing settlements sit on hazard paths**

- Rapid urbanization expands building stock into floodplains, soft soils, and near active structures  
- Multi-hazard risk is rising: floods, earthquakes, volcanic ash, storms  
- Planners must decide **where to allow, densify, or relocate** with incomplete visual tools  
- Static paper maps and spreadsheet counts are hard to debate in meetings  
- Decision-makers need **shared, visual scenarios** before irreversible land-use choices  

*Speaker notes:* Emphasize “planning without visualization = delayed or biased decisions,” not fear.

---

## Slide 4 — Why urban planning is exposed

**Effects when hazard is poorly integrated into planning**

| Planning failure | Typical effect |
|------------------|----------------|
| Build in flood-susceptible zones | Repeated damage, disruption of livelihoods |
| Ignore fault proximity | Higher ground-rupture / shaking exposure for new structures |
| Site critical facilities poorly | Delayed emergency response after events |
| No shared map in LGU meetings | Conflicting mental models among offices |

*Speaker notes:* Bridge from global effects to “this is exactly what LGUs face every rezoning and permit discussion.”

---

# PART 2 — Narrowing to the Philippines

## Slide 5 — Philippines: hazard-rich archipelago

**National hazard landscape (planning context)**

- High exposure to typhoons, flooding, and seismic activity  
- National agencies publish authoritative layers:  
  - **DENR–MGB** — flood (and related) susceptibility  
  - **PHIVOLCS** — active faults, volcanoes  
  - **PAGASA** — hydro-meteorological advisories  
- Local Government Units (LGUs) must **operationalize** these data in zoning, housing, and permitting  
- Gap: national datasets exist, but **local interactive synthesis** is often missing  

*Speaker notes:* Stress: data often exists at national / provincial level; municipality still lacks a daily planning interface.

---

## Slide 6 — Zooming in: Cagayan & Northern Luzon

**Regional setting relevant to Lasam**

- Cagayan Valley faces monsoon / typhoon-driven flooding and riverine inundation  
- Northern Luzon hosts significant tectonic structures (fault systems)  
- **Cagua Volcano** (Gonzaga) is a regional volcanic reference for distance-based planning context  
- Lasam lies in this multi-hazard envelope — flood susceptibility + fault distance + volcanic distance matter for siting  

*Speaker notes:* One map metaphor: “Cagayan is the stage; Lasam is the scene we design for.”

---

# PART 3 — The Lasam problem

## Slide 7 — Lasam, Cagayan: the focus municipality

**Local planning context**

- Growing settlement pattern around roads, rivers, and barangay centers  
- Need for hazard-aware: residential, institutional, commercial, and socialized housing proposals  
- Multiple offices involved: **MPDC**, Municipal Engineering, **MDRRMO**, Mayor’s office, barangays  
- Decisions affect where people live and where schools / clinics / roads connect  

*Speaker notes:* Name MPDC as primary user of planning visualization.

---

## Slide 8 — Urban planning problem in Lasam

**Core problem statement**

> Lasam’s planners need to show and discuss **flood susceptibility, fault proximity, and related urban exposure** with stakeholders — but everyday tools remain static or fragmented.

**Symptoms**

- Hazard discussion relies on printouts, separate agency maps, or verbal estimate  
- Hard to answer: “If we site a school / house **here**, what do official layers say?”  
- Building inventory and hazard layers are not in one shared interactive scene  
- Meeting time is lost reconciling conflicting maps and counts  

*Speaker notes:* Repeat problem slide slowly — it is the thesis of the talk.

---

## Slide 9 — How the problem affects people and governance

**Impacts if left unaddressed**

1. **People** — New homes and businesses may be approved without a clear, shared hazard picture  
2. **Infrastructure** — Schools, health stations, and road links may be poorly sited relative to flood / fault context  
3. **Public finance** — Repair and recovery costs rise after preventable exposure decisions  
4. **Trust & coordination** — MDRRMO, engineering, and MPDC may operate on different map narratives  
5. **Preparedness** — Harder to run scenario conversations before emergencies (not replacing response plans)

*Speaker notes:* Keep language responsible: tool supports planning dialogue; not panic messaging.

---

# PART 4 — Current system: the gap

## Slide 10 — Current system in Lasam

**What exists today (typical LGU practice)**

- Official hazard products from MGB / PHIVOLCS / related agencies (external references)  
- Plan documents, zoning ordinances, and paper / PDF maps  
- Spreadsheets or informal counts of buildings / projects  
- Site visits and stakeholder consultation  

*Speaker notes:* Be fair: Lasam already has planning process — the gap is interactive synthesis.

---

## Slide 11 — No existing local interactive solution

**The gap this research / prototype targets**

| Need | Current state in Lasam |
|------|-------------------------|
| Interactive 3D view of buildings + hazards | Not available locally as a day-to-day tool |
| One screen for flood + fault + volcano context | Layers split across portals / print products |
| Site assessment for a proposed establishment | No Hazard Hunter–style local workflow in-office |
| Live “what if we show this layer?” in meetings | Relies on static maps |
| Exportable assessment layout for MPDC review | No integrated report with map + signature block |

**Conclusion for this slide:**  
There is **no existing Lasam-specific, browser-based multi-hazard urban planning demonstration system** for MPDC-led meetings — that is the solution space we enter.

---

# PART 5 — The solution

## Slide 12 — Solution overview

**Lasam Urban Hazard Planning Prototype**

A **frontend-only**, browser-based map for **demonstrating** flood (MGB), fault (PHIVOLCS), volcano (Cagua / inventory), and site assessment for proposed buildings in Lasam.

**Design principles**

- Official layers where available (MGB flood, PHIVOLCS faults)  
- Clear **demonstration disclaimer** — not a legal certificate  
- Built for **presentation** to LGU decision-makers  
- Extensible path toward future simulation features (flood / fault)

*Speaker notes:* Emphasize “prototype for planning dialogue,” not “official hazard certification.”

---

## Slide 13 — Who it serves

| Primary | Supporting |
|---------|------------|
| MPDC (Municipal Planning & Development) | MDRRMO |
| Municipal Engineering | Mayor / Sanggunian briefings |
| GIS / planning staff | Barangay consultations |

**Jobs to be done**

- Orient stakeholders to Lasam’s hazard layers in one interface  
- Inspect buildings and surrounding context in 3D  
- Assess a **proposed site** (type + coordinates) and export a report draft  
- Support transparent discussion before land-use commitments  

---

## Slide 14 — Funnel summarized (one diagram slide)

Use this as a single graphic:

```
WORLD          Cities face multi-hazard urbanization risk
   ↓
PHILIPPINES    Strong national hazard agencies & data
   ↓
CAGAYAN        Flood + tectonic + volcanic regional setting
   ↓
LASAM          Needs local interactive planning view
   ↓
GAP            No existing Lasam interactive multi-hazard tool
   ↓
SOLUTION       Browser prototype: map + layers + site assessment
```

---

## Slide 15 — Solution: key capabilities

**Map & urban fabric**

- Whole-municipality view of Lasam  
- 3D building boxes (sample / OSM-derived inventory)  
- Rivers, terrain (where connected), boundary  

**Hazards**

- DENR–MGB flood susceptibility (toggle, opacity, legend)  
- PHIVOLCS fault lines (Active / Potentially Active near Lasam)  
- Cagua / volcanic context for distance-based assessment  

**Site Assessment (core planning feature)**

- Choose building / establishment type  
- Place or enter coordinates  
- Preview proposed box building + nearby structures  
- Hazard Assessment tables (seismic, volcanic, hydro-met, facilities)  
- A4 landscape PDF with official-style header + MPDC signature line  

*Speaker notes:* Demo live after this slide if possible.

---

## Slide 16 — Data foundation (credibility)

| Layer | Source / nature |
|-------|-----------------|
| Municipal boundary | PSA (PSGC Lasam) |
| Flood susceptibility | DENR–MGB (clipped to Lasam) |
| Faults | PHIVOLCS / GeoRisk ULAP |
| Volcanoes | PHIVOLCS / GVP-style inventory + Cagua summit |
| Facilities | OSM-derived schools, health, roads (demo) |
| Buildings | Sample / generated inventory for demonstration |

*Speaker notes:* Transparency builds trust — say what is official vs demo approximation.

---

## Slide 17 — Architecture (lightweight)

**Stack:** React + TypeScript + MapLibre + Turf.js · no backend in v1  

**Why this fits LGUs**

- Runs in a browser (meeting room / laptop)  
- Static deployable build  
- No login database required for prototype  
- Fast iteration for planning demos  

*Speaker notes:* Research angle: accessibility of open web GIS for municipal planning units.

---

## Slide 18 — Gap vs solution (contrast)

| Gap (before) | Prototype (after) |
|--------------|-------------------|
| Static / siloed maps | Interactive layers in one map |
| Hard to discuss “this lot” | Pin + site assessment report |
| Building exposure abstract | Visible 3D boxes + counts |
| No local tool for meetings | Browser app tailored to Lasam |
| No MPDC-facing export | PDF report with signature blank |

---

## Slide 19 — Future features (honest roadmap)

Already marked in UI as **Future Feature**:

- Interactive **Flood Simulation** beyond layer display  
- Interactive **Fault Simulation** beyond distance / line display  

**Near-term research / product path**

1. Official validation workshops with MPDC / MDRRMO  
2. Improved building / facility inventory quality  
3. Align wording with Hazard Hunter / agency certificates carefully (legal boundary)  
4. Barangay-level scenario kits  

---

## Slide 20 — Limitations (scientific & legal)

**Must state clearly**

- Demonstration only — **not** an official PHIVOLCS / MGB / PAGASA certificate  
- Not a full numerical flood inundation or ground-motion model  
- Ashfall / intensity rules are planning approximations for demo  
- Requires internet for basemap / DEM tiles in current build  

*Speaker notes:* Showing maturity: researchers own limitations.

---

## Slide 21 — Expected impact

**If adopted as a planning conversation tool**

- Faster shared understanding in LGU meetings  
- Earlier questions about flood susceptibility and fault distance for proposals  
- Clearer documentation trail (assessment PDF draft)  
- Bridge between national agency datasets and local land-use talk  

**Impact is governance quality, not prediction of earthquakes or floods.**

---

## Slide 22 — Research contribution (academic framing)

1. **Problem framing:** Municipality-scale gap between national hazard data and local interactive planning use  
2. **Artifact:** Open web GIS prototype for Lasam multi-hazard demonstration  
3. **Method:** Layer integration (MGB, PHIVOLCS) + site assessment workflow + report export  
4. **Implication:** Replicable pattern for other Cagayan / PH municipalities with similar gaps  

---

## Slide 23 — Conclusion

1. Globally, urban growth raises the cost of planning without hazard visualization  
2. The Philippines has rich agency data — LGUs still need local tools  
3. Lasam faces multi-hazard urban planning pressure with fragmented current practice  
4. **No existing interactive Lasam system** filled this gap for day-to-day MPDC meetings  
5. This prototype delivers a focused, disclaimer-aware, map-first solution — with a clear path for future simulation  

---

## Slide 24 — Closing / Q&A

**Thank you**

Lasam Urban Hazard Planning Prototype  
*For demonstration and planning dialogue — not an official hazard certificate*

Questions?

- Contact: _______________________________  
- Live demo: `npm run dev` → local browser  

---

# Appendix (optional backup slides)

## A1 — User story (one line)

As MPDC staff, I want to show flood and fault context for a proposed building location so the LGU can discuss siting before approval.

## A2 — Demo script (3 minutes)

1. Open whole Lasam → Layers / Flood toggle  
2. Fault tab → show PHIVOLCS lines  
3. Site Assessment → place pin → Assess → PDF export with signature line  

## A3 — Key references (fill with citation style you use)

- DENR–MGB Detailed Flood Susceptibility (geospatial service / controlmap.mgb.gov.ph)  
- PHIVOLCS Fault Finder / GeoRisk ULAP fault products  
- PSA administrative boundaries (PSGC)  
- Local CLUP / risk-informed planning practices (cite LGU documents as applicable)  

---

*File prepared for slide tools. Adjust institution branding, add screenshots of the running app on Slides 15–16, and insert a municipality locator map on Slides 6–7.*
