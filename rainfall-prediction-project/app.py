import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

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
        
        return {
            "prediction": round(final_prediction, 2),
            "status": "success",
            "model_version": "RandomForest-v4.0"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

# Serve static files from the dashboard directory
# We'll use the existing directory structure
app.mount("/", StaticFiles(directory="rainfall_dashboard", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
