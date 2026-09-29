import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.seed_data import seed_database
from backend.routers import (
    auth_routes, erp_routes, lms_routes, attendance_routes,
    certificate_routes, job_routes, ai_routes, analytics_routes
)

app = FastAPI(
    title="SAHAKAR-SETU Core Platform API",
    description="AI & LMS-Enabled Cooperative Capacity Building, ERP & Employment Ecosystem (SIH #26087)",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(auth_routes.router)
app.include_router(erp_routes.router)
app.include_router(lms_routes.router)
app.include_router(attendance_routes.router)
app.include_router(certificate_routes.router)
app.include_router(job_routes.router)
app.include_router(ai_routes.router)
app.include_router(analytics_routes.router)

@app.on_event("startup")
def on_startup():
    # Create tables and seed data if not present
    Base.metadata.create_all(bind=engine)
    seed_database()

@app.get("/")
def health_check():
    return {
        "status": "ONLINE",
        "service": "SAHAKAR-SETU Core Monolith",
        "ministry": "Ministry of Cooperation, Government of India",
        "target_organization": "National Council for Cooperative Training (NCCT)",
        "sih_problem_id": 26087,
        "database": "SQLite (Local) / PostgreSQL Ready",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    from backend.config import API_HOST, API_PORT
    uvicorn.run("backend.main:app", host=API_HOST, port=API_PORT, reload=True)
