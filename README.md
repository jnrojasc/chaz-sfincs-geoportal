# CHAZ-SFINCS Santo Domingo — Coastal Flood Hazard Geoportal

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue.svg)](https://jnrojasc.github.io/chaz-sfincs-geoportal/)
[![Hydrodynamic Engine](https://img.shields.io/badge/Model-SFINCS%20v2.4.1%20Subgrid-success.svg)](https://sfincs.readthedocs.io/)
[![Wave Engine](https://img.shields.io/badge/Waves-SWAN%20Nested%20%2B%20Stockdon-005A9C.svg)](https://swanmodel.sourceforge.io/)
[![Synthetic Cyclones](https://img.shields.io/badge/Forcing-CHAZ%20Synthetic%20%2B%20IBTrACS-orange.svg)](https://chaz.readthedocs.io/)
[![Domain](https://img.shields.io/badge/Study%20Area-Greater%20Santo%20Domingo%20(RD)-red.svg)](#study-area)

Interactive web geoportal for high-resolution coastal and estuarine flood hazard visualization across Greater Santo Domingo, Dominican Republic. Demonstrates multi-scenario hydrodynamic modeling combining synthetic tropical cyclones (CHAZ 2017), historical hurricanes (David 1979, Georges 1998), regional/nested spectral wave modeling (SWAN), dynamic astronomical tides (EOT20), and subgrid physics (SFINCS).

🌐 **Live Geoportal:** [https://jnrojasc.github.io/chaz-sfincs-geoportal/](https://jnrojasc.github.io/chaz-sfincs-geoportal/)

---

## 🌊 System Architecture & Workflow

```
CHAZ Synthetic (ERA5) & Historical Tracks ──┐
                                            ├─► Spiderweb Winds (Holland Vortex) ─► SWAN Spectral Waves ──┐
Astronomical Tide (EOT20 Global Atlas) ─────┘                                                              │
                                                                                                           ▼
                                                SFINCS Local Subgrid Engine (25m/50m, Mac M4 Server) ◄─────┘
                                                                           │
                                                                           ▼
                                                Clipped Depth Rasters (hmax) & Mass-Balance QA
                                                                           │
                                                                           ▼
                                                GitHub Pages Client (Leaflet.js + Chart.js + GeoJSON)
```

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend UI** | HTML5, CSS3, Vanilla ES6 JavaScript | Zero-build, fast loading, zero backend maintenance |
| **Map Rendering Engine** | Leaflet.js v1.9.4 + Esri Satellite / CartoDB Dark | High-performance cartography, responsive raster overlays |
| **Data Visualization** | Chart.js | Reactive flood area, hypsometric curves, and mesh convergence metrics |
| **Hydrodynamic Processing** | SFINCS v2.4.1 + HydroMT (Mac M4 arm64) | 10-thread parallel subgrid modeling in Santo Domingo domain |
| **Hosting & CDN** | GitHub Pages (`jnrojasc.github.io`) | 100% free, automated HTTPS, zero credential exposure |

---

## 📁 Repository Structure

```
chaz-sfincs-geoportal/
├── index.html                   # Main web layout and responsive split interface
├── css/
│   └── styles.css               # Nautical scientific theme (#0B1E36, #00A3E0, #FFB81C)
├── js/
│   ├── main.js                  # Application controller and event bus
│   ├── map.js                   # Leaflet map manager, layer toggles, dynamic legends
│   ├── data-fetcher.js          # Asynchronous static data and GeoJSON loader
│   ├── metrics.js               # Chart.js charts and reactive sidebar metrics
│   └── pipeline.js              # Multi-tier physical pipeline narrative
├── data/
│   ├── raster_manifest.json     # WGS84 bounding boxes and file catalog for all 24 flood rasters
│   ├── cyclones_tracks.geojson  # Hourly tracks and intensity points for the 8 evaluated cyclones
│   ├── stations.geojson         # Operational IOC/PRSN Boca Chica tide gauge (sdom) & virtual buoys
│   ├── infrastructure.geojson   # Critical port, energy, and urban barrier assets
│   ├── scenarios_summary.json   # 24 hydrodynamic simulation runs (hmax, wet area, wave gain)
│   ├── dem_comparison.json      # Hypsometric area under 0.5-10m for Copernicus, FABDEM, DeltaDTM
│   └── convergence_david.json   # Cell-by-cell difference distribution for 50m vs 25m mesh (WO-7)
├── assets/
│   ├── logo.png                 # Institutional brand logo
│   └── rasters/                 # 24 optimized RGBA PNG depth rasters + wave setup & mesh delta
└── README.md                    # Technical documentation and deployment guide
```

---

## 🚀 GitHub Pages Deployment

### 1. Initialize and Push to Remote
```bash
cd "chaz-sfincs-geoportal"

git add .
git commit -m "feat: complete CHAZ-SFINCS Santo Domingo coastal flood geoportal"
git push -u origin main
```

### 2. Enable GitHub Pages
1. Navigate to **Settings** → **Pages** in `https://github.com/jnrojasc/chaz-sfincs-geoportal/settings/pages`.
2. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
3. Click **Save**.
4. In ~1-2 minutes, the live portal is accessible at:
   ```
   https://jnrojasc.github.io/chaz-sfincs-geoportal/
   ```

---

## 🔬 Scientific Highlights & Key Insights

1. **Wave Setup Dominance:** Over coasts with steep bathymetry like Santo Domingo, breaking waves simulated by SWAN increase flooded terrestrial area by up to **+197%** (David 1979) compared to surge-only scenarios.
2. **Topographic Uncertainty:** The comparison between Copernicus DSM, FABDEM, and DeltaDTM shows vertical variations of $\pm 1.5$ m, shifting the land area below 3 m from 13.1 km² to 18.9 km². High-resolution bare-earth LiDAR is required for seawall and urban quay parametrization.
3. **Numerical Grid Convergence (WO-7):** Refining the spatial grid from 50 m to 25 m eliminates 13.0% of spurious lowland flooding while maintaining 84.1% of cells within $\pm 10$ cm of water surface elevation.

---

## 👤 Author & Academic Context

*   **Project Lead:** James Rojas ([GitHub: @jnrojasc](https://github.com/jnrojasc))
*   **Affiliation:** University of California, Santa Cruz (UCSC) / Universidad Autónoma de Santo Domingo (UASD)
*   **Course / Track:** GIST 250 - Advanced Coastal Remote Sensing & GIS
*   **Related Research:** Pilot CHAZ-SWAN-SFINCS for Hurricane Coastal Flooding in the Dominican Republic
