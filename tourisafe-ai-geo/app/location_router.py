# app/location_router.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import datetime
import requests  # Required to talk to Go Backend

from . import models
from .database import get_db
from .geo_service import check_location_against_zones
from .ai_service import check_for_inactivity, calculate_velocity, get_anomaly_prediction

router = APIRouter()

# --- PYDANTIC MODELS (Input Validation) ---
class LocationData(BaseModel):
    tourist_id: str
    latitude: float
    longitude: float
    timestamp: datetime.datetime

class TestLocationData(BaseModel):
    latitude: float
    longitude: float

# New model for the Panic Button
class AlertRequest(BaseModel):
    tourist_id: str
    latitude: float
    longitude: float
    type: str # "PANIC", "MEDICAL", "FIRE", "OTHER"

# --- HELPER: Verify Tourist with Go Backend ---
def verify_tourist_identity(tourist_id: str):
    """
    Calls the Go Blockchain Service to check if the tourist_id exists.
    """
    url = f"http://localhost:8085/api/tourist/data/{tourist_id}"
    
    try:
        # Auth credentials for the Go backend (prerna/prerna18)
        response = requests.get(url, auth=('prerna', 'prerna18'), timeout=5)
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Tourist ID not found in Digital ID System")
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized access to Identity Service")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Identity verification failed")
            
        return True # Tourist exists!

    except requests.exceptions.ConnectionError:
        # For development, you might want to print a warning but allow it to continue 
        # if you are testing offline. For now, we enforce it.
        raise HTTPException(status_code=503, detail="Identity Service (Go) is unreachable.")

# --- ROUTE 1: TRACKING & AI ANALYSIS ---
@router.post("/track", status_code=201)
def create_location_update(data: LocationData, db: Session = Depends(get_db)):
    """
    Receives location, verifies ID, saves to DB, runs AI checks.
    """
    # 1. Security Check
    verify_tourist_identity(data.tourist_id)

    # 2. AI Velocity Calculation
    current_velocity = calculate_velocity(
        tourist_id=data.tourist_id,
        current_location={"latitude": data.latitude, "longitude": data.longitude},
        current_timestamp=data.timestamp,
        db=db
    )
    anomaly_status = get_anomaly_prediction(current_velocity)

    # 3. Save to Database
    point_wkt = f"POINT({data.longitude} {data.latitude})"
    db_location = models.LocationUpdate(
        tourist_id=data.tourist_id,
        timestamp=data.timestamp,
        location=point_wkt
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)

    # 4. Check for Inactivity
    inactivity_status, time_since_last_update = check_for_inactivity(
        tourist_id=data.tourist_id,
        current_timestamp=data.timestamp,
        db=db
    )

    # 5. Check Risk Zones (Geo-fencing)
    active_zones = check_location_against_zones(point_wkt, db)

    return {
        "status": "success",
        "message": "Location tracked",
        "active_risk_zones": active_zones,
        "movement_analysis": {
            "velocity_kph": round(current_velocity, 2) if current_velocity else 0,
            "anomaly": anomaly_status
        },
        "inactivity_analysis": inactivity_status
    }

# --- ROUTE 2: PANIC BUTTON (Option B) ---
@router.post("/alert", status_code=200)
def trigger_panic_button(alert: AlertRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Triggers an immediate emergency alert.
    """
    # 1. Verify ID (Even in emergency, we need to know who it is)
    verify_tourist_identity(alert.tourist_id)
    
    # 2. Log Alert to Database
    point_wkt = f"POINT({alert.longitude} {alert.latitude})"
    new_alert = models.Alert(
        tourist_id=alert.tourist_id,
        alert_type=alert.type,
        location=point_wkt,
        status="OPEN"
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # 3. Simulate Dispatch (Print to console)
    # In a real app, 'background_tasks' would send SMS/Email so the API response isn't slowed down.
    print(f"🚨 EMERGENCY ALERT RECEIVED! ID: {new_alert.id}")
    print(f"   User: {alert.tourist_id}")
    print(f"   Type: {alert.type}")
    print(f"   Location: {alert.latitude}, {alert.longitude}")
    
    return {
        "status": "SOS_RECEIVED",
        "dispatch_id": new_alert.id,
        "message": "Emergency services have been notified."
    }

# --- ROUTE 3: TEST HELPER ---
@router.post("/track/test-location")
def test_location_against_zones(data: TestLocationData, db: Session = Depends(get_db)):
    """
    Checks if a coordinate is in a risk zone without saving it.
    """
    point_wkt = f"POINT({data.longitude} {data.latitude})"
    active_zones = check_location_against_zones(point_wkt, db)
    return {
        "latitude": data.latitude,
        "longitude": data.longitude,
        "active_risk_zones": active_zones
    }