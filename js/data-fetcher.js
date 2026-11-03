/**
 * data-fetcher.js
 * Carga híbrida y resiliente de datos GeoJSON y JSON para el Geoportal CHAZ-SFINCS
 * Soporta tanto ejecución en GitHub Pages / Servidor HTTP como apertura local (file://)
 */

class DataFetcher {
    constructor(basePath = 'data/') {
        this.basePath = basePath;
        this.cache = {};

        // Resolver URL base canónica
        let base = window.location.origin;
        if (!base || base === 'null') {
            // Entorno local file://
            this.baseUrl = '';
        } else {
            let path = window.location.pathname.replace(/\/index\.html$/, '');
            if (!path.endsWith('/')) path += '/';
            this.baseUrl = `${base}${path}`;
        }
    }

    async fetchJSON(filename) {
        // 1. Prioridad: Dataset pre-empaquetado en memoria (garantiza funcionamiento sin CORS ni retardos)
        if (window.CHAZ_GEODATA && window.CHAZ_GEODATA[filename]) {
            return window.CHAZ_GEODATA[filename];
        }

        if (this.cache[filename]) {
            return this.cache[filename];
        }

        // 2. Fetch HTTP/HTTPS con prevención de caché
        try {
            const sep = filename.includes('?') ? '&' : '?';
            const url = this.baseUrl ? `${this.baseUrl}data/${filename}${sep}v=1.0.2` : `data/${filename}${sep}v=1.0.2`;
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) {
                // Intento con ruta relativa simple
                const fallback = await fetch(`data/${filename}${sep}v=1.0.2`);
                if (!fallback.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await fallback.json();
                this.cache[filename] = data;
                return data;
            }
            const data = await resp.json();
            this.cache[filename] = data;
            return data;
        } catch (err) {
            console.warn(`Aviso de carga para ${filename}:`, err.message);
            if (window.CHAZ_GEODATA && window.CHAZ_GEODATA[filename]) {
                return window.CHAZ_GEODATA[filename];
            }
            return null;
        }
    }

    async getRasterManifest() {
        return await this.fetchJSON('raster_manifest.json');
    }

    async getCycloneTracks() {
        return await this.fetchJSON('cyclones_tracks.geojson');
    }

    async getStations() {
        return await this.fetchJSON('stations.geojson');
    }

    async getInfrastructure() {
        return await this.fetchJSON('infrastructure.geojson');
    }

    async getScenariosSummary() {
        return await this.fetchJSON('scenarios_summary.json');
    }

    async getDemComparison() {
        return await this.fetchJSON('dem_comparison.json');
    }

    async getConvergenceMetrics() {
        return await this.fetchJSON('convergence_david.json');
    }
}
