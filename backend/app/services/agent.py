import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.anakin import AnakinService
from app.services.groq import GroqService
from app.services.scoring import ScoringService
from app.models.schemas import (
    ResearchRequest, ResearchStatus, StageState, Progress,
    WebContent, GroqEvaluation, Opportunity, ResearchSummary
)

logger = logging.getLogger(__name__)


class AgentPipeline:
    """
    Orchestrates the READ → REASON → ACT workflow for opportunity research.
    
    Pipeline stages:
    1. DISCOVER: Use Anakin to search for relevant opportunities
    2. READ: Use Anakin to scrape detailed content from discovered URLs
    3. REASON: Use Groq to evaluate each opportunity against user criteria
    4. RANK: Use scoring service to rank opportunities by match score
    5. ACT: Generate actionable recommendations and checklists
    """
    
    def __init__(self):
        """Initialize the agent pipeline with required services."""
        self.anakin = AnakinService()
        self.groq = GroqService()
        self.scoring = ScoringService()
        logger.info("AgentPipeline initialized")
    
    async def execute_research(
        self,
        research_request: ResearchRequest,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Execute the complete research pipeline.
        
        Args:
            research_request: User's research request with query, profile, and filters
            progress_callback: Optional callback function to report progress updates
            
        Returns:
            Research results with opportunities and summary
        """
        research_id = str(uuid.uuid4())
        logger.info(f"Starting research {research_id} for query: {research_request.query}")
        
        # Initialize progress
        progress = Progress()
        
        def update_progress(stage: str, state: StageState, detail: str = ""):
            """Update progress and notify callback if provided."""
            setattr(progress, stage, state)
            if progress_callback:
                progress_callback(research_id, progress.model_dump(), detail)
            logger.info(f"Research {research_id} - {stage}: {state} - {detail}")
        
        try:
            # STAGE 1: DISCOVER
            update_progress("discover", StageState.active, "Searching for relevant opportunities...")
            discovered_urls = await self._discover_opportunities(research_request)
            update_progress("discover", StageState.completed, f"Found {len(discovered_urls)} potential opportunities")
            
            if not discovered_urls:
                update_progress("read", StageState.failed, "No opportunities discovered")
                return self._create_empty_result(research_id, research_request, "No opportunities found matching your query")
            
            # STAGE 2: READ
            update_progress("read", StageState.active, f"Reading content from {len(discovered_urls)} sources...")
            web_contents = await self._read_opportunities(discovered_urls)
            update_progress("read", StageState.completed, f"Successfully read {len(web_contents)} opportunities")
            
            if not web_contents:
                update_progress("reason", StageState.failed, "No content could be read")
                return self._create_empty_result(research_id, research_request, "Failed to read content from discovered opportunities")
            
            # STAGE 3: REASON
            update_progress("reason", StageState.active, "Evaluating opportunities with AI...")
            evaluations = await self._evaluate_opportunities(web_contents, research_request)
            update_progress("reason", StageState.completed, f"Evaluated {len(evaluations)} opportunities")
            
            if not evaluations:
                update_progress("rank", StageState.failed, "No evaluations completed")
                return self._create_empty_result(research_id, research_request, "Failed to evaluate opportunities")
            
            # STAGE 4: RANK
            update_progress("rank", StageState.active, "Ranking opportunities by match score...")
            ranked_evaluations = await self._rank_opportunities(evaluations)
            update_progress("rank", StageState.completed, f"Ranked {len(ranked_evaluations)} opportunities")
            
            # STAGE 5: ACT
            update_progress("act", StageState.active, "Generating action plans...")
            opportunities = await self._generate_action_plans(web_contents, ranked_evaluations)
            update_progress("act", StageState.completed, "Generated action plans for all opportunities")
            
            # Create final result
            result = self._create_final_result(research_id, research_request, opportunities)
            
            logger.info(f"Research {research_id} completed successfully with {len(opportunities)} opportunities")
            return result
            
        except Exception as e:
            logger.error(f"Research {research_id} failed: {str(e)}", exc_info=True)
            return self._create_error_result(research_id, research_request, str(e))
    
    async def _discover_opportunities(self, request: ResearchRequest) -> List[str]:
        """
        DISCOVER stage: Use Anakin to search for relevant opportunities.
        
        Args:
            request: User's research request
            
        Returns:
            List of discovered URLs
        """
        try:
            # Build search query from user's query and filters
            search_query = self._build_search_query(request)
            
            # Use Anakin search API
            search_results = await self.anakin.search_web(search_query, num_results=10)
            
            # Extract URLs from search results
            urls = []
            for result in search_results:
                url = result.get("url") or result.get("link")
                if url:
                    urls.append(url)
            
            logger.info(f"Discovered {len(urls)} URLs for query: {search_query}")
            return urls
            
        except Exception as e:
            logger.error(f"Discovery stage failed: {str(e)}")
            raise
    
    def _build_search_query(self, request: ResearchRequest) -> str:
        """
        Build an optimized search query from the user's request.
        
        Args:
            request: User's research request
            
        Returns:
            Optimized search query string
        """
        query_parts = [request.query]
        
        # Add opportunity type filters
        if request.filters.types:
            type_names = [t.value for t in request.filters.types]
            query_parts.append(" OR ".join(type_names))
        
        # Add location filter
        if request.filters.location and request.filters.location != "any":
            query_parts.append(request.filters.location)
        
        # Add participation filter
        if request.filters.participation and request.filters.participation.value != "either":
            query_parts.append(request.filters.participation.value)
        
        # Add cost filter
        if request.filters.cost and request.filters.cost.value == "free":
            query_parts.append("free")
        
        # Add skills filter
        if request.filters.skills:
            query_parts.append(" ".join(request.filters.skills[:3]))  # Limit to top 3 skills
        
        return " ".join(query_parts)
    
    async def _read_opportunities(self, urls: List[str]) -> List[WebContent]:
        """
        READ stage: Use Anakin to scrape detailed content from URLs.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of normalized web content
        """
        web_contents = []
        
        # Scrape URLs concurrently with a limit to avoid overwhelming the API
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent scrapes
        
        async def scrape_with_semaphore(url: str) -> Optional[WebContent]:
            async with semaphore:
                try:
                    scraped_data = await self.anakin.scrape_url_sync(url)
                    web_content = self.anakin.normalize_scraped_content(scraped_data, url)
                    return web_content
                except Exception as e:
                    logger.warning(f"Failed to scrape {url}: {str(e)}")
                    return None
        
        tasks = [scrape_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, WebContent):
                web_contents.append(result)
            elif isinstance(result, Exception):
                logger.warning(f"Scraping error: {str(result)}")
        
        logger.info(f"Successfully read {len(web_contents)} out of {len(urls)} URLs")
        return web_contents
    
    async def _evaluate_opportunities(
        self,
        web_contents: List[WebContent],
        request: ResearchRequest
    ) -> List[GroqEvaluation]:
        """
        REASON stage: Use Groq to evaluate opportunities against user criteria.
        
        Args:
            web_contents: List of normalized web content
            request: User's research request
            
        Returns:
            List of Groq evaluations
        """
        evaluations = []
        
        # Convert request to dict for easier access
        user_profile = request.profile.model_dump()
        user_filters = request.filters.model_dump()
        
        # Evaluate opportunities concurrently with a limit
        semaphore = asyncio.Semaphore(2)  # Max 2 concurrent evaluations
        
        async def evaluate_with_semaphore(web_content: WebContent) -> Optional[GroqEvaluation]:
            async with semaphore:
                try:
                    evaluation = await self.groq.evaluate_opportunity(
                        web_content,
                        request.query,
                        user_profile,
                        user_filters
                    )
                    return evaluation
                except Exception as e:
                    logger.warning(f"Failed to evaluate {web_content.source_url}: {str(e)}")
                    return None
        
        tasks = [evaluate_with_semaphore(content) for content in web_contents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, GroqEvaluation):
                evaluations.append(result)
            elif isinstance(result, Exception):
                logger.warning(f"Evaluation error: {str(result)}")
        
        logger.info(f"Successfully evaluated {len(evaluations)} out of {len(web_contents)} opportunities")
        return evaluations
    
    async def _rank_opportunities(self, evaluations: List[GroqEvaluation]) -> List[GroqEvaluation]:
        """
        RANK stage: Rank opportunities by match score.
        
        Args:
            evaluations: List of Groq evaluations
            
        Returns:
            Sorted list of evaluations
        """
        ranked = await self.groq.rank_opportunities(evaluations)
        logger.info(f"Ranked opportunities: {ranked[0].match_score if ranked else 0} (highest) to {ranked[-1].match_score if ranked else 0} (lowest)")
        return ranked
    
    async def _generate_action_plans(
        self,
        web_contents: List[WebContent],
        evaluations: List[GroqEvaluation]
    ) -> List[Opportunity]:
        """
        ACT stage: Generate actionable recommendations and checklists.
        
        Args:
            web_contents: List of normalized web content
            evaluations: List of ranked Groq evaluations
            
        Returns:
            List of structured opportunity objects with action plans
        """
        opportunities = []
        
        # Combine web content with evaluations
        for i, (web_content, evaluation) in enumerate(zip(web_contents, evaluations)):
            try:
                opportunity_id = str(uuid.uuid4())
                opportunity = await self.groq.create_opportunity_from_evaluation(
                    web_content,
                    evaluation,
                    opportunity_id
                )
                opportunities.append(opportunity)
            except Exception as e:
                logger.warning(f"Failed to create opportunity from evaluation: {str(e)}")
        
        logger.info(f"Generated {len(opportunities)} structured opportunities")
        return opportunities
    
    def _create_final_result(
        self,
        research_id: str,
        request: ResearchRequest,
        opportunities: List[Opportunity]
    ) -> Dict[str, Any]:
        """
        Create the final research result.
        
        Args:
            research_id: Unique research ID
            request: Original research request
            opportunities: List of evaluated opportunities
            
        Returns:
            Final result dictionary
        """
        # Count matches (opportunities with match score >= 50)
        matches = sum(1 for opp in opportunities if opp.match_score >= 50)
        
        summary = ResearchSummary(
            evaluated=len(opportunities),
            matches=matches,
            timestamp=datetime.utcnow()
        )
        
        # Convert opportunities to dicts
        opportunity_dicts = [opp.model_dump() for opp in opportunities]
        
        return {
            "research_id": research_id,
            "status": ResearchStatus.completed,
            "progress": Progress(
                discover=StageState.completed,
                read=StageState.completed,
                reason=StageState.completed,
                rank=StageState.completed,
                act=StageState.completed
            ).model_dump(),
            "result": {
                "summary": summary.model_dump(),
                "opportunities": opportunity_dicts
            }
        }
    
    def _create_empty_result(
        self,
        research_id: str,
        request: ResearchRequest,
        message: str
    ) -> Dict[str, Any]:
        """
        Create an empty result when no opportunities are found.
        
        Args:
            research_id: Unique research ID
            request: Original research request
            message: Explanation message
            
        Returns:
            Empty result dictionary
        """
        summary = ResearchSummary(
            evaluated=0,
            matches=0,
            timestamp=datetime.utcnow()
        )
        
        return {
            "research_id": research_id,
            "status": ResearchStatus.completed,
            "progress": Progress(
                discover=StageState.completed,
                read=StageState.completed,
                reason=StageState.completed,
                rank=StageState.completed,
                act=StageState.completed
            ).model_dump(),
            "result": {
                "summary": summary.model_dump(),
                "opportunities": []
            },
            "error": message
        }
    
    def _create_error_result(
        self,
        research_id: str,
        request: ResearchRequest,
        error_message: str
    ) -> Dict[str, Any]:
        """
        Create an error result when research fails.
        
        Args:
            research_id: Unique research ID
            request: Original research request
            error_message: Error message
            
        Returns:
            Error result dictionary
        """
        return {
            "research_id": research_id,
            "status": ResearchStatus.failed,
            "progress": Progress().model_dump(),
            "result": None,
            "error": error_message
        }
