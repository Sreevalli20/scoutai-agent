import logging
import uuid
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any

from app.models.schemas import (
    ResearchRequest, ResearchResponse, ResearchStatusResponse,
    ResearchStatus, StageState, Progress
)
from app.services.agent import AgentPipeline
from app.store.research import get_research_store

logger = logging.getLogger(__name__)

router = APIRouter()
agent_pipeline = AgentPipeline()
research_store = get_research_store()


@router.post("/research", response_model=ResearchResponse)
async def create_research(
    request: ResearchRequest,
    background_tasks: BackgroundTasks
) -> ResearchResponse:
    """
    Create a new research job.
    
    This endpoint accepts a research request and returns a research ID immediately.
    The actual research is performed in the background, and the client can poll
    the status endpoint to check progress.
    
    Args:
        request: Research request with query, profile, and filters
        background_tasks: FastAPI background tasks for async execution
        
    Returns:
        Research response with research ID and initial status
    """
    research_id = str(uuid.uuid4())
    
    # Store the research job
    research_store.create_research(
        research_id=research_id,
        request=request.model_dump(),
        status=ResearchStatus.queued.value
    )
    
    # Start the research pipeline in the background
    background_tasks.add_task(
        execute_research_background,
        research_id,
        request
    )
    
    logger.info(f"Created research job {research_id} for query: {request.query}")
    
    return ResearchResponse(
        research_id=research_id,
        status=ResearchStatus.queued
    )


@router.get("/research/{research_id}/status", response_model=ResearchStatusResponse)
async def get_research_status(research_id: str) -> ResearchStatusResponse:
    """
    Get the status of a research job.
    
    This endpoint is polled by the frontend to check the progress of a research job.
    It returns the current status, progress through each stage, and the final result
    when completed.
    
    Args:
        research_id: Research ID to look up
        
    Returns:
        Research status response with current status, progress, and result
        
    Raises:
        HTTPException: If research ID is not found
    """
    research_job = research_store.get_research(research_id)
    
    if not research_job:
        raise HTTPException(status_code=404, detail="Research job not found")
    
    return ResearchStatusResponse(
        research_id=research_job["research_id"],
        status=research_job["status"],
        progress=Progress(**research_job["progress"]),
        result=research_job["result"],
        error=research_job["error"]
    )


async def execute_research_background(
    research_id: str,
    request: ResearchRequest
) -> None:
    """
    Execute the research pipeline in the background.
    
    This function runs the complete READ → REASON → ACT workflow and updates
    the research store with progress and results.
    
    Args:
        research_id: Research ID to update
        request: Original research request
    """
    def progress_callback(research_id: str, progress: Dict[str, Any], detail: str) -> None:
        """Callback to update progress in the research store."""
        # The progress is already a dict from model_dump()
        research_store.update_research(
            research_id,
            progress=progress
        )
        
        # Update overall status based on progress
        if progress.get("discover") == StageState.active.value:
            research_store.update_research(research_id, status=ResearchStatus.discovering.value)
        elif progress.get("read") == StageState.active.value:
            research_store.update_research(research_id, status=ResearchStatus.reading.value)
        elif progress.get("reason") == StageState.active.value:
            research_store.update_research(research_id, status=ResearchStatus.reasoning.value)
        elif progress.get("rank") == StageState.active.value:
            research_store.update_research(research_id, status=ResearchStatus.ranking.value)
    
    try:
        # Update status to discovering
        research_store.update_research(research_id, status=ResearchStatus.discovering.value)
        
        # Execute the research pipeline
        result = await agent_pipeline.execute_research(
            request,
            progress_callback=progress_callback
        )
        
        # Store the final result
        if result["status"] == ResearchStatus.completed.value:
            research_store.set_result(
                research_id,
                result["result"],
                status=ResearchStatus.completed.value
            )
        else:
            research_store.set_error(
                research_id,
                result.get("error", "Research failed"),
                status=ResearchStatus.failed.value
            )
        
    except Exception as e:
        logger.error(f"Background research execution failed for {research_id}: {str(e)}", exc_info=True)
        research_store.set_error(
            research_id,
            f"Internal error during research execution: {str(e)}",
            status=ResearchStatus.failed.value
        )
