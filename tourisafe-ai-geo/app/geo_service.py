from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field, ConfigDict # <-- Import ConfigDict
from typing import List

from . import models
from .database import get_db

router = APIRouter()

class RiskZoneCreate(BaseModel):
    name: str
    description: str | None = None
    coordinates: List[List[float]] = Field(..., example=[[73.85, 18.52], [73.86, 18.52], [73.86, 18.51], [73.85, 18.51], [73.85, 18.52]])

class RiskZoneDisplay(BaseModel):
    id: int
    name: str
    description: str | None = None
    
    # This is the line that's been updated to fix the warning
    model_config = ConfigDict(from_attributes=True)


@router.post("/risk-zones", status_code=201, response_model=RiskZoneDisplay)
def create_risk_zone(zone: RiskZoneCreate, db: Session = Depends(get_db)):
    # ... (previous code for creating a zone is unchanged)
    if not zone.coordinates or len(zone.coordinates) < 4:
        raise HTTPException(status_code=400, detail="A polygon must have at least 4 coordinate pairs.")

    if zone.coordinates[0] != zone.coordinates[-1]:
        raise HTTPException(status_code=400, detail="The first and last coordinates must be the same to form a closed polygon.")

    coordinates_str = ", ".join([f"{lon} {lat}" for lon, lat in zone.coordinates])
    polygon_wkt = f"POLYGON(({coordinates_str}))"

    db_zone = models.RiskZone(
        name=zone.name,
        description=zone.description,
        geom=polygon_wkt
    )
    
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)

    return db_zone


@router.get("/risk-zones", response_model=List[RiskZoneDisplay])
def get_all_risk_zones(db: Session = Depends(get_db)):
    zones = db.query(models.RiskZone).all()
    return zones

# --- NEW FUNCTION ---
def check_location_against_zones(location_wkt: str, db: Session) -> List[str]:
    """
    Checks a given location point against all risk zones in the database.
    
    Uses the PostGIS ST_Contains function for efficient spatial querying.
    Returns a list of names of the risk zones the point is inside.
    """
    # Query the database to find all risk zones that contain the given location
    zones_containing_point = db.query(models.RiskZone.name).filter(
        func.ST_Contains(models.RiskZone.geom, func.ST_GeomFromText(location_wkt, 4326))
    ).all()

    # The query returns a list of tuples, e.g., [('Zone A',), ('Zone B',)].
    # We extract the first element from each tuple to get a simple list of names.
    return [zone[0] for zone in zones_containing_point]

