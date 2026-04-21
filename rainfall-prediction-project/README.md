# Aquila Pro: Rainfall Prediction System

Aquila Pro is a production-ready rainfall prediction dashboard powered by a Random Forest machine learning model. It provides real-time telemetry analysis and atmospheric modeling with a high-end, animated user interface.

## 🚀 Features

- **Machine Learning Core**: Uses a Random Forest Regressor trained on historical Austin weather data.
- **FastAPI Backend**: High-performance asynchronous API for serving model predictions.
- **Dynamic Frontend**: Modern dashboard with GSAP animations, Chart.js visualizations, and a glassmorphic aesthetic.
- **Micro-Animations**: Real-time atmospheric scanning simulations and haptic UI feedback.
- **Telemetry Trends**: Visualizes historical data and probability forecasts.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **Machine Learning**: Scikit-learn, Pandas, Joblib
- **Frontend**: HTML5, Vanilla CSS3, GSAP, Chart.js
- **Deployment**: Docker-ready

## 📁 Project Structure

```text
.
├── app.py                  # FastAPI Main Application
├── advanced_training.py     # Model Training Script
├── Dockerfile              # Containerization Config
├── requirements.txt        # Python Dependencies
├── models/
│   ├── rainfall_rf_model.pkl # Trained RF Model
│   └── scaler.pkl            # Preprocessing Scaler
├── rainfall_dashboard/     # Frontend Assets
│   ├── index.html          # UI Structure
│   ├── script.js           # Frontend Logic & API Integration
│   └── style.css           # Premium Aesthetics
└── austin_weather.csv      # Source Dataset
```

## 🛠️ Installation & Setup

### 1. Prerequisities
- Python 3.10+
- pip

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate Model (Optional)
If the model files are not present in the `models/` directory, run the training script:
```bash
python advanced_training.py
```

### 4. Run the Application
Start the FastAPI server:
```bash
python app.py
```
Visit `http://localhost:8000` in your browser.

## 🐳 Running with Docker

Build the container:
```bash
docker build -t aquila-pro .
```

Run the container:
```bash
docker run -p 8000:8000 aquila-pro
```

## 📊 Model Information

The system utilizes an ensemble of 100 Decision Trees to predict liquid precipitation. It processes 17 atmospheric features including temperature gradients, dew point shifts, humidity levels, and wind telemetry.

---
*Created by Antigravity AI for Professional Meteorological Analysis.*
