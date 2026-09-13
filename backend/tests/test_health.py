import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_health_endpoint(client):
    """Test the health check endpoint."""
    response = client.get("/api/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "scoutai-backend"


def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ScoutAI Backend"
    assert "endpoints" in data
