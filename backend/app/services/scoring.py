import logging
from typing import Dict, Any, List
from app.models.schemas import WebContent, GroqEvaluation

logger = logging.getLogger(__name__)


class ScoringService:
    """Service for calculating transparent opportunity match scores."""
    
    # Scoring weights - these define how important each dimension is
    WEIGHTS = {
        "query_relevance": 0.25,      # How well it matches the user's query
        "eligibility": 0.20,          # Whether the user is eligible
        "skill_alignment": 0.15,      # How well skills match
        "location_compatibility": 0.10, # Location fit
        "participation_compatibility": 0.10, # Individual/team fit
        "cost_compatibility": 0.10,   # Free/paid fit
        "deadline_viability": 0.10    # Time feasibility
    }
    
    def __init__(self):
        """Initialize the scoring service."""
        logger.info("ScoringService initialized with weights: %s", self.WEIGHTS)
    
    def calculate_match_score(
        self,
        web_content: WebContent,
        user_query: str,
        user_profile: Dict[str, Any],
        user_filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate a transparent match score for an opportunity.
        
        This provides a rule-based scoring framework that complements
        the AI-based evaluation from Groq. It's more deterministic and
        transparent, making it easier to understand why something scored
        the way it did.
        
        Args:
            web_content: Normalized web content from Anakin
            user_query: Original user research query
            user_profile: User's profile information
            user_filters: User's filter preferences
            
        Returns:
            Dictionary with individual dimension scores and overall match score
        """
        scores = {}
        
        # Calculate individual dimension scores
        scores["query_relevance"] = self._score_query_relevance(web_content, user_query)
        scores["eligibility"] = self._score_eligibility(web_content, user_profile)
        scores["skill_alignment"] = self._score_skill_alignment(web_content, user_profile)
        scores["location_compatibility"] = self._score_location_compatibility(web_content, user_filters)
        scores["participation_compatibility"] = self._score_participation_compatibility(web_content, user_filters)
        scores["cost_compatibility"] = self._score_cost_compatibility(web_content, user_filters)
        scores["deadline_viability"] = self._score_deadline_viability(web_content, user_filters)
        
        # Calculate weighted overall score
        overall_score = sum(
            scores[dim] * self.WEIGHTS[dim]
            for dim in self.WEIGHTS.keys()
        )
        
        scores["match_score"] = round(overall_score, 1)
        
        logger.debug(f"Calculated scores for {web_content.title or web_content.source_url}: {scores}")
        
        return scores
    
    def _score_query_relevance(self, web_content: WebContent, user_query: str) -> int:
        """
        Score how well the opportunity matches the user's query (0-100).
        
        This is a basic keyword matching approach. In production, you'd want
        more sophisticated semantic matching.
        """
        if not web_content.title and not web_content.description:
            return 30  # Low score if no content to match
        
        query_lower = user_query.lower()
        content_parts = [
            web_content.title or "",
            web_content.description or "",
            web_content.organization or "",
            " ".join(web_content.eligibility or []),
            " ".join(web_content.requirements or []),
            " ".join(web_content.relevant_skills or [])
        ]
        
        content_text = " ".join(content_parts).lower()
        
        # Count query term matches
        query_terms = [term for term in query_lower.split() if len(term) > 2]
        matches = sum(1 for term in query_terms if term in content_text)
        
        if not query_terms:
            return 50  # Neutral score if no meaningful query terms
        
        # Calculate match ratio
        match_ratio = matches / len(query_terms)
        
        # Convert to 0-100 score
        score = int(match_ratio * 100)
        
        # Boost if key terms are present
        if any(term in query_lower for term in ["hackathon", "competition", "internship", "scholarship"]):
            score = min(score + 20, 100)
        
        return score
    
    def _score_eligibility(self, web_content: WebContent, user_profile: Dict[str, Any]) -> int:
        """
        Score eligibility based on user profile (0-100).
        
        This checks if the user meets basic eligibility requirements.
        """
        if not web_content.eligibility:
            return 50  # Neutral score if no eligibility info
        
        user_country = user_profile.get("country", "").lower()
        user_experience = user_profile.get("experience", "").lower()
        user_education = user_profile.get("education_status", "").lower()
        
        eligibility_text = " ".join(web_content.eligibility).lower()
        
        score = 70  # Start with a baseline score
        
        # Check country restrictions
        if user_country and any(country in eligibility_text for country in ["us only", "united states only", "usa only"]):
            if user_country not in ["us", "usa", "united states"]:
                score -= 30  # Penalize if user is not in US and opportunity is US-only
        
        # Check experience level
        if user_experience:
            if "student" in user_experience and "student" in eligibility_text:
                score += 20  # Boost if user is student and opportunity targets students
            elif "experienced" in user_experience and "student" in eligibility_text:
                score -= 20  # Penalize if user is experienced but opportunity is for students
        
        # Check education status
        if user_education:
            if "undergraduate" in user_education and "undergraduate" in eligibility_text:
                score += 15
            elif "graduate" in user_education and "graduate" in eligibility_text:
                score += 15
        
        return max(0, min(score, 100))
    
    def _score_skill_alignment(self, web_content: WebContent, user_profile: Dict[str, Any]) -> int:
        """
        Score how well user skills match opportunity requirements (0-100).
        
        This measures the overlap between user skills and required/relevant skills.
        """
        user_skills = [skill.lower() for skill in user_profile.get("skills", [])]
        required_skills = [skill.lower() for skill in (web_content.relevant_skills or [])]
        
        if not user_skills or not required_skills:
            return 50  # Neutral score if no skill information
        
        # Calculate skill overlap
        matches = sum(1 for skill in user_skills if any(skill in req_skill for req_skill in required_skills))
        
        if not user_skills:
            return 50
        
        # Calculate match ratio
        match_ratio = matches / len(user_skills)
        
        # Convert to 0-100 score
        score = int(match_ratio * 100)
        
        # Boost if user has multiple matching skills
        if matches >= 2:
            score = min(score + 15, 100)
        
        return score
    
    def _score_location_compatibility(self, web_content: WebContent, user_filters: Dict[str, Any]) -> int:
        """
        Score location compatibility (0-100).
        
        This checks if the opportunity location matches user preferences.
        """
        preferred_location = user_filters.get("location", "").lower()
        opportunity_location = (web_content.location or "").lower()
        
        if not preferred_location or preferred_location == "any":
            return 100  # Full score if no location preference
        
        if not opportunity_location:
            return 50  # Neutral score if no location info
        
        # Check for exact match
        if preferred_location in opportunity_location:
            return 100
        
        # Check for remote compatibility
        if "remote" in preferred_location and "remote" in opportunity_location:
            return 100
        
        # Check for country match
        if preferred_location in opportunity_location or opportunity_location in preferred_location:
            return 80
        
        # Check for regional match
        if any(region in opportunity_location for region in ["north america", "europe", "asia", "global"]):
            return 60
        
        return 30  # Low score if location doesn't match
    
    def _score_participation_compatibility(self, web_content: WebContent, user_filters: Dict[str, Any]) -> int:
        """
        Score participation type compatibility (0-100).
        
        This checks if the participation type matches user preferences.
        """
        preferred_participation = user_filters.get("participation", "").lower()
        opportunity_participation = (web_content.participation or "").lower()
        
        if not preferred_participation or preferred_participation == "either":
            return 100  # Full score if no participation preference
        
        if not opportunity_participation:
            return 50  # Neutral score if no participation info
        
        # Check for exact match
        if preferred_participation in opportunity_participation:
            return 100
        
        # Check if opportunity accepts both
        if "either" in opportunity_participation or "both" in opportunity_participation:
            return 100
        
        # Check if opportunity allows individual when user prefers individual
        if preferred_participation == "individual" and "individual" in opportunity_participation:
            return 100
        
        # Check if opportunity allows team when user prefers team
        if preferred_participation == "team" and "team" in opportunity_participation:
            return 100
        
        return 30  # Low score if participation type doesn't match
    
    def _score_cost_compatibility(self, web_content: WebContent, user_filters: Dict[str, Any]) -> int:
        """
        Score cost compatibility (0-100).
        
        This checks if the cost structure matches user preferences.
        """
        preferred_cost = user_filters.get("cost", "").lower()
        opportunity_cost = (web_content.cost or "").lower()
        
        if not preferred_cost or preferred_cost == "either":
            return 100  # Full score if no cost preference
        
        if not opportunity_cost:
            return 50  # Neutral score if no cost info
        
        # Check for free preference
        if preferred_cost == "free":
            if "free" in opportunity_cost or "no cost" in opportunity_cost or "no fee" in opportunity_cost:
                return 100
            else:
                return 20  # Low score if user wants free but opportunity costs
        
        # Check for paid preference
        if preferred_cost == "paid":
            if "$" in opportunity_cost or "fee" in opportunity_cost or "cost" in opportunity_cost:
                return 100
            else:
                return 50  # Neutral score if user is okay with paid but opportunity is free
        
        return 50
    
    def _score_deadline_viability(self, web_content: WebContent, user_filters: Dict[str, Any]) -> int:
        """
        Score deadline viability (0-100).
        
        This checks if the deadline is reasonable and achievable.
        """
        deadline_filter = user_filters.get("deadline", "").lower()
        opportunity_deadline = web_content.deadline
        
        if not opportunity_deadline:
            return 50  # Neutral score if no deadline info
        
        # This is a simplified check - in production, you'd parse the actual date
        # and calculate time remaining
        
        # Check if deadline is mentioned at all
        if opportunity_deadline:
            score = 70  # Baseline score for having a deadline
            
            # Penalize if deadline seems very short (basic heuristic)
            if any(term in opportunity_deadline.lower() for term in ["tomorrow", "24 hours", "2 days"]):
                score -= 30  # Penalize very short deadlines
            
            # Boost if deadline seems reasonable
            if any(term in opportunity_deadline.lower() for term in ["month", "weeks", "2026", "2027"]):
                score += 20
            
            return max(0, min(score, 100))
        
        return 50
    
    def combine_scores(
        self,
        rule_based_scores: Dict[str, Any],
        ai_evaluation: GroqEvaluation
    ) -> int:
        """
        Combine rule-based scores with AI evaluation for a final score.
        
        This takes a weighted average of the transparent rule-based scoring
        and the AI's more nuanced evaluation.
        
        Args:
            rule_based_scores: Scores from the rule-based scoring system
            ai_evaluation: Evaluation from Groq
            
        Returns:
            Final combined match score (0-100)
        """
        # Weights for combining the two approaches
        rule_weight = 0.4  # 40% weight to rule-based scoring
        ai_weight = 0.6    # 60% weight to AI evaluation
        
        rule_score = rule_based_scores.get("match_score", 50)
        ai_score = ai_evaluation.match_score
        
        # Calculate weighted average
        final_score = (rule_score * rule_weight) + (ai_score * ai_weight)
        
        return round(final_score, 1)
    
    def get_score_explanation(self, scores: Dict[str, Any]) -> str:
        """
        Generate a human-readable explanation of the scoring.
        
        Args:
            scores: Dictionary of individual dimension scores
            
        Returns:
            Human-readable explanation
        """
        explanations = []
        
        for dimension, score in scores.items():
            if dimension == "match_score":
                continue
            
            dimension_name = dimension.replace("_", " ").title()
            
            if score >= 80:
                assessment = "excellent"
            elif score >= 60:
                assessment = "good"
            elif score >= 40:
                assessment = "moderate"
            else:
                assessment = "poor"
            
            explanations.append(f"{dimension_name}: {assessment} ({score}/100)")
        
        overall = scores.get("match_score", 0)
        explanations.append(f"Overall Match Score: {overall}/100")
        
        return "\n".join(explanations)
