# main.py

from fastapi import FastAPI
from app import models
from app.database import engine
from app.location_router import router as location_router
from app.geo_service import router as geo_router # <-- ADDED: Import the geo_router

# This command creates the database tables based on your models
# It checks if the tables exist before creating them, so it's safe to run every time.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tourisafe AI & Geo Service",
    description="API for processing location data, running anomaly detection, and serving geo-analytics."
)

# Include the router that handles location tracking
# All routes from location_router will be prefixed with /api
app.include_router(location_router, prefix="/api", tags=["Location"])

# Include the router for managing risk zones
app.include_router(geo_router, prefix="/api", tags=["Risk Zones"]) # <-- ADDED: Include the router

@app.get("/")
def read_root():
    """A simple root endpoint to confirm the service is running."""
    return {"message": "Tourisafe AI & Geo Service is running."}