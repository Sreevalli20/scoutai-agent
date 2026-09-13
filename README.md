# ScoutAI - Autonomous Opportunity Research

ScoutAI is an autonomous opportunity research agent that discovers live opportunities, reasons about eligibility, and prepares actionable plans.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure backend URL (optional):
   Create a `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```
   If not set, defaults to `http://localhost:8000`.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4
- **Icons**: Lucide React
- **Animations**: Motion
- **Backend**: FastAPI (Python) - separate repository

## API Contract

The frontend communicates with a FastAPI backend via:

- `POST /api/research` - Submit research request
- `GET /api/research/{research_id}/status` - Poll research status
- `GET /api/health` - Health check
