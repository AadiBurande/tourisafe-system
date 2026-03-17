# Smart Tourist Safety System (Tourisafe)

This is a comprehensive digital ecosystem for tourist safety in the North Eastern Region. It consists of three interconnected microservices.

## 📂 Project Structure

- **`digitalid-backend/`** (Go): Blockchain-based Identity Management.
- **`tourisafe-ai-geo/`** (Python): AI Anomaly Detection & Geo-fencing.
- **`studio/`** (Node.js/Next.js): Frontend Dashboard for tourists and authorities.


---

## 🚀 Quick Start Guide

To run the full system, you need **3 separate terminal windows** open.

### Terminal 1: Identity Service (Go)
Handles user registration and blockchain data.
```bash
cd digitalid-backend
go run main.go
# Runs on: http://localhost:8085

cd tourisafe-ai-geo
# Windows:
.\.venv\Scripts\Activate
# Mac/Linux:
# source .venv/bin/activate

python -m uvicorn main:app --reload
# Runs on: http://localhost:8000

cd studio
npm run dev
# Runs on: http://localhost:9002
