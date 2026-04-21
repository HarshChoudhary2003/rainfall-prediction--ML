// AQUILA PRO - Neural Animation Core
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
    setupUIAnimations();
    initCharts();
    generateForecast();
    setupEventListeners();
    setupMouseTracking();
}

function setupUIAnimations() {
    // Initial Staggered Entrance
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('header', { opacity: 1, y: 0, duration: 1, startAt: { y: -20 } })
      .from('.stat-card', { opacity: 0, y: 30, stagger: 0.1, duration: 0.8 }, '-=0.5')
      .from('.left-col .card', { opacity: 0, x: -50, duration: 1 }, '-=0.8')
      .from('.right-col .card', { opacity: 0, x: 50, duration: 1, stagger: 0.2 }, '-=1');

    // Count up stats
    animateValue('accuracy-val', 80, 94.2, 2000, '%');
    animateValue('latency-val', 40, 12, 1500, 'ms');
}

function animateValue(id, start, end, duration, suffix = '') {
    const obj = { val: start };
    const el = document.getElementById(id);
    if (!el) return;

    gsap.to(obj, {
        val: end,
        duration: duration / 1000,
        ease: 'power2.out',
        onUpdate: () => {
            el.innerText = obj.val.toFixed(id === 'latency-val' ? 0 : 1) + suffix;
        }
    });
}

function setupMouseTracking() {
    // Background parallax and glow following mouse
    window.addEventListener('mousemove', (e) => {
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / window.innerHeight) * 100;
        
        document.body.style.setProperty('--mouse-x', `${xPercent}%`);
        document.body.style.setProperty('--mouse-y', `${yPercent}%`);

        // Subtle parallax on cards
        gsap.to('.card', {
            rotationY: (xPercent - 50) * 0.02,
            rotationX: (yPercent - 50) * -0.02,
            duration: 0.5,
            ease: 'power1.out'
        });
    });
}

function setupEventListeners() {
    // Form Submission with "Neural Scanning"
    document.getElementById('prediction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        runNeuralScanSequence();
    });

    // Sidebar
    const sidebar = document.getElementById('sidebar');
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        gsap.to(sidebar, { right: 0, duration: 0.8, ease: 'expo.out' });
        sidebar.classList.add('active');
    });
    document.getElementById('close-sidebar').addEventListener('click', () => {
        gsap.to(sidebar, { right: -400, duration: 0.8, ease: 'expo.in' });
        sidebar.classList.remove('active');
    });

    // Region cards
    document.querySelectorAll('.region-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.region-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentRegion = card.dataset.region;
            
            gsap.from(card, { scale: 0.9, duration: 0.4, ease: 'back.out' });
        });
    });

    // Export Simulation
    document.getElementById('export-btn').addEventListener('click', () => {
        const overlay = document.getElementById('loader-overlay');
        const text = overlay.querySelector('p');
        
        gsap.set(overlay, { display: 'flex', opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.5 });
        
        const phases = ["INITIALIZING BUFFER...", "STAGING DATASET...", "COMPILING REPORT...", "ARCHIVING TO CLOUD..."];
        let i = 0;
        const interval = setInterval(() => {
            text.innerText = phases[i++];
            gsap.from(text, { opacity: 0, y: 10, duration: 0.3 });
            if(i === phases.length) {
                clearInterval(interval);
                setTimeout(() => {
                    gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => {
                        gsap.set(overlay, { display: 'none' });
                    }});
                }, 1000);
            }
        }, 800);
    });
}

async function runNeuralScanSequence() {
    const btn = document.getElementById('predict-btn');
    const originalText = btn.innerText;
    
    // Disable button and show scanning
    btn.disabled = true;
    btn.innerText = "SCANNING ATMOSPHERE...";
    
    // Simulate internal state changes
    animateValue('stability-val', 98, 82, 1000, '');
    
    await new Promise(r => setTimeout(r, 1200));
    
    executeNeuralAnalysis();
    
    btn.disabled = false;
    btn.innerText = originalText;
    animateValue('stability-val', 82, 98, 1000, '');
}

async function executeNeuralAnalysis() {
    const d = {
        temp: parseFloat(document.getElementById('temp').value),
        dewpoint: parseFloat(document.getElementById('dewpoint').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        pressure: parseFloat(document.getElementById('pressure').value),
        visibility: parseFloat(document.getElementById('visibility').value),
        wind: parseFloat(document.getElementById('wind').value),
        region: currentRegion
    };

    const container = document.getElementById('result-container');
    const valEl = document.getElementById('precip-value');
    const insightEl = document.getElementById('ai-insight');

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(d)
        });

        if (!response.ok) throw new Error('API Response Failed');
        
        const result = await response.json();
        const finalVal = result.prediction;

        // Smooth reveal
        gsap.set(container, { display: 'block' });
        gsap.fromTo(container, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' });
        
        // Animate large number
        const obj = { val: 0 };
        gsap.to(obj, {
            val: finalVal,
            duration: 1.5,
            ease: 'power3.out',
            onUpdate: () => {
                valEl.innerText = obj.val.toFixed(2);
            }
        });

        // Insight update
        insightEl.innerHTML = `<span class='scramble-text'>ANALYSIS COMPLETE:</span> Model v4.0.0 processed telemetry for ${currentRegion} region. Predicted liquid content: ${finalVal} inches.`;
    } catch (error) {
        console.error('Prediction Error:', error);
        insightEl.innerHTML = `<span style="color: #ff4d4d">ERROR:</span> Atmospheric telemetry link failed. Ensure backend is running.`;
        gsap.set(container, { display: 'block' });
        gsap.to(container, { opacity: 1, duration: 0.5 });
    }
}

function generateForecast() {
    const wrapper = document.getElementById('forecast-wrapper');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const startIdx = new Date().getDay() - 1;

    for (let i = 0; i < 6; i++) {
        const day = days[(startIdx + i) % 7];
        const val = (Math.random() * 0.5).toFixed(2);
        
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="f-day">${day}</div>
            <div class="f-val">${val}"</div>
            <div class="f-prob">${Math.floor(Math.random()*80)}%</div>
        `;
        wrapper.appendChild(item);
        
        gsap.from(item, { opacity: 0, scale: 0.8, duration: 0.5, delay: 1 + (i * 0.1) });
    }
}

function initCharts() {
    const themeColor = '#00f2ff';
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    
    new Chart(precipCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'NOW'],
            datasets: [{
                label: 'Simulated Feed',
                data: [5, 12, 8, 24, 15, 30, 10],
                borderColor: themeColor,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(0, 242, 255, 0)');
                    gradient.addColorStop(1, 'rgba(0, 242, 255, 0.15)');
                    return gradient;
                }
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });

    const accCtx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(accCtx, {
        type: 'radar',
        data: {
            labels: ['T', 'H', 'W', 'P', 'D', 'V'],
            datasets: [{
                data: [60, 90, 40, 75, 80, 30],
                backgroundColor: 'rgba(255, 0, 122, 0.15)',
                borderColor: '#ff007a',
                borderWidth: 2,
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
                    pointLabels: { color: '#64748b' },
                    ticks: { display: false }
                }
            }
        }
    });
}
