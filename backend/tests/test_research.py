import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_create_research(client):
    """Test creating a research request."""
    request_data = {
        "query": "Find free AI hackathons in India",
        "profile": {
            "country": "India",
            "skills": ["Python", "Machine Learning"],
            "experience": "student",
            "education_status": "undergraduate"
        },
        "filters": {
            "types": ["hackathon"],
            "location": "India",
            "participation": "individual",
            "cost": "free",
            "deadline": "any",
            "skills": ["Python"]
        }
    }
    
    with patch('app.routes.research.agent_pipeline') as mock_pipeline:
        mock_pipeline.execute_research = MagicMock(return_value=None)
        
        response = client.post("/api/research", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "research_id" in data
        assert data["status"] == "queued"


def test_create_research_invalid_request(client):
    """Test creating a research request with invalid data."""
    request_data = {
        "profile": {
            "country": "India",
            "skills": [],
            "experience": "student",
            "education_status": "undergraduate"
        },
        "filters": {
            "types": [],
            "location": "India",
            "participation": "individual",
            "cost": "free",
            "deadline": "any",
            "skills": []
        }
    }
    # Missing required 'query' field
    
    response = client.post("/api/research", json=request_data)
    # Pydantic validation should fail for missing required field
    assert response.status_code == 422


def test_get_research_status_not_found(client):
    """Test getting status for a non-existent research ID."""
    response = client.get("/api/research/nonexistent-id/status")
    assert response.status_code == 404


def test_get_research_status_valid(client):
    """Test getting status for a valid research ID."""
    request_data = {
        "query": "Find free AI hackathons in India",
        "profile": {
            "country": "India",
            "skills": ["Python"],
            "experience": "student",
            "education_status": "undergraduate"
        },
        "filters": {
            "types": ["hackathon"],
            "location": "India",
            "participation": "individual",
            "cost": "free",
            "deadline": "any",
            "skills": []
        }
    }
    
    with patch('app.routes.research.agent_pipeline') as mock_pipeline:
        mock_pipeline.execute_research = MagicMock(return_value=None)
        
        create_response = client.post("/api/research", json=request_data)
        research_id = create_response.json()["research_id"]
        
        status_response = client.get(f"/api/research/{research_id}/status")
        
        assert status_response.status_code == 200
        data = status_response.json()
        assert data["research_id"] == research_id
        assert "status" in data
        assert "progress" in data
