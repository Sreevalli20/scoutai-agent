import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import health, research
from app.store.research import get_research_store

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting ScoutAI backend...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    logger.info(f"Groq model: {settings.groq_model}")
    
    # Initialize research store
    research_store = get_research_store()
    logger.info("Research store initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ScoutAI backend...")
    # Cleanup old research jobs
    deleted = research_store.cleanup_old_research()
    logger.info(f"Cleaned up {deleted} old research jobs")


# Create FastAPI application
app = FastAPI(
    title="ScoutAI Backend",
    description="Autonomous opportunity research agent backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.api_prefix, tags=["health"])
app.include_router(research.router, prefix=settings.api_prefix, tags=["research"])


@app.get("/")
async def root():
    """Root endpoint with basic API information."""
    return {
        "service": "ScoutAI Backend",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": f"{settings.api_prefix}/health",
            "research": f"{settings.api_prefix}/research",
            "research_status": f"{settings.api_prefix}/research/{{research_id}}/status"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", settings.port))
    host = settings.host
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )
