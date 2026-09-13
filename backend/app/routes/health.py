from fastapi import APIRouter
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns the current health status of the ScoutAI backend service.
    This endpoint is used by the frontend to verify the backend is operational.
    """
    return HealthResponse(
        status="ok",
        service="scoutai-backend"
    )
