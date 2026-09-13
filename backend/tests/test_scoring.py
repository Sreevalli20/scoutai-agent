import pytest
from app.services.scoring import ScoringService
from app.models.schemas import WebContent


@pytest.fixture
def scoring_service():
    """Create a scoring service instance."""
    return ScoringService()


@pytest.fixture
def sample_web_content():
    """Create sample web content for testing."""
    return WebContent(
        title="AI Hackathon 2026",
        organization="Tech Corp",
        source_url="https://example.com/hackathon",
        deadline="2026-12-31",
        location="Remote",
        participation="individual",
        cost="free",
        prize="$10,000",
        eligibility=["Open to students worldwide"],
        requirements=["Python", "Machine Learning"],
        relevant_skills=["Python", "Machine Learning", "AI"],
        description="A hackathon focused on AI and machine learning projects."
    )


def test_calculate_match_score(scoring_service, sample_web_content):
    """Test calculating match score for an opportunity."""
    user_query = "Find free AI hackathons"
    user_profile = {
        "country": "India",
        "skills": ["Python", "Machine Learning"],
        "experience": "student",
        "education_status": "undergraduate"
    }
    user_filters = {
        "types": ["hackathon"],
        "location": "any",
        "participation": "individual",
        "cost": "free",
        "deadline": "any",
        "skills": ["Python"]
    }
    
    scores = scoring_service.calculate_match_score(
        sample_web_content,
        user_query,
        user_profile,
        user_filters
    )
    
    assert "match_score" in scores
    assert 0 <= scores["match_score"] <= 100
    assert "query_relevance" in scores
    assert "eligibility" in scores
    assert "skill_alignment" in scores


def test_score_query_relevance(scoring_service, sample_web_content):
    """Test query relevance scoring."""
    score = scoring_service._score_query_relevance(
        sample_web_content,
        "Find free AI hackathons"
    )
    assert 0 <= score <= 100


def test_score_skill_alignment(scoring_service, sample_web_content):
    """Test skill alignment scoring."""
    user_profile = {"skills": ["Python", "Machine Learning", "AI"]}
    score = scoring_service._score_skill_alignment(sample_web_content, user_profile)
    assert 0 <= score <= 100
    assert score > 70


def test_score_cost_compatibility(scoring_service, sample_web_content):
    """Test cost compatibility scoring."""
    user_filters = {"cost": "free"}
    score = scoring_service._score_cost_compatibility(sample_web_content, user_filters)
    assert 0 <= score <= 100
    assert score > 80


def test_get_score_explanation(scoring_service):
    """Test generating score explanation."""
    scores = {
        "query_relevance": 85,
        "eligibility": 90,
        "skill_alignment": 75,
        "location_compatibility": 100,
        "participation_compatibility": 100,
        "cost_compatibility": 100,
        "deadline_viability": 80,
        "match_score": 88
    }
    explanation = scoring_service.get_score_explanation(scores)
    assert "Query Relevance" in explanation
    assert "excellent" in explanation
    assert "Overall Match Score" in explanation
