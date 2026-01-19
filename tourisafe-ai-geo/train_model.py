import os
import pandas as pd
import joblib
from sqlalchemy import create_engine
from sklearn.ensemble import IsolationForest
from haversine import haversine, Unit
from dotenv import load_dotenv

print("Starting model training process...")

# --- 1. DATABASE CONNECTION ---
# Load database URL from .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file!")

engine = create_engine(DATABASE_URL)

# --- 2. DATA LOADING & FEATURE ENGINEERING ---
# Load all location data into a pandas DataFrame
try:
    df = pd.read_sql("SELECT tourist_id, timestamp, location FROM location_updates ORDER BY tourist_id, timestamp", engine)
    print(f"Successfully loaded {len(df)} records from the database.")
except Exception as e:
    print(f"Error loading data: {e}")
    exit()

# Convert timestamp column to datetime objects
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Function to calculate velocity for our historical data
def calculate_historical_velocity(group):
    # Shift data to get previous location and timestamp
    group['prev_location'] = group['location'].shift(1)
    group['prev_timestamp'] = group['timestamp'].shift(1)
    
    velocities = []
    for _, row in group.iterrows():
        if pd.notna(row['prev_location']):
            # Parse location from WKT format 'POINT(lon lat)'
            lon1, lat1 = row['prev_location'].replace('POINT (', '').replace(')', '').split()
            lon2, lat2 = row['location'].replace('POINT (', '').replace(')', '').split()
            
            p1 = (float(lat1), float(lon1))
            p2 = (float(lat2), float(lon2))
            
            distance_km = haversine(p1, p2, unit=Unit.KILOMETERS)
            time_diff = (row['timestamp'] - row['prev_timestamp']).total_seconds() / 3600
            
            if time_diff > 0:
                velocities.append(distance_km / time_diff)
            else:
                velocities.append(0.0)
        else:
            velocities.append(None) # No velocity for the first point
            
    group['velocity_kph'] = velocities
    return group

# Apply the velocity calculation to each tourist's data
df = df.groupby('tourist_id').apply(calculate_historical_velocity)
df.dropna(subset=['velocity_kph'], inplace=True) # Remove rows where velocity couldn't be calculated

print(f"Feature engineering complete. Calculated velocity for {len(df)} data points.")

# --- 3. MODEL TRAINING ---
if df.empty:
    print("No data available to train the model. Please collect some location data first.")
else:
    # Prepare the data for the model (it expects a 2D array)
    X = df[['velocity_kph']].values

    # Initialize and train the Isolation Forest model
    # `contamination` is the expected proportion of anomalies in the data. 'auto' is a good start.
    model = IsolationForest(contamination='auto', random_state=42)
    model.fit(X)

    print("Model training complete.")

    # --- 4. MODEL SAVING ---
    # Save the trained model to a file
    model_filename = "iso_forest_model.joblib"
    joblib.dump(model, model_filename)

    print(f"Model saved successfully as '{model_filename}'.")