import logging
import json
from typing import List, Dict, Any, Optional
from groq import AsyncGroq
from app.config import get_settings
from app.models.schemas import WebContent, GroqEvaluation

logger = logging.getLogger(__name__)


class GroqService:
    """Service for interacting with Groq API for reasoning and evaluation."""
    
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.groq_api_key
        self.model = self.settings.groq_model
        self.timeout = self.settings.groq_timeout
        
        # Validate API key is present
        if not self.api_key:
            logger.warning("Groq API key not configured - service will fail on actual API calls")
        
        # Initialize async Groq client
        self.client = AsyncGroq(api_key=self.api_key)
    
    def _create_evaluation_prompt(
        self,
        web_content: WebContent,
        user_query: str,
        user_profile: Dict[str, Any],
        user_filters: Dict[str, Any]
    ) -> str:
        """
        Create a structured prompt for Groq to evaluate an opportunity.
        
        Args:
            web_content: Normalized web content from Anakin
            user_query: Original user research query
            user_profile: User's profile information
            user_filters: User's filter preferences
            
        Returns:
            Structured prompt for Groq evaluation
        """
        prompt = f"""You are an expert opportunity evaluator for ScoutAI. Your task is to evaluate a single opportunity based on the user's query, profile, and filters.

## User's Research Query
{user_query}

## User Profile
- Country: {user_profile.get('country', 'Not specified')}
- Skills: {', '.join(user_profile.get('skills', []))}
- Experience: {user_profile.get('experience', 'Not specified')}
- Education Status: {user_profile.get('education_status', 'Not specified')}

## User Filters
- Opportunity Types: {', '.join(user_filters.get('types', []))}
- Location: {user_filters.get('location', 'Not specified')}
- Participation: {user_filters.get('participation', 'Not specified')}
- Cost: {user_filters.get('cost', 'Not specified')}
- Deadline: {user_filters.get('deadline', 'Not specified')}
- Required Skills: {', '.join(user_filters.get('skills', []))}

## Opportunity Information
- Name: {web_content.title or 'Unknown'}
- Organization: {web_content.organization or 'Unknown'}
- URL: {web_content.source_url}
- Deadline: {web_content.deadline or 'Unknown'}
- Location: {web_content.location or 'Unknown'}
- Participation: {web_content.participation or 'Unknown'}
- Cost: {web_content.cost or 'Unknown'}
- Prize: {web_content.prize or 'Unknown'}
- Eligibility: {', '.join(web_content.eligibility or [])}
- Requirements: {', '.join(web_content.requirements or [])}
- Relevant Skills: {', '.join(web_content.relevant_skills or [])}
- Description: {web_content.description or 'No description available'}

## Your Task
Evaluate this opportunity based on the user's query, profile, and filters. You must:

1. **NEVER invent facts** - Only use information that is explicitly stated in the opportunity information or can be reasonably inferred. If information is missing, mark it as "unknown" or "not specified".

2. **Score each dimension** (0-100):
   - Query relevance: How well does this match the user's research query?
   - Eligibility: Is the user eligible based on the opportunity's requirements?
   - Skill alignment: How well do the user's skills match the opportunity's requirements?
   - Location compatibility: Is the location compatible with the user's preferences?
   - Participation compatibility: Does the participation type match the user's preference?
   - Cost compatibility: Is the cost structure compatible with the user's preference?
   - Deadline viability: Is the deadline reasonable and achievable?

3. **Calculate overall match score** (0-100) based on the weighted average of the above dimensions.

4. **Provide reasoning** for your evaluation, highlighting key factors that influenced your decision.

5. **Identify concerns** - Any potential issues, red flags, or missing information that the user should be aware of.

6. **Identify strong matches** - Specific aspects where this opportunity is an excellent fit for the user.

7. **Generate a recommendation** - A brief, actionable recommendation (e.g., "Highly recommended - excellent skill match and location compatibility").

8. **Create a practical checklist** - 3-5 specific actions the user should take to apply or participate, based on the actual opportunity requirements.

## Response Format
Provide your response as a JSON object with this exact structure:
{{
  "relevance": <number 0-100>,
  "eligibility": <number 0-100>,
  "skill_alignment": <number 0-100>,
  "location_compatibility": <number 0-100>,
  "participation_compatibility": <number 0-100>,
  "cost_compatibility": <number 0-100>,
  "deadline_viability": <number 0-100>,
  "match_score": <number 0-100>,
  "reasoning": "<string>",
  "concerns": ["<string>", ...],
  "strong_matches": ["<string>", ...],
  "recommendation": "<string>",
  "checklist": ["<string>", ...]
}}

Remember: Be honest about missing information. If a field is not specified in the opportunity information, do not make assumptions about it."""

        return prompt
    
    async def evaluate_opportunity(
        self,
        web_content: WebContent,
        user_query: str,
        user_profile: Dict[str, Any],
        user_filters: Dict[str, Any]
    ) -> GroqEvaluation:
        """
        Evaluate an opportunity using Groq for reasoning.
        
        Args:
            web_content: Normalized web content from Anakin
            user_query: Original user research query
            user_profile: User's profile information
            user_filters: User's filter preferences
            
        Returns:
            Structured evaluation from Groq
            
        Raises:
            Exception: If the Groq API call fails
        """
        prompt = self._create_evaluation_prompt(web_content, user_query, user_profile, user_filters)
        
        try:
            logger.info(f"Evaluating opportunity: {web_content.title or web_content.source_url}")
            
            response = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert opportunity evaluator who provides honest, fact-based assessments. Never invent information that is not present in the source material. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.3,  # Lower temperature for more consistent, factual responses
                max_tokens=2000
            )
            
            # Extract the response content
            content = response.choices[0].message.content
            
            if not content:
                raise ValueError("Empty response from Groq")
            
            # Parse JSON response - handle markdown code blocks
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            evaluation_data = json.loads(content)
            
            # Validate and create GroqEvaluation object
            evaluation = GroqEvaluation(**evaluation_data)
            
            logger.info(f"Evaluation complete for {web_content.title or web_content.source_url} - Match score: {evaluation.match_score}")
            
            return evaluation
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Groq response as JSON: {e}")
            logger.error(f"Response content: {content}")
            raise ValueError(f"Invalid JSON response from Groq: {e}")
        except Exception as e:
            logger.error(f"Groq evaluation error: {str(e)}")
            raise
    
    async def rank_opportunities(
        self,
        evaluations: List[GroqEvaluation]
    ) -> List[GroqEvaluation]:
        """
        Rank opportunities by their match scores.
        
        Args:
            evaluations: List of opportunity evaluations
            
        Returns:
            Sorted list of evaluations, highest match score first
        """
        # Sort by match score descending
        ranked = sorted(evaluations, key=lambda x: x.match_score, reverse=True)
        
        logger.info(f"Ranked {len(ranked)} opportunities by match score")
        
        return ranked
    
    async def generate_summary(
        self,
        evaluations: List[GroqEvaluation],
        user_query: str
    ) -> str:
        """
        Generate a summary of the research results.
        
        Args:
            evaluations: List of opportunity evaluations
            user_query: Original user research query
            
        Returns:
            Summary text
        """
        if not evaluations:
            return f"No opportunities found matching your query: {user_query}"
        
        total_evaluated = len(evaluations)
        high_matches = sum(1 for e in evaluations if e.match_score >= 70)
        medium_matches = sum(1 for e in evaluations if 50 <= e.match_score < 70)
        
        summary = f"""Research Summary for: {user_query}

Total opportunities evaluated: {total_evaluated}
- High match (70+ score): {high_matches}
- Medium match (50-69 score): {medium_matches}
- Low match (<50 score): {total_evaluated - high_matches - medium_matches}

Top opportunity: {evaluations[0].match_score}/100 match score
{evaluations[0].recommendation}"""
        
        return summary
    
    async def create_opportunity_from_evaluation(
        self,
        web_content: WebContent,
        evaluation: GroqEvaluation,
        opportunity_id: str
    ) -> Dict[str, Any]:
        """
        Create a structured opportunity object from web content and evaluation.
        
        Args:
            web_content: Normalized web content
            evaluation: Groq evaluation results
            opportunity_id: Unique ID for the opportunity
            
        Returns:
            Structured opportunity dictionary compatible with frontend
        """
        from app.models.schemas import ActionPlan
        
        opportunity = {
            "id": opportunity_id,
            "name": web_content.title or "Unknown Opportunity",
            "organization": web_content.organization or "Unknown Organization",
            "url": web_content.source_url,
            "deadline": web_content.deadline,
            "location": web_content.location,
            "participation": web_content.participation,
            "cost": web_content.cost,
            "prize": web_content.prize,
            "eligibility": web_content.eligibility or [],
            "skills": web_content.relevant_skills or [],
            "match_score": evaluation.match_score,
            "reasoning": evaluation.reasoning,
            "strong_matches": evaluation.strong_matches,
            "concerns": evaluation.concerns,
            "description": web_content.description,
            "requirements": web_content.requirements,
            "action_plan": {
                "recommendation": evaluation.recommendation,
                "checklist": evaluation.checklist
            }
        }
        
        return opportunity
