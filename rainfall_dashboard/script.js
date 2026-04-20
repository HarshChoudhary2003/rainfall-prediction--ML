// Constants for our mock prediction engine (derived from general weather patterns)
const COEFFS = {
    temp: -0.005,
    dewpoint: 0.015,
    humidity: 0.008,
    pressure: 0.01,
    visibility: -0.02,
    wind: 0.005
};

const BASE_PRECIP = 0.1;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    setupEventListeners();
    
    // Initial animation
    gsap.from('.logo', { y: -20, opacity: 0, duration: 1, ease: 'power4.out' });
});

function setupEventListeners() {
    const form = document.getElementById('prediction-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        runPrediction();
    });
}

function runPrediction() {
    const temp = parseFloat(document.getElementById('temp').value);
    const dewpoint = parseFloat(document.getElementById('dewpoint').value);
    const humidity = parseFloat(document.getElementById('humidity').value);
    const pressure = parseFloat(document.getElementById('pressure').value);
    const visibility = parseFloat(document.getElementById('visibility').value);
    const wind = parseFloat(document.getElementById('wind').value);

    // Mock Linear Regression Calculation
    let prediction = BASE_PRECIP + 
                    (temp * COEFFS.temp) + 
                    (dewpoint * COEFFS.dewpoint) + 
                    (humidity * COEFFS.humidity) + 
                    (pressure * COEFFS.pressure) + 
                    (visibility * COEFFS.visibility) + 
                    (wind * COEFFS.wind);

    // Ensure non-negative
    prediction = Math.max(0, prediction).toFixed(2);

    displayResult(prediction, humidity, temp);
}

function displayResult(value, humidity, temp) {
    const container = document.getElementById('result-container');
    const valueEl = document.getElementById('precip-value');
    const insightEl = document.getElementById('ai-insight');

    // Update values
    valueEl.innerText = value;
    
    // Update insight text
    if (value > 0.5) {
        insightEl.innerText = "Significant precipitation likely. Cold fronts are merging with high moisture pockets.";
    } else if (value > 0.1) {
        insightEl.innerText = "Expect scattered showers. Low-level cumulus formation observed in telemetry.";
    } else {
        insightEl.innerText = "Clear conditions expected. High pressure system is stabilizing the local atmosphere.";
    }

    // Animate display
    gsap.set(container, { display: 'block' });
    gsap.to(container, { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        ease: 'power2.out',
        startAt: { y: 20 }
    });

    // Particle-like effect for the number
    gsap.from(valueEl, {
        scale: 1.5,
        duration: 0.5,
        ease: 'back.out(2)'
    });
}

function initCharts() {
    // Precipitation Chart
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    new Chart(precipCtx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            datasets: [{
                label: 'Observed Precipitation',
                data: [0.1, 0.45, 0.0, 0.12, 0.8, 0.2, 0.1],
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00d2ff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Accuracy/Performance Chart (Radar)
    const accCtx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(accCtx, {
        type: 'radar',
        data: {
            labels: ['Temp', 'Humidity', 'Wind', 'Pressure', 'DewPt', 'Visibility'],
            datasets: [{
                label: 'Correlation Weight',
                data: [65, 90, 45, 78, 85, 30],
                backgroundColor: 'rgba(255, 0, 122, 0.2)',
                borderColor: '#ff007a',
                borderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#f8fafc' },
                    ticks: { display: false }
                }
            }
        }
    });
}
