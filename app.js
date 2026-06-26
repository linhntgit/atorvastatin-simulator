document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const btnFull = document.getElementById('btn-full');
    const btnHalf = document.getElementById('btn-half');
    
    // Inputs
    const doseSelect = document.getElementById('dose-select');
    const inputVd = document.getElementById('input-vd');
    const inputThalf = document.getElementById('input-thalf');
    const inputEh = document.getElementById('input-eh');
    const inputVmax = document.getElementById('input-vmax');
    const inputKm = document.getElementById('input-km');
    const inputKtransit = document.getElementById('input-ktransit');
    const inputSaRatio = document.getElementById('input-sa-ratio');
    const allInputs = [doseSelect, inputVd, inputThalf, inputEh, inputVmax, inputKm, inputKtransit, inputSaRatio];

    // SVG Elements
    const fullGroup = document.getElementById('full-tablet-group');
    const halfLeft = document.getElementById('half-tablet-left');
    const halfRight = document.getElementById('half-tablet-right');
    
    // Stats Elements
    const saIndicator = document.getElementById('sa-indicator');
    const dissIndicator = document.getElementById('diss-indicator');
    const fValue = document.getElementById('f-value');
    const cmaxValue = document.getElementById('cmax-value');
    const tmaxValue = document.getElementById('tmax-value');
    const aucValue = document.getElementById('auc-value');

    // Chart instances
    let dissChart, pkChart;

    // Data arrays
    const time_diss = Array.from({length: 61}, (_, i) => i); // 0 to 60 mins
    const time_pk = Array.from({length: 49}, (_, i) => i * 0.5); // 0 to 24 hrs
    
    let diss_full_data = [], diss_broken_data = [];
    let pk_full_data = [], pk_broken_data = [];
    let stats_full = {}, stats_broken = {};

    // Helper to calculate analytical dissolution
    function calculateDissolution(t_min, kd_min) {
        return 100 * (1 - Math.exp(-kd_min * t_min));
    }

    // Numerical integration for absorption and first-pass metabolism
    function simulatePK(dose, kd_hr, Vd, ke, E_H, Vmax, Km, k_transit) {
        let dt = 0.02; // fine time step in hours
        let steps = 24 / dt;
        let data = [];
        
        let A_solid = dose;
        let A_diss = 0;
        let A_plasma = 0;
        
        let total_systemic_absorbed = 0;
        let AUC = 0; // in ng*hr/mL
        
        // We need to sample every 0.5 hours for the chart (every 25 steps if dt=0.02)
        const sampleRate = Math.round(0.5 / dt);
        
        for (let i = 0; i <= steps; i++) {
            // Save point for chart in ng/mL
            let conc_ng_ml = (A_plasma / Vd) * 1000;
            if (i % sampleRate === 0) {
                data.push(conc_ng_ml);
            }
            
            // Differential equations
            let d_solid = -kd_hr * A_solid;
            
            // Transporter-mediated uptake from GI
            let v_uptake = (Vmax * A_diss) / (Km + A_diss);
            
            // Drug leaving GI tract (dissolution minus uptake minus transit waste)
            let d_diss = kd_hr * A_solid - v_uptake - k_transit * A_diss;
            
            // Drug entering plasma (surviving first-pass E_H) minus elimination
            let entering_systemic = v_uptake * (1 - E_H);
            let d_plasma = entering_systemic - ke * A_plasma;
            
            // Euler update
            A_solid += d_solid * dt;
            if (A_solid < 0) A_solid = 0;
            
            A_diss += d_diss * dt;
            if (A_diss < 0) A_diss = 0; 
            
            A_plasma += d_plasma * dt;
            if (A_plasma < 0) A_plasma = 0;
            
            // Accumulate stats
            total_systemic_absorbed += entering_systemic * dt;
            AUC += conc_ng_ml * dt;
        }
        
        return {
            profile: data,
            auc: AUC,
            f: (total_systemic_absorbed / dose) * 100
        };
    }

    function recalculateData() {
        // Read Parameters
        const D = parseInt(doseSelect.value) || 40;
        const Vd = parseFloat(inputVd.value) || 381;
        const t_half = parseFloat(inputThalf.value) || 7.0;
        const E_H = parseFloat(inputEh.value) || 0.84;
        const Vmax = parseFloat(inputVmax.value) || 15;
        const Km = parseFloat(inputKm.value) || 10;
        const k_transit = parseFloat(inputKtransit.value) || 0.6;
        
        const ke = Math.LN2 / t_half;
        
        // Dissolution rates (Atorvastatin dissolves slightly slower than metformin in this sim)
        const kd_full_hr = 1.0;
        const kd_full_min = kd_full_hr / 60;
        
        // Surface Area increase when broken
        const sa_ratio = parseFloat(inputSaRatio.value) || 1.32;
        const kd_broken_hr = kd_full_hr * sa_ratio;
        const kd_broken_min = kd_broken_hr / 60;

        // Generate Dissolution Arrays (scale up for visual 60 min representation)
        diss_full_data = time_diss.map(t => calculateDissolution(t, kd_full_min * 4)); 
        diss_broken_data = time_diss.map(t => calculateDissolution(t, kd_broken_min * 4));

        // Generate PK Arrays via Simulation
        const simFull = simulatePK(D, kd_full_hr, Vd, ke, E_H, Vmax, Km, k_transit);
        const simBroken = simulatePK(D, kd_broken_hr, Vd, ke, E_H, Vmax, Km, k_transit);

        pk_full_data = simFull.profile;
        pk_broken_data = simBroken.profile;
        
        stats_full = { auc: simFull.auc, f: simFull.f };
        stats_broken = { auc: simBroken.auc, f: simBroken.f };
    }

    function initCharts() {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';

        // Dissolution Chart
        const ctxDiss = document.getElementById('dissolutionChart').getContext('2d');
        dissChart = new Chart(ctxDiss, {
            type: 'line',
            data: {
                labels: time_diss,
                datasets: [
                    {
                        label: 'Full Tablet',
                        data: diss_full_data,
                        borderColor: '#94a3b8',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Broken in Half',
                        data: diss_broken_data,
                        borderColor: '#10b981', // Emerald
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: { title: { display: true, text: 'Time (minutes)' } },
                    y: { title: { display: true, text: '% Dissolved' }, min: 0, max: 100 }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });

        // PK Chart
        const ctxPK = document.getElementById('pkChart').getContext('2d');
        pkChart = new Chart(ctxPK, {
            type: 'line',
            data: {
                labels: time_pk,
                datasets: [
                    {
                        label: 'Full Tablet',
                        data: pk_full_data,
                        borderColor: '#94a3b8',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Broken in Half',
                        data: pk_broken_data,
                        borderColor: '#0d9488', // Teal
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: { title: { display: true, text: 'Time (hours)' } },
                    y: { title: { display: true, text: 'Plasma Concentration (ng/mL)' }, min: 0 }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ng/mL` } }
                }
            }
        });
    }

    function updateState() {
        const isBroken = btnHalf.classList.contains('active');
        
        if (isBroken) {
            // Visuals
            fullGroup.classList.add('hidden');
            halfLeft.classList.remove('hidden');
            halfRight.classList.remove('hidden');
            setTimeout(() => { halfLeft.classList.add('active'); halfRight.classList.add('active'); }, 50);

            const sa_ratio = parseFloat(inputSaRatio.value) || 1.32;
            
            // Stats UI
            saIndicator.textContent = sa_ratio.toFixed(2) + 'x';
            dissIndicator.textContent = `Faster (+${Math.round((sa_ratio - 1) * 100)}%)`;
            
            // Find max for broken
            let cmax = 0, tmax = 0;
            pk_broken_data.forEach((val, i) => { if(val > cmax) { cmax = val; tmax = time_pk[i]; } });
            
            cmaxValue.textContent = `${cmax.toFixed(2)} ng/mL`;
            tmaxValue.textContent = `${tmax.toFixed(2)} hr`;
            aucValue.textContent = `${stats_broken.auc.toFixed(2)} ng·hr/mL`;
            fValue.textContent = `${stats_broken.f.toFixed(1)}%`;
            
            // Highlights
            fValue.style.color = 'var(--secondary)';
            cmaxValue.style.color = 'var(--secondary)';
            tmaxValue.style.color = 'var(--secondary)';

            // Update Charts
            dissChart.data.datasets[1].hidden = false;
            dissChart.data.datasets[0].borderColor = '#cbd5e1';
            pkChart.data.datasets[1].hidden = false;
            pkChart.data.datasets[0].borderColor = '#cbd5e1';
        } else {
            // Visuals
            halfLeft.classList.remove('active');
            halfRight.classList.remove('active');
            setTimeout(() => { halfLeft.classList.add('hidden'); halfRight.classList.add('hidden'); fullGroup.classList.remove('hidden'); }, 400);

            // Stats UI
            saIndicator.textContent = '1.00x';
            dissIndicator.textContent = 'Standard';
            
            // Find max for full
            let cmax = 0, tmax = 0;
            pk_full_data.forEach((val, i) => { if(val > cmax) { cmax = val; tmax = time_pk[i]; } });
            
            cmaxValue.textContent = `${cmax.toFixed(2)} ng/mL`;
            tmaxValue.textContent = `${tmax.toFixed(2)} hr`;
            aucValue.textContent = `${stats_full.auc.toFixed(2)} ng·hr/mL`;
            fValue.textContent = `${stats_full.f.toFixed(1)}%`;

            // Reset Highlights
            fValue.style.color = 'inherit';
            cmaxValue.style.color = 'inherit';
            tmaxValue.style.color = 'inherit';

            // Update Charts
            dissChart.data.datasets[1].hidden = true;
            dissChart.data.datasets[0].borderColor = '#94a3b8';
            pkChart.data.datasets[1].hidden = true;
            pkChart.data.datasets[0].borderColor = '#94a3b8';
        }
        
        dissChart.update();
        pkChart.update();
    }

    // Input Listeners
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            recalculateData();
            
            // Soft update charts data
            dissChart.data.datasets[0].data = diss_full_data;
            dissChart.data.datasets[1].data = diss_broken_data;
            pkChart.data.datasets[0].data = pk_full_data;
            pkChart.data.datasets[1].data = pk_broken_data;
            
            updateState();
        });
    });

    btnFull.addEventListener('click', () => {
        btnFull.classList.add('active');
        btnHalf.classList.remove('active');
        updateState();
    });
    
    btnHalf.addEventListener('click', () => {
        btnFull.classList.remove('active');
        btnHalf.classList.add('active');
        updateState();
    });

    // Bootstrap
    recalculateData();
    initCharts();
    updateState();
});
