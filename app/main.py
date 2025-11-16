from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import time

from app.database import engine, Base, get_db, create_tables
from app.api import router
from app.scheduler import AppointmentScheduler
from app.templates.default_templates import create_default_templates
from app.config import config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Dental Clinic Messaging Agent",
    description="Scalable automated patient messaging system",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request timing middleware for performance monitoring
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header for performance monitoring"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Add rate limiting middleware (if enabled)
if config.RATE_LIMIT_ENABLED:
    try:
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded
        
        limiter = Limiter(key_func=get_remote_address)
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        
        @app.middleware("http")
        async def rate_limit_middleware(request: Request, call_next):
            """Apply rate limiting to all requests"""
            if request.url.path.startswith("/api/"):
                # Apply rate limit
                pass  # Rate limiting will be applied per endpoint
            return await call_next(request)
        
        logger.info("Rate limiting enabled")
    except ImportError:
        logger.warning("slowapi not installed. Rate limiting disabled. Install with: pip install slowapi")

# Include API router
app.include_router(router, prefix="/api")

# Initialize scheduler
scheduler = AppointmentScheduler()

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Reload environment variables on startup
    from dotenv import load_dotenv
    load_dotenv(override=True)
    
    # Log Twilio configuration for debugging
    from app.config import config
    logger.info("=" * 50)
    logger.info("Twilio Configuration:")
    logger.info(f"  Account SID: {config.TWILIO_ACCOUNT_SID[:10] if config.TWILIO_ACCOUNT_SID else 'NOT SET'}...")
    logger.info(f"  Phone Number: {config.TWILIO_PHONE_NUMBER or 'NOT SET'}")
    logger.info(f"  WhatsApp Number: {config.TWILIO_WHATSAPP_NUMBER or 'NOT SET'}")
    logger.info(f"  Message Channel: {config.MESSAGE_CHANNEL}")
    logger.info("=" * 50)
    
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