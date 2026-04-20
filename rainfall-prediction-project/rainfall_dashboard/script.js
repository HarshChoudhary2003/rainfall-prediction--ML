// AQUILA PRO - Predictive Neural Engine Core
const CONFIG = {
    COEFFS: {
        temp: -0.004,
        dewpoint: 0.012,
        humidity: 0.0075,
        pressure: 0.008,
        visibility: -0.015,
        wind: 0.004
    },
    BASE_VAL: 0.15,
    REGIONS: {
        central: 1.0,
        coast: 1.45,
        arid: 0.55
    }
};

let currentRegion = 'central';
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupUI();
    initCharts();
    generateForecast();
    setupEventListeners();
    
    // Intro Animation
    gsap.from('.container', { opacity: 0, duration: 1.2, ease: 'expo.out' });
}

function setupUI() {
    // Hide overlay initially
    gsap.set('.overlay', { display: 'none', opacity: 0 });
}

function setupEventListeners() {
    // Form Submission
    document.getElementById('prediction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        executeNeuralAnalysis();
    });

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        sidebar.classList.add('active');
    });
    document.getElementById('close-sidebar').addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Region cards
    document.querySelectorAll('.region-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.region-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentRegion = card.dataset.region;
            triggerHapticFeedBack();
        });
    });

    // Export Button
    document.getElementById('export-btn').addEventListener('click', runExportSimulation);
}

function executeNeuralAnalysis() {
    const data = getFormData();
    let prediction = calculateBasePrediction(data);
    
    // Apply Region Multiplier
    prediction *= CONFIG.REGIONS[currentRegion];
    
    // Random neural noise (simulated complexity)
    prediction += (Math.random() * 0.05);

    const finalVal = Math.max(0, prediction).toFixed(2);
    displayFinalResult(finalVal, data);
}

function getFormData() {
    return {
        temp: parseFloat(document.getElementById('temp').value),
        dewpoint: parseFloat(document.getElementById('dewpoint').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        pressure: parseFloat(document.getElementById('pressure').value),
        visibility: parseFloat(document.getElementById('visibility').value),
        wind: parseFloat(document.getElementById('wind').value)
    };
}

function calculateBasePrediction(d) {
    return CONFIG.BASE_VAL + 
           (d.temp * CONFIG.COEFFS.temp) + 
           (d.dewpoint * CONFIG.COEFFS.dewpoint) + 
           (d.humidity * CONFIG.COEFFS.humidity) + 
           (d.pressure * CONFIG.COEFFS.pressure) + 
           (d.visibility * CONFIG.COEFFS.visibility) + 
           (d.wind * CONFIG.COEFFS.wind);
}

function displayFinalResult(val, d) {
    const container = document.getElementById('result-container');
    const valEl = document.getElementById('precip-value');
    const insightEl = document.getElementById('ai-insight');

    valEl.innerText = val;

    // Advanced Logic for AI feedback
    let insight = "";
    if (val > 0.6) {
        insight = `CRITICAL: ${currentRegion.toUpperCase()} zone saturated. Vapor density @ ${d.humidity}% requires active drainage planning. High probability of flash localized runoff.`;
    } else if (val > 0.2) {
        insight = `ADVISORY: Intermittent moisture detected. ${currentRegion.toUpperCase()} profile shows 40-50% saturation. Scattered events likely within 12-hour window.`;
    } else {
        insight = `NOMINAL: Stable atmospheric pressure verified. Evaporation rates exceed moisture influx. Clear visibility maintaining for ${currentRegion.toUpperCase()} Sector.`;
    }
    
    insightEl.innerText = insight;

    // Show with GSAP
    gsap.set(container, { display: 'block' });
    gsap.to(container, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', startAt: { y: 15 } });
    
    // Update stability value based on rain
    const stabVal = document.getElementById('stability-val');
    if(val > 0.5) {
        stabVal.innerText = "WARNING";
        stabVal.style.color = "#ff007a";
    } else {
        stabVal.innerText = "OPTIMAL";
        stabVal.style.color = "#00ffaa";
    }
}

function generateForecast() {
    const wrapper = document.getElementById('forecast-wrapper');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const startIdx = new Date().getDay() - 1;

    for (let i = 0; i < 5; i++) {
        const day = days[(startIdx + i) % 7];
        const val = (Math.random() * 0.4).toFixed(2);
        const prob = Math.floor(Math.random() * 60 + 10);
        
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="f-day">${day}</div>
            <div class="f-val">${val}"</div>
            <div class="f-prob">${prob}% PROB</div>
        `;
        wrapper.appendChild(item);
    }
}

function runExportSimulation() {
    const overlay = document.getElementById('loader-overlay');
    gsap.set(overlay, { display: 'flex' });
    gsap.to(overlay, { opacity: 1, duration: 0.3 });

    setTimeout(() => {
        gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => {
            gsap.set(overlay, { display: 'none' });
            alert("DATASHEET GENERATED: aquila_pro_report.json has been archived to system cache.");
        }});
    }, 2000);
}

function triggerHapticFeedBack() {
    // Visual flash on stats grid to simulate recalculation
    gsap.to('.stat-value', { opacity: 0.5, duration: 0.1, yoyo: true, repeat: 1 });
}

function initCharts() {
    const themeColor = '#00f2ff';
    
    // Main Trend Chart
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    charts.precip = new Chart(precipCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'now'],
            datasets: [{
                label: 'Simulated Influx',
                data: [0.05, 0.12, 0.08, 0.24, 0.15, 0.42, 0.1],
                borderColor: themeColor,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.05)'
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
            }
        }
    });

    // Radar Weight Chart
    const accCtx = document.getElementById('accuracyChart').getContext('2d');
    charts.radar = new Chart(accCtx, {
        type: 'radar',
        data: {
            labels: ['T', 'H', 'W', 'P', 'D', 'V'],
            datasets: [{
                data: [40, 95, 30, 70, 85, 20],
                backgroundColor: 'rgba(255, 0, 122, 0.1)',
                borderColor: '#ff007a',
                borderWidth: 1,
                pointRadius: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    angleLines: { color: 'rgba(255,255,255,0.05)' },
                    pointLabels: { color: '#64748b', font: { size: 9 } },
                    ticks: { display: false }
                }
            }
        }
    });
}
