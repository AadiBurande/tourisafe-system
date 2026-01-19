# ai_service.py

from sqlalchemy.orm import Session
from . import models
import datetime
from haversine import haversine, Unit
import joblib              # <-- NEW: For loading the model
import numpy as np         # <-- NEW: For data reshaping

# --- NEW: LOAD THE TRAINED MODEL ---
# This block loads the model once when the application starts.
try:
    model = joblib.load("iso_forest_model.joblib")
    print("Anomaly detection model loaded successfully.")
except FileNotFoundError:
    print("Model file not found. Anomaly detection will be disabled.")
    model = None
# ------------------------------------

INACTIVITY_THRESHOLD_MINUTES = 10

def check_for_inactivity(tourist_id: str, current_timestamp: datetime.datetime, db: Session) -> (str, datetime.timedelta | None): # type: ignore
    """
    Checks for prolonged inactivity for a given tourist.

    1. Fetches the last known location update for the tourist.
    2. Calculates the time difference between the last update and the current one.
    3. If the difference exceeds the threshold, it flags an anomaly.

    Returns a status string and the time difference.
    """
    # Find the most recent location update for this tourist that occurred *before* the current one.
    last_update = db.query(models.LocationUpdate).filter(
        models.LocationUpdate.tourist_id == tourist_id,
        models.LocationUpdate.timestamp < current_timestamp
    ).order_by(models.LocationUpdate.timestamp.desc()).first()

    if not last_update:
        # This is the first update for this tourist, so no inactivity to check.
        return "first_update", None

    time_difference = current_timestamp - last_update.timestamp
    
    if time_difference > datetime.timedelta(minutes=INACTIVITY_THRESHOLD_MINUTES):
        # Anomaly detected: The tourist has been inactive for too long.
        return "alert", time_difference
    
    # No anomaly detected.
    return "normal", time_difference


def calculate_velocity(tourist_id: str, current_location: dict, current_timestamp: datetime.datetime, db: Session) -> float | None:
    """
    Calculates the velocity (in km/h) for a tourist based on their last known location.

    1. Fetches the last location update for the tourist.
    2. Calculates the distance (in km) between the last point and the current one.
    3. Calculates the time difference (in hours).
    4. Computes velocity = distance / time.

    Returns the velocity in km/h or None if there is no previous point.
    """
    # Find the most recent location update for this tourist that occurred *before* the current one.
    last_update = db.query(models.LocationUpdate).filter(
        models.LocationUpdate.tourist_id == tourist_id,
        models.LocationUpdate.timestamp < current_timestamp
    ).order_by(models.LocationUpdate.timestamp.desc()).first()

    if not last_update:
        # Not enough data to calculate velocity
        return None

    # The database stores location in WKT format "POINT(lon lat)"
    # We need to parse it to get lon and lat.
    last_loc_str = last_update.location.desc
    lon_str, lat_str = last_loc_str.replace('POINT (', '').replace(')', '').split()
    last_point = (float(lat_str), float(lon_str))

    current_point = (current_location['latitude'], current_location['longitude'])
    
    # Calculate distance in kilometers
    distance_km = haversine(last_point, current_point, unit=Unit.KILOMETERS)
    
    # Calculate time difference in hours
    time_difference = current_timestamp - last_update.timestamp
    time_hours = time_difference.total_seconds() / 3600
    
    # Avoid division by zero if timestamps are identical
    if time_hours == 0:
        return 0.0

    # Calculate velocity in km/h
    velocity_kph = distance_km / time_hours
    
    return velocity_kph

# --- NEW: ANOMALY PREDICTION FUNCTION ---
def get_anomaly_prediction(velocity: float | None) -> str:
    """
    Uses the loaded Isolation Forest model to predict if a velocity is an anomaly.
    
    Returns:
        - "anomaly": If the velocity is an outlier.
        - "normal": If the velocity is not an outlier.
        - "not_enough_data": If velocity couldn't be calculated.
        - "model_not_loaded": If the model file is missing.
    """
    if model is None:
        return "model_not_loaded"
        
    if velocity is None:
        return "not_enough_data"

    # The model expects a 2D array, so we reshape the single velocity value
    prediction = model.predict(np.array([[velocity]]))
    
    # The model returns -1 for anomalies (outliers) and 1 for inliers (normal)
    if prediction[0] == -1:
        return "anomaly"
    else:
        return "normal"
    
def trigger_alert(tourist_id, alert_type):
    # In a real app, integrate Twilio/SendGrid here
    print(f"🚨 ALERT DISPATCHED for Tourist {tourist_id}: {alert_type}")
    
    # Optional: Webhook to Police Dashboard
    # requests.post("http://police-dashboard/api/alert", json={...})