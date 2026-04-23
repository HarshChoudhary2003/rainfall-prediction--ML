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
let historyData = [];
let weatherEngine;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    startLiveClock();
    weatherEngine = new WeatherVisualizer();
});

function startLiveClock() {
    const clockEl = document.getElementById('live-clock');
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString([], { hour12: false });
    }, 1000);
}

function initApp() {
    setupUIAnimations();
    initCharts();
    generateForecast();
    setupEventListeners();
    setupMouseTracking();
    fetchHistory();
}

function setupUIAnimations() {
    // Initial Staggered Entrance
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.fromTo('header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1 })
      .from('.stat-card', { opacity: 0, y: 30, stagger: 0.1, duration: 0.8 }, '-=0.5')
      .from('.left-col .card', { opacity: 0, x: -50, duration: 1 }, '-=0.8')
      .from('.input-group', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6 }, '-=0.6')
      .from('.region-card', { opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.5 }, '-=0.4')
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

    // Export Simulation & Actual Download
    document.getElementById('export-btn').addEventListener('click', () => {
        const overlay = document.getElementById('loader-overlay');
        const text = overlay.querySelector('p');
        
        gsap.set(overlay, { display: 'flex', opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.5 });
        
        const phases = ["INITIALIZING BUFFER...", "STAGING DATASET...", "COMPILING REPORT...", "PREPARING DOWNLOAD..."];
        let i = 0;
        const interval = setInterval(() => {
            text.innerText = phases[i++];
            gsap.from(text, { opacity: 0, y: 10, duration: 0.3 });
            if(i === phases.length) {
                clearInterval(interval);
                setTimeout(() => {
                    gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => {
                        gsap.set(overlay, { display: 'none' });
                        downloadCSV();
                    }});
                }, 1000);
            }
        }, 800);
    });
}

function downloadCSV() {
    if (!historyData || historyData.length === 0) {
        alert("No historical data available to export.");
        return;
    }
    const headers = ["Time", "Region", "Temperature", "Prediction"];
    const rows = historyData.map(row => [row.time, row.region, row.temp, row.predict]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aquila_pro_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        // Update UI
        updateAdviceCard(finalVal);
        fetchHistory(); // Refresh history from backend
        weatherEngine.setWeatherType(finalVal); // Trigger animated visuals

        // Insight update
        insightEl.innerHTML = `<span class='scramble-text'>ANALYSIS COMPLETE:</span> Model v4.0.0 processed telemetry for ${currentRegion} region. Predicted liquid content: ${finalVal} inches.`;
    } catch (error) {
        console.error('Prediction Error:', error);
        insightEl.innerHTML = `<span style="color: #ff4d4d">ERROR:</span> Atmospheric telemetry link failed. Ensure backend is running.`;
        gsap.set(container, { display: 'block' });
        gsap.to(container, { opacity: 1, duration: 0.5 });
    }
}

function updateAdviceCard(val) {
    const icon = document.getElementById('advice-icon');
    const title = document.getElementById('advice-title');
    const text = document.getElementById('advice-text');
    
    if (val == 0) {
        icon.innerText = "☀️";
        title.innerText = "CLEAR SKIES EXPECTED";
        text.innerText = "Atmospheric stability is high. No immediate precipitation risk detected.";
    } else if (val < 0.1) {
        icon.innerText = "☁️";
        title.innerText = "LIGHT OVERCAST";
        text.innerText = "Minor moisture pockets detected. Trace amounts of precipitation possible.";
    } else if (val < 0.5) {
        icon.innerText = "🌦️";
        title.innerText = "SCATTERED SHOWERS";
        text.innerText = "Unstable air masses moving in. Recommended to carry atmospheric protection.";
    } else {
        icon.innerText = "⛈️";
        title.innerText = "HEAVY PRECIPITATION";
        text.innerText = "High liquid density detected. Significant rainfall events likely within target zone.";
    }
    
    gsap.from('#advice-card', { scale: 0.95, opacity: 0, duration: 0.5, ease: 'back.out' });
}

async function fetchHistory() {
    try {
        const res = await fetch('/api/history?limit=10');
        const data = await res.json();
        if (data.status === 'success') {
            historyData = data.history.map(item => {
                const dateObj = new Date(item.timestamp);
                return {
                    timestamp: item.timestamp,
                    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    region: item.region.toUpperCase(),
                    temp: item.temp,
                    predict: item.prediction
                };
            });
            renderHistory();
            
            // Update Telemetry Chart
            if (charts.precip) {
                const recent7 = historyData.slice(0, 7).reverse();
                const labels = recent7.map(item => item.time);
                const values = recent7.map(item => item.predict);
                
                while(labels.length < 7) {
                    labels.unshift('-');
                    values.unshift(0);
                }
                
                charts.precip.data.labels = labels;
                charts.precip.data.datasets[0].data = values;
                charts.precip.update();
            }
        }
    } catch (e) {
        console.error("Failed to fetch history:", e);
    }
}

function renderHistory() {
    const tbody = document.querySelector('#history-log tbody');
    if (!historyData || historyData.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No historical data available.</td></tr>`;
        return;
    }
    tbody.innerHTML = historyData.map(item => `
        <tr>
            <td>${item.time}</td>
            <td>${item.region}</td>
            <td>${item.temp}°F</td>
            <td>${item.predict}"</td>
        </tr>
    `).join('');
}

class WeatherVisualizer {
    constructor() {
        this.canvas = document.getElementById('weather-canvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.type = 'sunny';
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setWeatherType(precip) {
        this.type = precip > 0.1 ? 'rain' : 'sunny';
        this.particles = [];
        const count = this.type === 'rain' ? 150 : 40;
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            length: Math.random() * 20 + 10,
            speed: Math.random() * 10 + 5,
            opacity: Math.random() * 0.3,
            size: Math.random() * 2 + 1
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            if (this.type === 'rain') {
                this.ctx.strokeStyle = `rgba(0, 242, 255, ${p.opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x, p.y + p.length);
                this.ctx.stroke();
                p.y += p.speed;
                if (p.y > this.canvas.height) p.y = -p.length;
            } else {
                // Subtle solar dust for sunny days
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                p.y -= p.speed * 0.1;
                p.x += Math.sin(p.y * 0.01) * 0.5;
                if (p.y < 0) p.y = this.canvas.height;
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

async function generateForecast() {
    const wrapper = document.getElementById('forecast-wrapper');
    wrapper.innerHTML = '';
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const startIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    try {
        const res = await fetch('/api/forecast');
        const data = await res.json();
        if (data.status === 'success') {
            for (let i = 0; i < 6; i++) {
                const day = days[(startIdx + i) % 7];
                const val = data.forecast[i].value;
                const prob = data.forecast[i].probability;
                
                const item = document.createElement('div');
                item.className = 'forecast-item';
                item.innerHTML = `
                    <div class="f-day">${day}</div>
                    <div class="f-val">${val.toFixed(2)}"</div>
                    <div class="f-prob">${prob}%</div>
                `;
                wrapper.appendChild(item);
                
                gsap.from(item, { opacity: 0, scale: 0.8, duration: 0.5, delay: 1 + (i * 0.1) });
            }
        }
    } catch (e) {
        console.error('Failed to fetch forecast:', e);
    }
}

function initCharts() {
    const themeColor = '#00f2ff';
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    
    charts.precip = new Chart(precipCtx, {
        type: 'line',
        data: {
            labels: ['-', '-', '-', '-', '-', '-', 'NOW'],
            datasets: [{
                label: 'Prediction Feed',
                data: [0, 0, 0, 0, 0, 0, 0],
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
    charts.acc = new Chart(accCtx, {
        type: 'radar',
        data: {
            labels: ['TEMP', 'DEW', 'HUM', 'PRES', 'VIS', 'WIND'],
            datasets: [{
                data: [20, 20, 20, 20, 10, 10],
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
    
    fetchModelInfo();
}

async function fetchModelInfo() {
    try {
        const res = await fetch('/api/model-info');
        const data = await res.json();
        if (data.status === 'success') {
            const w = data.weights;
            charts.acc.data.datasets[0].data = [w.temp, w.dewpoint, w.humidity, w.pressure, w.visibility, w.wind];
            charts.acc.update();
        }
    } catch (e) {
        console.error("Failed to fetch model info:", e);
    }
}
