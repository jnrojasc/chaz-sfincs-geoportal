/**
 * map.js
 * Controlador cartográfico con Leaflet.js para el Geoportal CHAZ-SFINCS Santo Domingo
 */

class GeoportalMap {
    constructor(containerId = 'map', center = [18.455, -69.850], zoom = 12) {
        this.containerId = containerId;
        this.center = center;
        this.zoom = zoom;
        this.map = null;
        
        // Estado activo
        this.currentEvent = 'HIST_1979_David';
        this.currentScenario = 'marea_swanN';
        
        // Grupos de capas
        this.rasterGroup = null;
        this.trackGroup = null;
        this.stationGroup = null;
        this.infrGroup = null;
        
        // Datos cacheados
        this.manifest = null;
        this.tracksData = null;
        this.stationsData = null;
        this.infrData = null;
        
        this.activeImageOverlay = null;
        
        this.init();
    }

    init() {
        this.map = L.map(this.containerId, {
            center: this.center,
            zoom: this.zoom,
            minZoom: 9,
            maxZoom: 18,
            zoomControl: true
        });

        // Mapas base
        const esriSat = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
                maxZoom: 19
            }
        );

        const cartoDark = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; CartoDB &copy; OpenStreetMap',
                maxZoom: 19,
                subdomains: 'abcd'
            }
        );

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });

        esriSat.addTo(this.map);

        const baseMaps = {
            "Esri Satélite": esriSat,
            "CartoDB Oscuro": cartoDark,
            "OpenStreetMap": osm
        };

        // Grupos de capas
        this.rasterGroup = L.layerGroup().addTo(this.map);
        this.infrGroup = L.layerGroup().addTo(this.map);
        this.trackGroup = L.layerGroup().addTo(this.map);
        this.stationGroup = L.layerGroup().addTo(this.map);

        L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(this.map);

        this.renderLegend();
    }

    setManifest(manifest) {
        this.manifest = manifest;
        this.updateRaster();
    }

    setTracksData(geojson) {
        this.tracksData = geojson;
        this.renderTracks();
    }

    setStationsData(geojson) {
        this.stationsData = geojson;
        this.renderStations();
    }

    setInfrastructureData(geojson) {
        this.infrData = geojson;
        this.renderInfrastructure();
    }

    setEvent(eventId) {
        this.currentEvent = eventId;
        this.updateRaster();
        this.renderTracks();
        this.updateBanner();
    }

    setScenario(scenarioId) {
        this.currentScenario = scenarioId;
        this.updateRaster();
        this.updateBanner();
        this.renderLegend();
    }

    updateRaster() {
        if (!this.manifest) return;

        this.rasterGroup.clearLayers();
        this.activeImageOverlay = null;

        let rasterInfo = null;

        if (this.currentScenario === 'convergencia_david') {
            rasterInfo = this.manifest['convergencia_david'];
        } else if (this.manifest[this.currentEvent]) {
            rasterInfo = this.manifest[this.currentEvent][this.currentScenario];
        }

        if (rasterInfo && rasterInfo.file && rasterInfo.bounds) {
            this.activeImageOverlay = L.imageOverlay(
                rasterInfo.file,
                rasterInfo.bounds,
                { opacity: 0.92, interactive: false }
            );
            this.rasterGroup.addLayer(this.activeImageOverlay);
        }
    }

    renderTracks() {
        if (!this.tracksData) return;
        this.trackGroup.clearLayers();

        const curEv = this.currentEvent;

        // Filtrar features del evento activo
        const eventFeatures = this.tracksData.features.filter(
            f => f.properties && f.properties.event_id === curEv
        );

        eventFeatures.forEach(feat => {
            if (feat.geometry.type === 'LineString') {
                const line = L.geoJSON(feat, {
                    style: {
                        color: '#FFB81C',
                        weight: 3.5,
                        opacity: 0.85,
                        dashArray: '6, 6'
                    }
                });
                this.trackGroup.addLayer(line);
            } else if (feat.geometry.type === 'Point') {
                const props = feat.properties;
                const coords = feat.geometry.coordinates;
                const latLng = [coords[1], coords[0]];

                let color = '#38BDF8';
                let radius = 5;
                if (props.vmax_kt >= 137) { color = '#991B1B'; radius = 8; }
                else if (props.vmax_kt >= 113) { color = '#EF4444'; radius = 7; }
                else if (props.vmax_kt >= 96) { color = '#F97316'; radius = 6; }
                else if (props.vmax_kt >= 64) { color = '#EAB308'; radius = 5; }

                const circle = L.circleMarker(latLng, {
                    radius: radius,
                    fillColor: color,
                    color: '#FFFFFF',
                    weight: 1.5,
                    opacity: 1,
                    fillOpacity: 0.95
                });

                circle.bindPopup(`
                    <div style="font-family: inherit;">
                        <h4 style="margin:0 0 4px; color:#38BDF8;">${props.name}</h4>
                        <div><strong>Tiempo (UTC):</strong> ${props.time_utc}</div>
                        <div><strong>Viento Máx:</strong> ${props.vmax_kt} kt (${Math.round(props.vmax_kt * 1.852)} km/h)</div>
                        <div><strong>Categoría:</strong> <span style="color:${color}; font-weight:bold;">${props.category}</span></div>
                    </div>
                `);

                this.trackGroup.addLayer(circle);
            }
        });
    }

    renderStations() {
        if (!this.stationsData) return;
        this.stationGroup.clearLayers();

        this.stationsData.features.forEach(feat => {
            const props = feat.properties;
            const coords = feat.geometry.coordinates;
            const latLng = [coords[1], coords[0]];

            const isTideGauge = props.id === 'sdom_boca_chica';
            const markerColor = isTideGauge ? '#FFB81C' : '#00A3E0';
            const radius = isTideGauge ? 9 : 6;

            const marker = L.circleMarker(latLng, {
                radius: radius,
                fillColor: markerColor,
                color: '#FFFFFF',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            marker.bindPopup(`
                <div style="font-family: inherit;">
                    <h4 style="margin:0 0 4px; color:#00A3E0;">${props.name}</h4>
                    <div style="font-size:0.75rem; color:#94A3B8; margin-bottom:4px;">${props.type} &bull; ${props.operator}</div>
                    <div style="font-size:0.72rem; line-height:1.35; margin-bottom:6px;">${props.desc}</div>
                    <div style="font-size:0.70rem; color:#CBD5E1;">
                        <strong>Sensor:</strong> ${props.sensor}<br>
                        <strong>Coord:</strong> ${props.lat.toFixed(4)}°N, ${Math.abs(props.lon).toFixed(4)}°W
                    </div>
                </div>
            `);

            this.stationGroup.addLayer(marker);
        });
    }

    renderInfrastructure() {
        if (!this.infrData) return;
        this.infrGroup.clearLayers();

        this.infrData.features.forEach(feat => {
            const props = feat.properties;

            const layer = L.geoJSON(feat, {
                style: {
                    color: '#F59E0B',
                    weight: 2.5,
                    opacity: 0.9,
                    fillColor: '#F59E0B',
                    fillOpacity: 0.25
                }
            });

            layer.bindPopup(`
                <div style="font-family: inherit;">
                    <h4 style="margin:0 0 4px; color:#FFB81C;">${props.name}</h4>
                    <div style="font-size:0.75rem; color:#38BDF8; font-weight:600; margin-bottom:4px;">${props.category}</div>
                    <div style="font-size:0.72rem; line-height:1.35;">${props.description}</div>
                </div>
            `);

            this.infrGroup.addLayer(layer);
        });
    }

    toggleLayer(layerName, isVisible) {
        if (layerName === 'flood') {
            if (isVisible) this.map.addLayer(this.rasterGroup);
            else this.map.removeLayer(this.rasterGroup);
        } else if (layerName === 'track') {
            if (isVisible) this.map.addLayer(this.trackGroup);
            else this.map.removeLayer(this.trackGroup);
        } else if (layerName === 'stations') {
            if (isVisible) this.map.addLayer(this.stationGroup);
            else this.map.removeLayer(this.stationGroup);
        } else if (layerName === 'infr') {
            if (isVisible) this.map.addLayer(this.infrGroup);
            else this.map.removeLayer(this.infrGroup);
        }
    }

    updateBanner() {
        const titleEl = document.getElementById('banner-title');
        const descEl = document.getElementById('banner-desc');
        if (!titleEl || !descEl) return;

        let evName = this.currentEvent.replace('HIST_', 'Huracán ').replace('ERA5_2017_', '').replace(/_/g, ' ');
        if (this.currentEvent === 'HIST_1979_David') evName = 'Huracán David (1979) - Cat 5';
        if (this.currentEvent === 'HIST_1998_Georges') evName = 'Huracán Georges (1998) - Cat 3';

        let scName = 'Surge + SWAN Anidado (γ=0.06)';
        let desc = 'Profundidad de inundación en tierra (hmax) combinando marea astronómica (EOT20), barometría y oleaje acoplado.';

        if (this.currentScenario === 'tormenta') {
            scName = 'Solo Surge (Sin Olas)';
            desc = 'Sobreelevación barotrópica pura por baja presión y arrastre de viento en SFINCS, excluyendo oleaje rompiente.';
        } else if (this.currentScenario === 'marea_swanN_alto') {
            scName = 'Surge + SWAN Alto (γ=0.10)';
            desc = 'Escenario de wave setup superior representativo de rompientes en frentes arrecifales con pendiente reflectiva.';
        } else if (this.currentScenario === 'delta_wave') {
            scName = 'Aporte Neto del Oleaje (SWAN - Surge)';
            desc = 'Sobreelevación incremental atribuible exclusivamente a las olas rompientes (Δh = h_swanN - h_surge).';
        } else if (this.currentScenario === 'convergencia_david') {
            titleEl.textContent = 'Auditoría de Malla: David 1979 (Malla 25 m vs Malla 50 m)';
            descEl.textContent = 'Diferencia de nivel máximo de agua (zsmax 25m - zsmax 50m). Azul: 50 m sobreestimaba; Rojo: 25 m capta canal fino.';
            return;
        }

        titleEl.textContent = `${evName} • ${scName}`;
        descEl.textContent = desc;
    }

    renderLegend() {
        const legendEl = document.getElementById('banner-legend');
        if (!legendEl) return;

        if (this.currentScenario === 'convergencia_david') {
            legendEl.innerHTML = `
                <div class="legend-item"><div class="legend-color-box" style="background:#1E40AF;"></div> 50m sobreestimaba (&lt; -0.20 m)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#38BDF8;"></div> 50m mayor (-0.20 a -0.05 m)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:transparent; border:1px dashed #64748B;"></div> Convergente (±0.05 m)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#F97316;"></div> 25m mayor (+0.05 a +0.20 m)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#E11D48;"></div> 25m canaliza (&gt; +0.20 m)</div>
            `;
        } else {
            legendEl.innerHTML = `
                <div class="legend-item"><div class="legend-color-box" style="background:#38BDF8;"></div> 0.05 - 0.50 m (Bajo)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#0284C7;"></div> 0.50 - 1.00 m (Medio)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#1E40AF;"></div> 1.00 - 2.00 m (Alto)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#E11D48;"></div> 2.00 - 3.00 m (Severo)</div>
                <div class="legend-item"><div class="legend-color-box" style="background:#7F1D1D;"></div> &gt; 3.00 m (Catastrófico)</div>
            `;
        }
    }
}
