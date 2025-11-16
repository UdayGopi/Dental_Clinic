from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool, NullPool
from app.models import Base
from app.config import config
import logging

logger = logging.getLogger(__name__)

# Database connection pool configuration for scalability
# For PostgreSQL (production): Use connection pooling
# For SQLite (development): Use NullPool (no pooling needed)
if config.DATABASE_URL.startswith("sqlite"):
    # SQLite: No connection pooling needed
    engine = create_engine(
        config.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
        echo=False
    )
else:
    # PostgreSQL/MySQL: Use connection pooling for scalability
    engine = create_engine(
        config.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,  # Number of connections to maintain
        max_overflow=40,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=False
    )

# Create session factory with scoped session for thread safety
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Scoped session for thread-safe operations
SessionScoped = scoped_session(SessionLocal)

# Dependency to get DB session
def get_db():
    """Get database session with automatic cleanup"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

# Add connection pool event listeners for monitoring
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Set SQLite pragmas for better performance"""
    if config.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_conn.cursor()
        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        # Increase cache size
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()