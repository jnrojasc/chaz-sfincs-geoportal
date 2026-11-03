/**
 * main.js
 * Orquestador principal del Geoportal CHAZ-SFINCS Santo Domingo
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando Geoportal CHAZ-SFINCS Santo Domingo...');

    const fetcher = new DataFetcher('data/');
    const map = new GeoportalMap('map', [18.460, -69.825], 11);
    const metrics = new GeoportalMetrics();
    const pipeline = new PipelineExplainer();

    // 1. Cargar datos (soporta data-bundle.js síncrono y fetch asíncrono)
    try {
        const [
            manifest,
            tracks,
            stations,
            infr,
            scenariosSummary,
            demComparison,
            convergence
        ] = await Promise.all([
            fetcher.getRasterManifest(),
            fetcher.getCycloneTracks(),
            fetcher.getStations(),
            fetcher.getInfrastructure(),
            fetcher.getScenariosSummary(),
            fetcher.getDemComparison(),
            fetcher.getConvergenceMetrics()
        ]);

        // 2. Conectar datos con el mapa
        if (manifest) map.setManifest(manifest);
        if (tracks) map.setTracksData(tracks);
        if (stations) map.setStationsData(stations);
        if (infr) map.setInfrastructureData(infr);

        // 3. Conectar datos con las métricas y gráficos
        if (scenariosSummary && demComparison && convergence) {
            metrics.init(scenariosSummary, demComparison, convergence);
        }

    } catch (err) {
        console.error('Error al inicializar datos del geoportal:', err);
    }

    // 4. Listeners para botones de selección de ciclón
    const cycloneBtns = document.querySelectorAll('.quick-cyclone-btn');
    cycloneBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cycloneBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const eventId = btn.getAttribute('data-event');
            map.setEvent(eventId);
            metrics.setEventAndScenario(eventId, map.currentScenario);
        });
    });

    // 5. Listeners para botones de selección de escenario
    const scenarioBtns = document.querySelectorAll('.scenario-btn');
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const scenarioId = btn.getAttribute('data-scenario');
            map.setScenario(scenarioId);
            metrics.setEventAndScenario(map.currentEvent, scenarioId);

            // Si es convergencia de malla, cambiar automáticamente a la pestaña de malla
            if (scenarioId === 'convergencia_david') {
                switchTab('tab-mesh');
            }
        });
    });

    // 6. Listeners para checkboxes de capas en el banner
    const toggleFlood = document.getElementById('toggle-layer-flood');
    const toggleTrack = document.getElementById('toggle-layer-track');
    const toggleStations = document.getElementById('toggle-layer-stations');
    const toggleInfr = document.getElementById('toggle-layer-infr');

    if (toggleFlood) {
        toggleFlood.addEventListener('change', (e) => map.toggleLayer('flood', e.target.checked));
    }
    if (toggleTrack) {
        toggleTrack.addEventListener('change', (e) => map.toggleLayer('track', e.target.checked));
    }
    if (toggleStations) {
        toggleStations.addEventListener('change', (e) => map.toggleLayer('stations', e.target.checked));
    }
    if (toggleInfr) {
        toggleInfr.addEventListener('change', (e) => map.toggleLayer('infr', e.target.checked));
    }

    // 7. Navegación por pestañas del sidebar
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(targetTabId) {
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === targetTabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === targetTabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Forzar redibujo de Chart.js al cambiar de pestaña
        metrics.onTabSwitch(targetTabId);

        if (map && map.map) {
            map.map.invalidateSize();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 8. Toggle para dispositivos móviles
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            const isHidden = (sidebar.style.display === 'none' || sidebar.style.display === '');
            sidebar.style.display = isHidden ? 'flex' : 'none';
            if (map && map.map) {
                setTimeout(() => map.map.invalidateSize(), 100);
            }
        });
    }

    console.log('Geoportal CHAZ-SFINCS cargado con éxito.');
});
