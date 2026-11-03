/**
 * metrics.js
 * Gráficos reactivos con Chart.js y actualización de tarjetas de métricas para el Geoportal CHAZ-SFINCS
 */

class GeoportalMetrics {
    constructor() {
        this.scenariosData = null;
        this.demData = null;
        this.convData = null;
        
        this.currentEvent = 'HIST_1979_David';
        this.currentScenario = 'marea_swanN';
        
        this.chartFlood = null;
        this.chartDem = null;
        this.chartMesh = null;
    }

    init(scenariosData, demData, convData) {
        this.scenariosData = scenariosData;
        this.demData = demData;
        this.convData = convData;

        this.initFloodChart();
        this.initDemChart();
        this.initMeshChart();
        this.updateEventMetrics(this.currentEvent, this.currentScenario);
    }

    setEventAndScenario(eventId, scenarioId) {
        this.currentEvent = eventId;
        this.currentScenario = scenarioId;
        this.updateEventMetrics(eventId, scenarioId);
    }

    updateEventMetrics(eventId, scenarioId) {
        if (!this.scenariosData || !this.scenariosData[eventId]) return;

        const ev = this.scenariosData[eventId];
        const scMap = ev.scenarios || {};
        
        const curSc = scMap[scenarioId] || scMap['marea_swanN'] || {};
        const stormSc = scMap['tormenta'] || {};
        const swanSc = scMap['marea_swanN'] || {};

        // 1. Textos del evento
        const sideTitle = document.getElementById('side-event-name');
        const sideDesc = document.getElementById('side-event-desc');
        if (sideTitle) sideTitle.textContent = `${ev.name} (${ev.category})`;
        if (sideDesc) sideDesc.textContent = `Vmax: ${ev.vmax_kt} kt. Análisis hidrodinámico en el estuario del Ozama y la rada portuaria.`;

        // 2. Tarjetas de métricas
        const areaEl = document.getElementById('val-flood-area');
        const depthEl = document.getElementById('val-max-depth');
        const volEl = document.getElementById('val-volume');
        const gainEl = document.getElementById('val-wave-gain');

        if (areaEl) areaEl.textContent = `${(curSc.area_mojada_km2 || 0).toFixed(2)} km²`;
        if (depthEl) depthEl.textContent = `${(curSc.prof_max_m || 0).toFixed(2)} m`;
        if (volEl) volEl.textContent = `${(curSc.volumen_aprox_Mm3 || 0).toFixed(2)} Mm³`;

        if (gainEl && stormSc.area_mojada_km2 !== undefined && swanSc.area_mojada_km2 !== undefined) {
            if (stormSc.area_mojada_km2 > 0) {
                const pct = Math.round(((swanSc.area_mojada_km2 - stormSc.area_mojada_km2) / stormSc.area_mojada_km2) * 100);
                gainEl.textContent = `${pct >= 0 ? '+' : ''}${pct} %`;
            } else {
                gainEl.textContent = swanSc.area_mojada_km2 > 0 ? '+100 %' : '0 %';
            }
        }

        // 3. Tabla de escenarios
        const tbody = document.querySelector('#table-scenarios tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const scOrder = [
                { id: 'tormenta', label: 'Solo Surge (Sin Olas)' },
                { id: 'marea_swanN', label: '+ SWAN Anidado (γ=0.06)' },
                { id: 'marea_swanN_alto', label: '+ SWAN Alto (γ=0.10)' }
            ];

            scOrder.forEach(item => {
                const s = scMap[item.id] || {};
                const isSelected = item.id === scenarioId;
                const tr = document.createElement('tr');
                if (isSelected) tr.style.backgroundColor = 'rgba(0, 163, 224, 0.15)';
                tr.innerHTML = `
                    <td style="font-weight:${isSelected ? 'bold' : 'normal'}; color:${isSelected ? '#38BDF8' : 'inherit'};">
                        ${item.label}
                    </td>
                    <td>${(s.prof_max_m || 0).toFixed(2)} m</td>
                    <td style="font-weight:600;">${(s.area_mojada_km2 || 0).toFixed(2)} km²</td>
                    <td style="color:#94A3B8;">${(s.area_con_cauce_km2 || 0).toFixed(2)} km²</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // 4. Actualizar Chart de Inundación
        if (this.chartFlood) {
            const labels = ['Solo Surge', 'Surge + SWAN', 'Surge + SWAN Alto'];
            const areas = [
                (stormSc.area_mojada_km2 || 0),
                (swanSc.area_mojada_km2 || 0),
                (scMap['marea_swanN_alto'] ? scMap['marea_swanN_alto'].area_mojada_km2 : 0)
            ];

            this.chartFlood.data.labels = labels;
            this.chartFlood.data.datasets[0].data = areas;
            this.chartFlood.update();
        }
    }

    initFloodChart() {
        const ctx = document.getElementById('chart-flood-scenarios');
        if (!ctx) return;

        this.chartFlood = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Solo Surge', 'Surge + SWAN', 'Surge + SWAN Alto'],
                datasets: [{
                    label: 'Área Terrestre Inundada (km²)',
                    data: [0.71, 2.11, 3.33],
                    backgroundColor: [
                        'rgba(56, 189, 248, 0.75)',
                        'rgba(0, 163, 224, 0.85)',
                        'rgba(239, 68, 68, 0.85)'
                    ],
                    borderColor: [
                        '#38BDF8',
                        '#00A3E0',
                        '#EF4444'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Área inundada: ${context.parsed.y.toFixed(2)} km²`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    }
                }
            }
        });
    }

    initDemChart() {
        const ctx = document.getElementById('chart-dem-hypsometry');
        if (!ctx || !this.demData) return;

        const cotas = this.demData.cota_m.map(c => `< ${c} m`);

        this.chartDem = new Chart(ctx, {
            type: 'line',
            data: {
                labels: cotas,
                datasets: [
                    {
                        label: 'Copernicus DSM (GLO-30)',
                        data: this.demData.copernicus_km2,
                        borderColor: '#00A3E0',
                        backgroundColor: 'rgba(0, 163, 224, 0.15)',
                        fill: false,
                        tension: 0.25,
                        pointRadius: 4,
                        borderWidth: 2
                    },
                    {
                        label: 'FABDEM v1.2 (Bosques/Edif removidos)',
                        data: this.demData.fabdem_km2,
                        borderColor: '#FFB81C',
                        backgroundColor: 'rgba(255, 184, 28, 0.15)',
                        fill: false,
                        tension: 0.25,
                        pointRadius: 4,
                        borderWidth: 2
                    },
                    {
                        label: 'DeltaDTM v1.1 (Coastal Deltares)',
                        data: this.demData.deltadtm_km2,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        fill: false,
                        tension: 0.25,
                        pointRadius: 4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#E2E8F0', font: { size: 9 }, boxWidth: 12 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} km²`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Área Terrestre Expuesta (km²)', color: '#94A3B8', font: { size: 10 } },
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    }
                }
            }
        });
    }

    initMeshChart() {
        const ctx = document.getElementById('chart-mesh-diff');
        if (!ctx || !this.convData) return;

        this.chartMesh = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.convData.bins_labels,
                datasets: [{
                    label: '% de Celdas de Malla',
                    data: this.convData.bins_percentages,
                    backgroundColor: [
                        '#1E40AF',
                        '#0284C7',
                        '#38BDF8',
                        '#10B981', // Verde convergente
                        '#F97316',
                        '#EA580C',
                        '#E11D48'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(1)}% de celdas`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94A3B8', font: { size: 9 }, maxRotation: 30 },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    }
                }
            }
        });
    }
}
