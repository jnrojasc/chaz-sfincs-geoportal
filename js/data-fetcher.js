/**
 * data-fetcher.js
 * Carga asíncrona de datos estáticos GeoJSON y JSON para el Geoportal CHAZ-SFINCS
 */

class DataFetcher {
    constructor(basePath = 'data/') {
        this.basePath = basePath;
        this.cache = {};
    }

    async fetchJSON(filename) {
        if (this.cache[filename]) {
            return this.cache[filename];
        }
        try {
            const resp = await fetch(`${this.basePath}${filename}?v=1.0.0`);
            if (!resp.ok) {
                throw new Error(`HTTP Error ${resp.status} al cargar ${filename}`);
            }
            const data = await resp.json();
            this.cache[filename] = data;
            return data;
        } catch (err) {
            console.error(`Error al cargar ${filename}:`, err);
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
