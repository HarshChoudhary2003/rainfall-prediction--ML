import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def train():
    # Load dataset
    if not os.path.exists("austin_weather.csv"):
        print("Error: austin_weather.csv not found in current directory.")
        return

    data = pd.read_csv("austin_weather.csv")
    
    # Preprocessing
    # Drop irrelevant columns
    to_drop = ["Events", "Date", "SeaLevelPressureLowInches"]
    data = data.drop(to_drop, axis=1)

    # Clean the data
    data = data.replace('T', 0.0)
    data = data.replace('-', 0.0)
    
    # Ensure all columns are numeric
    data = data.apply(pd.to_numeric)

    # Features and Target
    X = data.drop(["PrecipitationSumInches"], axis=1)
    y = data["PrecipitationSumInches"]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("--- Training Advanced Random Forest Model ---")
    
    # Random Forest Model
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train_scaled, y_train)

    # Evaluation
    predictions = rf.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"Mean Absolute Error: {mae:.4f}")
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"R2 Score: {r2:.4f}")

    # Feature Importance
    importances = rf.feature_importances_
    feature_names = X.columns
    sorted_idx = np.argsort(importances)[::-1]

    print("\n--- Key Feature Contributions ---")
    for i in sorted_idx[:5]:
        print(f"{feature_names[i]}: {importances[i]:.4f}")

    # Save the model and scaler
    if not os.path.exists('models'):
        os.makedirs('models')
        
    joblib.dump(rf, 'models/rainfall_rf_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    print("\nModel and Scaler successfully saved to the 'models' directory.")

if __name__ == "__main__":
    train()
