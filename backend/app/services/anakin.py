import httpx
import logging
from typing import List, Dict, Any, Optional
from app.config import get_settings
from app.models.schemas import WebContent

logger = logging.getLogger(__name__)


class AnakinService:
    """Service for interacting with Anakin API for web discovery and scraping."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = "https://api.anakin.io"
        self.api_key = self.settings.anakin_api_key
        self.timeout = self.settings.anakin_timeout
        
        # Validate API key is present
        if not self.api_key:
            logger.warning("Anakin API key not configured - service will fail on actual API calls")
        
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Anakin API requests."""
        return {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def search_web(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Perform AI-powered web search using Anakin Search API.
        
        Args:
            query: Search query string
            num_results: Number of results to return (default: 10)
            
        Returns:
            List of search results with URLs, titles, snippets, and relevance scores
            
        Raises:
            httpx.HTTPError: If the API request fails
            ValueError: If the response is invalid
        """
        url = f"{self.base_url}/v1/search"
        headers = self._get_headers()
        
        payload = {
            "prompt": query,
            "limit": num_results
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"Searching Anakin for query: {query[:100]}...")
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                
                # Extract search results from response
                results = data.get("results", [])
                logger.info(f"Found {len(results)} search results")
                
                return results
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Anakin search HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException:
            logger.error("Anakin search timeout")
            raise
        except Exception as e:
            logger.error(f"Anakin search error: {str(e)}")
            raise
    
    async def scrape_url(self, url: str, formats: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Submit a URL scraping job to Anakin URL Scraper API.
        
        Args:
            url: URL to scrape
            formats: Output formats to produce (default: ["markdown", "html"])
            
        Returns:
            Job ID and initial status
            
        Raises:
            httpx.HTTPError: If the API request fails
            ValueError: If the response is invalid
        """
        scrape_url = f"{self.base_url}/v1/url-scraper"
        headers = self._get_headers()
        
        if formats is None:
            formats = ["markdown", "html"]
        
        payload = {
            "url": url,
            "formats": formats,
            "useBrowser": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"Submitting scrape job for URL: {url[:100]}...")
                response = await client.post(scrape_url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                job_id = data.get("jobId")
                
                if not job_id:
                    raise ValueError("No job ID returned from Anakin")
                
                logger.info(f"Scrape job submitted with ID: {job_id}")
                return {"job_id": job_id, "status": "submitted"}
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Anakin scrape submission HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException:
            logger.error("Anakin scrape submission timeout")
            raise
        except Exception as e:
            logger.error(f"Anakin scrape submission error: {str(e)}")
            raise
    
    async def get_scrape_result(self, job_id: str) -> Dict[str, Any]:
        """
        Poll for scrape job results.
        
        Args:
            job_id: Job ID from scrape submission
            
        Returns:
            Job results including status and scraped content
            
        Raises:
            httpx.HTTPError: If the API request fails
            ValueError: If the response is invalid
        """
        result_url = f"{self.base_url}/v1/url-scraper/{job_id}"
        headers = self._get_headers()
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.debug(f"Polling scrape job: {job_id}")
                response = await client.get(result_url, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Anakin scrape result HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException:
            logger.error("Anakin scrape result timeout")
            raise
        except Exception as e:
            logger.error(f"Anakin scrape result error: {str(e)}")
            raise
    
    async def scrape_url_sync(self, url: str, max_polls: int = 10, poll_interval: float = 2.0) -> Dict[str, Any]:
        """
        Scrape a URL with automatic polling for results.
        
        Args:
            url: URL to scrape
            max_polls: Maximum number of polling attempts
            poll_interval: Seconds between polls
            
        Returns:
            Scrape results when job completes
            
        Raises:
            httpx.HTTPError: If the API request fails
            TimeoutError: If job doesn't complete within max polls
        """
        # Submit scrape job
        job_info = await self.scrape_url(url)
        job_id = job_info["job_id"]
        
        # Poll for results
        for attempt in range(max_polls):
            result = await self.get_scrape_result(job_id)
            status = result.get("status")
            
            if status == "completed":
                logger.info(f"Scrape job {job_id} completed successfully")
                return result
            elif status == "failed":
                error = result.get("error", "Unknown error")
                logger.error(f"Scrape job {job_id} failed: {error}")
                raise ValueError(f"Scrape job failed: {error}")
            
            # Wait before next poll
            if attempt < max_polls - 1:
                import asyncio
                await asyncio.sleep(poll_interval)
        
        raise TimeoutError(f"Scrape job {job_id} did not complete within {max_polls * poll_interval} seconds")
    
    def normalize_scraped_content(self, scraped_data: Dict[str, Any], source_url: str) -> WebContent:
        """
        Normalize scraped content into a structured WebContent object.
        
        Args:
            scraped_data: Raw scraped data from Anakin
            source_url: Original URL that was scraped
            
        Returns:
            Normalized WebContent object
        """
        # Extract content from different possible formats
        markdown = scraped_data.get("markdown", "")
        html = scraped_data.get("html", "")
        json_data = scraped_data.get("json", {})
        
        # If structured JSON was extracted, use it directly
        if json_data and isinstance(json_data, dict):
            return WebContent(
                title=json_data.get("title"),
                organization=json_data.get("organization"),
                source_url=source_url,
                deadline=json_data.get("deadline"),
                location=json_data.get("location"),
                participation=json_data.get("participation"),
                cost=json_data.get("cost"),
                prize=json_data.get("prize"),
                eligibility=json_data.get("eligibility", []),
                requirements=json_data.get("requirements", []),
                relevant_skills=json_data.get("relevant_skills", []),
                description=json_data.get("description"),
                raw_content=markdown or html
            )
        
        # Otherwise, extract from markdown/text content
        # This is a basic extraction - in production, you'd use more sophisticated parsing
        text_content = markdown or html or ""
        
        return WebContent(
            title=self._extract_title(text_content),
            organization=self._extract_organization(text_content),
            source_url=source_url,
            deadline=self._extract_deadline(text_content),
            location=self._extract_location(text_content),
            participation=self._extract_participation(text_content),
            cost=self._extract_cost(text_content),
            prize=self._extract_prize(text_content),
            eligibility=self._extract_eligibility(text_content),
            requirements=self._extract_requirements(text_content),
            relevant_skills=self._extract_skills(text_content),
            description=self._extract_description(text_content),
            raw_content=text_content
        )
    
    def _extract_title(self, text: str) -> Optional[str]:
        """Extract title from text content."""
        lines = text.split('\n')
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if line and len(line) < 200 and not line.startswith('#'):
                return line
        return None
    
    def _extract_organization(self, text: str) -> Optional[str]:
        """Extract organization name from text content."""
        # Simple heuristic - look for organization patterns
        import re
        patterns = [
            r'organized by ([^.]+)',
            r'hosted by ([^.]+)',
            r'sponsored by ([^.]+)',
            r'presented by ([^.]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_deadline(self, text: str) -> Optional[str]:
        """Extract deadline from text content."""
        import re
        patterns = [
            r'deadline[:\s]+([^\n]+)',
            r'application deadline[:\s]+([^\n]+)',
            r'due by[:\s]+([^\n]+)',
            r'ends[:\s]+([^\n]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text content."""
        import re
        patterns = [
            r'location[:\s]+([^\n]+)',
            r'venue[:\s]+([^\n]+)',
            r'where[:\s]+([^\n]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_participation(self, text: str) -> Optional[str]:
        """Extract participation type from text content."""
        text_lower = text.lower()
        if 'individual' in text_lower and 'team' in text_lower:
            return 'either'
        elif 'individual' in text_lower:
            return 'individual'
        elif 'team' in text_lower:
            return 'team'
        return None
    
    def _extract_cost(self, text: str) -> Optional[str]:
        """Extract cost information from text content."""
        text_lower = text.lower()
        if 'free' in text_lower or 'no cost' in text_lower or 'no fee' in text_lower:
            return 'free'
        elif '$' in text or 'fee' in text_lower or 'cost' in text_lower:
            return 'paid'
        return None
    
    def _extract_prize(self, text: str) -> Optional[str]:
        """Extract prize information from text content."""
        import re
        patterns = [
            r'prize[:\s]+([^\n]+)',
            r'award[:\s]+([^\n]+)',
            r'grand prize[:\s]+([^\n]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_eligibility(self, text: str) -> List[str]:
        """Extract eligibility requirements from text content."""
        import re
        eligibility = []
        
        patterns = [
            r'eligibility[:\s]+([^\n]+)',
            r'requirements[:\s]+([^\n]+)',
            r'who can apply[:\s]+([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Split by common delimiters
                items = re.split(r'[,;•\n]', match.group(1))
                eligibility.extend([item.strip() for item in items if item.strip()])
        
        return eligibility[:5]  # Limit to top 5 items
    
    def _extract_requirements(self, text: str) -> List[str]:
        """Extract requirements from text content."""
        import re
        requirements = []
        
        patterns = [
            r'requirements[:\s]+([^\n]+)',
            r'what you need[:\s]+([^\n]+)',
            r'submission requirements[:\s]+([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                items = re.split(r'[,;•\n]', match.group(1))
                requirements.extend([item.strip() for item in items if item.strip()])
        
        return requirements[:5]
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract relevant skills from text content."""
        # Common technical skills to look for
        skill_keywords = [
            'python', 'javascript', 'react', 'node', 'java', 'machine learning',
            'ai', 'data science', 'web development', 'mobile', 'cloud',
            'aws', 'google cloud', 'azure', 'docker', 'kubernetes', 'git'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in skill_keywords:
            if skill in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_description(self, text: str) -> Optional[str]:
        """Extract description from text content."""
        # Get first substantial paragraph
        paragraphs = text.split('\n\n')
        for para in paragraphs:
            para = para.strip()
            if len(para) > 50 and len(para) < 500:
                return para
        return None
