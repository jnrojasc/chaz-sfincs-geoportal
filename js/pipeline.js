/**
 * pipeline.js
 * Lógica interactiva para la pestaña de la cadena metodológica CHAZ-SWAN-SFINCS
 */

class PipelineExplainer {
    constructor() {
        this.init();
    }

    init() {
        // Interactividad para resaltar tarjetas al hacer hover o click
        const steps = document.querySelectorAll('.pipeline-step-item');
        steps.forEach(step => {
            step.addEventListener('mouseenter', () => {
                step.style.backgroundColor = 'rgba(0, 163, 224, 0.08)';
            });
            step.addEventListener('mouseleave', () => {
                step.style.backgroundColor = 'var(--card-bg)';
            });
        });
    }
}
