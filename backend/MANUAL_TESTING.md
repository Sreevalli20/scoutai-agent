# Manual Integration Testing Guide

This guide provides instructions for manually testing the ScoutAI backend with real API keys.

## Prerequisites

1. Python 3.14.6 installed
2. Backend dependencies installed: `pip install -r requirements.txt`
3. Valid Anakin API key
4. Valid Groq API key

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your real API keys:
   ```
   ANAKIN_API_KEY=your_actual_anakin_key
   GROQ_API_KEY=your_actual_groq_key
   GROQ_MODEL=llama3-70b-8192
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

## Running Manual Tests

### Option 1: Run the manual test file directly

```bash
cd backend
python tests/test_manual_integration.py
```

Or from the project root:
```bash
python backend/tests/test_manual_integration.py
```

This will run:
- Scoring service logic test (no API calls)
- Anakin search test (consumes Anakin credits)
- Anakin scrape test (consumes Anakin credits)
- Groq evaluation test (consumes Groq credits)

### Option 2: Run with pytest (manual tests only)

```bash
cd backend
pytest tests/test_manual_integration.py -v -m manual
```

Or from the project root:
```bash
pytest backend/tests/test_manual_integration.py -v -m manual
```

### Option 3: Run all tests (unit + manual)

```bash
cd backend
pytest tests/ -v
```

Or from the project root:
```bash
pytest backend/tests/ -v
```

Note: This will run both unit tests (with mocks) and manual tests (with real API calls).

## Expected Results

### Scoring Service Test
- Should complete without API calls
- Should output a match score between 0-100
- Expected output: `✓ Scoring service working - Match score: XX`

### Anakin Search Test
- Should return 5 search results
- Each result should contain a URL
- Expected output: `✓ Anakin search returned 5 results`

### Anakin Scrape Test
- Should successfully scrape example.com
- Should return markdown or HTML content
- Expected output: `✓ Anakin scrape successful for https://example.com`

### Groq Evaluation Test
- Should evaluate a sample opportunity
- Should return a match score between 0-100
- Should include reasoning text
- Expected output: `✓ Groq evaluation successful - Match score: XX`

## Testing the Full Pipeline

To test the complete READ → REASON → ACT workflow:

1. Start the backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. In another terminal, make a test request:
   ```bash
   curl -X POST http://localhost:8000/api/research \
     -H "Content-Type: application/json" \
     -d '{
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
     }'
   ```

3. Note the `research_id` from the response

4. Poll the status endpoint:
   ```bash
   curl http://localhost:8000/api/research/{research_id}/status
   ```

5. Wait for the status to become `completed` or `failed`

6. When completed, the response will include `result.opportunities` with evaluated opportunities

## Troubleshooting

### API Key Errors
- Verify your API keys are correct in `.env`
- Ensure your keys have sufficient credits/quota
- Check that the keys are not expired

### Timeout Errors
- Increase timeout values in `app/config.py` if needed
- Check your internet connection
- Verify Anakin/Groq services are operational

### Import Errors
- Ensure you're running from the backend directory
- Verify dependencies are installed: `pip install -r requirements.txt`
- Check Python version is 3.14.6: `python --version`

### CORS Errors
- Verify `CORS_ORIGINS` in `.env` includes your frontend URL
- For local testing, ensure `http://localhost:3000` is included

## Cost Considerations

- Anakin API: Each search/scrape call consumes credits
- Groq API: Each evaluation consumes tokens
- Manual tests will make multiple API calls
- Monitor your usage on Anakin and Groq dashboards

## Cleanup

After testing, you can:
1. Remove the `.env` file (don't commit it)
2. Clear the research store by restarting the server
3. Check your API usage on provider dashboards
