from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from app.database import engine, Base, get_db, create_tables
from app.api import router
from app.scheduler import AppointmentScheduler
from app.templates.default_templates import create_default_templates

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Dental Clinic Messaging Agent")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix="/api")

# Initialize scheduler
scheduler = AppointmentScheduler()

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Create database tables
    create_tables()
    logger.info("Database tables created")
    
    # Start the scheduler
    scheduler.start()
    
    # Create default templates
    db = next(get_db())
    create_default_templates(db)
    logger.info("Default templates created")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    scheduler.shutdown()

@app.get("/")
async def root():
    return {"message": "Dental Clinic Messaging Agent API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)