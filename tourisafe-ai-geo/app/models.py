# app/models.py

from sqlalchemy import Column, Integer, String, DateTime, Text
from geoalchemy2 import Geometry
from .database import Base
import datetime

class LocationUpdate(Base):
    __tablename__ = "location_updates"

    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Stores location as a Point. SRID 4326 is the standard for GPS coordinates.
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Stores the boundary of the zone (POLYGON).
    geom = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=False)

# --- NEW: ALERT TABLE (For Panic Button) ---
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(String, index=True, nullable=False)
    alert_type = Column(String, nullable=False) # e.g., "PANIC", "MEDICAL", "SAFE"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Location where the alert was triggered
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    status = Column(String, default="OPEN") # "OPEN", "RESOLVED", "FALSE_ALARM"