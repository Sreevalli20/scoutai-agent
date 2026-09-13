# ScoutAI Backend

Autonomous opportunity research agent backend built with FastAPI, Anakin API, and Groq API.

## Tech Stack

- **Python**: 3.14.6
- **Web Framework**: FastAPI
- **Server**: Uvicorn
- **HTTP Client**: httpx
- **Data Validation**: Pydantic
- **AI Services**: 
  - Anakin API (web discovery/scraping)
  - Groq API (reasoning/evaluation)
- **Testing**: pytest

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration and settings
│   ├── models/
│   │   └── schemas.py          # Pydantic models and schemas
│   ├── routes/
│   │   ├── health.py           # Health check endpoint
│   │   └── research.py         # Research endpoints
│   ├── services/
│   │   ├── anakin.py           # Anakin API service
│   │   ├── groq.py             # Groq API service
│   │   ├── scoring.py          # Scoring service
│   │   └── agent.py            # Agent pipeline orchestrator
│   └── store/
│       └── research.py         # In-memory research store
├── tests/
│   ├── conftest.py             # Pytest configuration
│   ├── test_health.py          # Health endpoint tests
│   ├── test_research.py        # Research endpoint tests
│   ├── test_scoring.py         # Scoring service tests
│   └── test_manual_integration.py  # Manual integration tests
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
├── pytest.ini                  # Pytest configuration
├── MANIFEST.in                 # Package manifest
└── README.md                   # This file
```

## Installation

### Prerequisites

- Python 3.14.6
- pip (Python package manager)

### Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```

5. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

6. Edit `.env` and add your API keys:
   ```
   ANAKIN_API_KEY=your_anakin_api_key
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama3-70b-8192
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

## Running Locally

### Development Mode

Start the server with auto-reload:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode

Start the server without auto-reload:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Using PORT Environment Variable

The server respects the `PORT` environment variable (useful for deployment):
```bash
export PORT=8080
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns service health status

### Create Research
- **POST** `/api/research`
- Submit a research request
- Returns research ID for polling

### Research Status
- **GET** `/api/research/{research_id}/status`
- Poll research status and results
- Returns current status, progress, and results when complete

## API Contract

The backend implements the following API contract expected by the frontend:

### POST /api/research

**Request:**
```json
{
  "query": "string",
  "profile": {
    "country": "string",
    "skills": ["string"],
    "experience": "string",
    "education_status": "string"
  },
  "filters": {
    "types": ["hackathon", "internship", etc.],
    "location": "string",
    "participation": "individual|team|either",
    "cost": "free|paid|either",
    "deadline": "string",
    "skills": ["string"]
  }
}
```

**Response:**
```json
{
  "research_id": "uuid",
  "status": "queued"
}
```

### GET /api/research/{research_id}/status

**Response (in progress):**
```json
{
  "research_id": "string",
  "status": "queued|discovering|reading|reasoning|ranking|completed|failed",
  "progress": {
    "discover": "pending|active|completed|failed",
    "read": "pending|active|completed|failed",
    "reason": "pending|active|completed|failed",
    "rank": "pending|active|completed|failed",
    "act": "pending|active|completed|failed"
  },
  "result": null
}
```

**Response (completed):**
```json
{
  "research_id": "string",
  "status": "completed",
  "progress": {
    "discover": "completed",
    "read": "completed",
    "reason": "completed",
    "rank": "completed",
    "act": "completed"
  },
  "result": {
    "summary": {
      "evaluated": 0,
      "matches": 0,
      "timestamp": "ISO-8601"
    },
    "opportunities": []
  }
}
```

## Testing

### Run Unit Tests (with mocks)
```bash
pytest tests/ -v -m "not manual"
```

### Run Manual Integration Tests (requires real API keys)
```bash
pytest tests/test_manual_integration.py -v -m manual
```

### Run All Tests
```bash
pytest tests/ -v
```

### Run Manual Test Script
```bash
python tests/test_manual_integration.py
```

See [MANUAL_TESTING.md](MANUAL_TESTING.md) for detailed manual testing instructions.

## Agent Pipeline

The backend implements a READ → REASON → ACT workflow:

1. **DISCOVER**: Use Anakin to search for relevant opportunities
2. **READ**: Use Anakin to scrape detailed content from discovered URLs
3. **REASON**: Use Groq to evaluate each opportunity against user criteria
4. **RANK**: Use scoring service to rank opportunities by match score
5. **ACT**: Generate actionable recommendations and checklists

## Scoring Framework

The scoring service uses a transparent, rule-based framework with the following weights:

- Query relevance: 25%
- Eligibility: 20%
- Skill alignment: 15%
- Location compatibility: 10%
- Participation compatibility: 10%
- Cost compatibility: 10%
- Deadline viability: 10%

This is combined with AI-based evaluation from Groq for a final match score.

## Deployment

### Render Deployment

The backend is prepared for deployment to Render. The start command will be:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

#### Environment Variables on Render

Set these in your Render dashboard:

- `ANAKIN_API_KEY`: Your Anakin API key
- `GROQ_API_KEY`: Your Groq API key
- `GROQ_MODEL`: `llama3-70b-8192`
- `CORS_ORIGINS`: Your frontend domain (e.g., `https://your-frontend.vercel.app`)
- `PORT`: (Set automatically by Render)
- `ENVIRONMENT`: `production`

## Security Notes

- **Never commit `.env` files** with real API keys
- **Never expose API keys in logs** or error messages
- **Use CORS properly** - restrict origins in production
- **Keep dependencies updated** for security patches
- **API keys are server-side only** - never sent to frontend

## Troubleshooting

### Import Errors
- Ensure you're running from the backend directory
- Activate your virtual environment
- Verify dependencies are installed

### API Key Errors
- Check `.env` file exists and contains valid keys
- Verify keys have sufficient credits/quota
- Ensure keys are not expired

### Timeout Errors
- Increase timeout values in `app/config.py`
- Check internet connection
- Verify external services are operational

### CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL
- For local testing, include `http://localhost:3000`

## Architecture Notes

### In-Memory Store
The current implementation uses an in-memory research store for the hackathon prototype. This can be replaced with a proper database (PostgreSQL, etc.) for production without changing the service interfaces.

### Service Design
All services are designed to be easily replaceable:
- `AnakinService` can be swapped for other web scraping APIs
- `GroqService` can use different models or providers
- `ScoringService` can be enhanced with ML models
- `ResearchStore` can be replaced with database implementations

### Error Handling
The backend implements comprehensive error handling:
- Graceful degradation on partial failures
- User-safe error messages (no stack traces or secrets)
- Proper HTTP status codes
- Detailed logging for debugging

## Development

### Adding New Features

1. Add models to `app/models/schemas.py`
2. Implement service logic in `app/services/`
3. Create routes in `app/routes/`
4. Add tests in `tests/`
5. Update API documentation

### Code Style

- Follow PEP 8 guidelines
- Use type hints where appropriate
- Write docstrings for functions and classes
- Keep functions focused and modular

## License

This backend is part of the ScoutAI project.

## Support

For issues or questions, please refer to the main project documentation.
