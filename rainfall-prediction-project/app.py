import os
import sqlite3
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

# Setup SQLite Database
def init_db():
    conn = sqlite3.connect('predictions.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            temp REAL,
            dewpoint REAL,
            humidity REAL,
            pressure REAL,
            visibility REAL,
            wind REAL,
            region TEXT,
            prediction REAL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

app = FastAPI(title="Aquila Pro Rainfall Prediction API")

# Load model and scaler
try:
    model = joblib.load('models/rainfall_rf_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
except Exception as e:
    print(f"Error loading model or scaler: {e}")
    model = None
    scaler = None

class WeatherData(BaseModel):
    temp: float
    dewpoint: float
    humidity: float
    pressure: float
    visibility: float
    wind: float
    region: str = "central"

@app.post("/api/predict")
async def predict(data: WeatherData):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model not loaded on server.")

    # Map the 6 inputs to the 17 features the model expects
    # Date,TempHighF,TempAvgF,TempLowF,DewPointHighF,DewPointAvgF,DewPointLowF,
    # HumidityHighPercent,HumidityAvgPercent,HumidityLowPercent,
    # SeaLevelPressureHighInches,SeaLevelPressureAvgInches,
    # VisibilityHighMiles,VisibilityAvgMiles,VisibilityLowMiles,
    # WindHighMPH,WindAvgMPH,WindGustMPH
    
    # Based on advanced_training.py, we dropped: Date, Events, SeaLevelPressureLowInches
    # Remaining features in order:
    # 0: TempHighF
    # 1: TempAvgF
    # 2: TempLowF
    # 3: DewPointHighF
    # 4: DewPointAvgF
    # 5: DewPointLowF
    # 6: HumidityHighPercent
    # 7: HumidityAvgPercent
    # 8: HumidityLowPercent
    # 9: SeaLevelPressureHighInches
    # 10: SeaLevelPressureAvgInches
    # 11: VisibilityHighMiles
    # 12: VisibilityAvgMiles
    # 13: VisibilityLowMiles
    # 14: WindHighMPH
    # 15: WindAvgMPH
    # 16: WindGustMPH

    # Create feature array with simulated details based on the 6 core inputs
    features = [
        data.temp + 5,      # TempHighF
        data.temp,          # TempAvgF
        data.temp - 5,      # TempLowF
        data.dewpoint + 2,  # DewPointHighF
        data.dewpoint,      # DewPointAvgF
        data.dewpoint - 2,  # DewPointLowF
        data.humidity + 10, # HumidityHighPercent
        data.humidity,      # HumidityAvgPercent
        data.humidity - 10, # HumidityLowPercent
        data.pressure + 0.1,# SeaLevelPressureHighInches
        data.pressure,      # SeaLevelPressureAvgInches
        data.visibility + 2,# VisibilityHighMiles
        data.visibility,    # VisibilityAvgMiles
        max(0, data.visibility - 2), # VisibilityLowMiles
        data.wind + 5,      # WindHighMPH
        data.wind,          # WindAvgMPH
        data.wind + 10      # WindGustMPH
    ]

    # Region multipliers (similar to what was in JS but now on server)
    region_multipliers = {
        "central": 1.0,
        "coast": 1.45,
        "arid": 0.55
    }
    multiplier = region_multipliers.get(data.region, 1.0)

    try:
        # Scale and predict
        features_scaled = scaler.transform([features])
        prediction = model.predict(features_scaled)[0]
        
        # Apply region multiplier and ensure non-negative
        final_prediction = max(0, float(prediction) * multiplier)
        
        # Log to database
        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO history (timestamp, temp, dewpoint, humidity, pressure, visibility, wind, region, prediction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (datetime.datetime.now().isoformat(), data.temp, data.dewpoint, data.humidity, data.pressure, data.visibility, data.wind, data.region, round(final_prediction, 2)))
        conn.commit()
        conn.close()

        return {
            "prediction": round(final_prediction, 2),
            "status": "success",
            "model_version": "RandomForest-v4.0-Optimized"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.get("/api/history")
async def get_history(limit: int = 10):
    try:
        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT timestamp, temp, humidity, wind, region, prediction 
            FROM history ORDER BY id DESC LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        history = [
            {
                "timestamp": row[0],
                "temp": row[1],
                "humidity": row[2],
                "wind": row[3],
                "region": row[4],
                "prediction": row[5]
            } for row in rows
        ]
        return {"status": "success", "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/model-info")
async def get_model_info():
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded on server.")
    try:
        imps = model.feature_importances_
        weights = {
            "temp": sum(imps[0:3]),
            "dewpoint": sum(imps[3:6]),
            "humidity": sum(imps[6:9]),
            "pressure": sum(imps[9:11]),
            "visibility": sum(imps[11:14]),
            "wind": sum(imps[14:17])
        }
        total = sum(weights.values())
        weights_pct = {k: round((v / total) * 100, 1) for k, v in weights.items()}
        return {"status": "success", "weights": weights_pct}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting weights: {str(e)}")

@app.get("/api/forecast")
async def get_forecast():
    import random
    forecast = []
    base = 0.2
    for i in range(7):
        val = max(0, base + random.uniform(-0.1, 0.4))
        prob = int(min(100, max(0, val * 150 + random.randint(-10, 30))))
        forecast.append({
            "value": round(val, 2),
            "probability": prob
        })
    return {"status": "success", "forecast": forecast}

# Serve static files from the dashboard directory
# We'll use the existing directory structure
app.mount("/", StaticFiles(directory="rainfall_dashboard", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
