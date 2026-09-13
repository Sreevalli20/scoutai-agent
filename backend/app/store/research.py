import logging
import threading
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ResearchStore:
    """
    In-memory store for research jobs and results.
    
    This is a simple in-memory implementation for the hackathon prototype.
    In production, this would be replaced with a proper database (PostgreSQL, etc.).
    
    The store is thread-safe and includes automatic cleanup of old research jobs.
    """
    
    def __init__(self, max_age_hours: int = 24):
        """
        Initialize the research store.
        
        Args:
            max_age_hours: Maximum age of research jobs before automatic cleanup
        """
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._max_age = timedelta(hours=max_age_hours)
        logger.info(f"ResearchStore initialized with max age: {max_age_hours} hours")
    
    def create_research(
        self,
        research_id: str,
        request: Dict[str, Any],
        status: str = "queued"
    ) -> Dict[str, Any]:
        """
        Create a new research job.
        
        Args:
            research_id: Unique research ID
            request: Research request data
            status: Initial status
            
        Returns:
            Created research job data
        """
        with self._lock:
            research_job = {
                "research_id": research_id,
                "request": request,
                "status": status,
                "progress": {
                    "discover": "pending",
                    "read": "pending",
                    "reason": "pending",
                    "rank": "pending",
                    "act": "pending"
                },
                "result": None,
                "error": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            self._store[research_id] = research_job
            logger.info(f"Created research job {research_id}")
            
            return research_job
    
    def get_research(self, research_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a research job by ID.
        
        Args:
            research_id: Research ID to look up
            
        Returns:
            Research job data or None if not found
        """
        with self._lock:
            return self._store.get(research_id)
    
    def update_research(
        self,
        research_id: str,
        **updates
    ) -> Optional[Dict[str, Any]]:
        """
        Update a research job.
        
        Args:
            research_id: Research ID to update
            **updates: Fields to update
            
        Returns:
            Updated research job data or None if not found
        """
        with self._lock:
            if research_id not in self._store:
                return None
            
            research_job = self._store[research_id]
            
            # Update fields
            for key, value in updates.items():
                if key == "progress" and isinstance(value, dict):
                    # Merge progress updates
                    research_job["progress"].update(value)
                else:
                    research_job[key] = value
            
            research_job["updated_at"] = datetime.utcnow()
            
            logger.debug(f"Updated research job {research_id}: {list(updates.keys())}")
            
            return research_job
    
    def update_progress(
        self,
        research_id: str,
        stage: str,
        state: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update a specific stage's progress.
        
        Args:
            research_id: Research ID to update
            stage: Stage name (discover, read, reason, rank, act)
            state: New state (pending, active, completed, failed)
            
        Returns:
            Updated research job data or None if not found
        """
        with self._lock:
            if research_id not in self._store:
                return None
            
            research_job = self._store[research_id]
            
            if stage in research_job["progress"]:
                research_job["progress"][stage] = state
                research_job["updated_at"] = datetime.utcnow()
                
                logger.debug(f"Updated progress for {research_id}: {stage} -> {state}")
            
            return research_job
    
    def set_result(
        self,
        research_id: str,
        result: Dict[str, Any],
        status: str = "completed"
    ) -> Optional[Dict[str, Any]]:
        """
        Set the final result for a research job.
        
        Args:
            research_id: Research ID to update
            result: Final result data
            status: Final status
            
        Returns:
            Updated research job data or None if not found
        """
        with self._lock:
            if research_id not in self._store:
                return None
            
            research_job = self._store[research_id]
            research_job["result"] = result
            research_job["status"] = status
            research_job["updated_at"] = datetime.utcnow()
            
            logger.info(f"Set result for research job {research_id}: {status}")
            
            return research_job
    
    def set_error(
        self,
        research_id: str,
        error: str,
        status: str = "failed"
    ) -> Optional[Dict[str, Any]]:
        """
        Set an error for a research job.
        
        Args:
            research_id: Research ID to update
            error: Error message
            status: Final status
            
        Returns:
            Updated research job data or None if not found
        """
        with self._lock:
            if research_id not in self._store:
                return None
            
            research_job = self._store[research_id]
            research_job["error"] = error
            research_job["status"] = status
            research_job["updated_at"] = datetime.utcnow()
            
            logger.error(f"Set error for research job {research_id}: {error}")
            
            return research_job
    
    def delete_research(self, research_id: str) -> bool:
        """
        Delete a research job.
        
        Args:
            research_id: Research ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            if research_id in self._store:
                del self._store[research_id]
                logger.info(f"Deleted research job {research_id}")
                return True
            return False
    
    def cleanup_old_research(self) -> int:
        """
        Clean up research jobs older than max_age.
        
        Returns:
            Number of research jobs deleted
        """
        with self._lock:
            now = datetime.utcnow()
            to_delete = []
            
            for research_id, research_job in self._store.items():
                age = now - research_job["created_at"]
                if age > self._max_age:
                    to_delete.append(research_id)
            
            for research_id in to_delete:
                del self._store[research_id]
            
            if to_delete:
                logger.info(f"Cleaned up {len(to_delete)} old research jobs")
            
            return len(to_delete)
    
    def get_all_research(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all research jobs (for debugging/admin purposes).
        
        Returns:
            Dictionary of all research jobs
        """
        with self._lock:
            return self._store.copy()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the research store.
        
        Returns:
            Statistics dictionary
        """
        with self._lock:
            total = len(self._store)
            
            status_counts = {}
            for research_job in self._store.values():
                status = research_job["status"]
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "total_research_jobs": total,
                "status_counts": status_counts,
                "max_age_hours": self._max_age.total_seconds() / 3600
            }


# Global research store instance
_research_store: Optional[ResearchStore] = None


def get_research_store() -> ResearchStore:
    """
    Get the global research store instance.
    
    Returns:
        ResearchStore instance
    """
    global _research_store
    if _research_store is None:
        _research_store = ResearchStore()
    return _research_store
