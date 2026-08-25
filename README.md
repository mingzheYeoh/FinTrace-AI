# FinTrace AI

Turn financial reports into traceable insights. This repository contains the Phase 0 frontend and the narrow Phase 1A FastAPI vertical slice.

Phase 1A accepts and validates document uploads, discards their bytes, advances an in-memory analysis through six deterministic lifecycle stages, and returns the committed synthetic fixture. It does not extract or analyze the uploaded documents.

## Prerequisites

- Node.js 22 and npm
- [`uv`](https://docs.astral.sh/uv/) for the Python 3.12 backend environment

Install dependencies:

```powershell
npm ci
Set-Location backend
uv sync --dev
Set-Location ..
```

## Run in browser-only mock mode

Only the Next.js process is required. MSW intercepts API calls in the browser, and no uploaded file leaves the browser.

```powershell
$env:NEXT_PUBLIC_API_MODE = "mock"
npm run dev
```

Open `http://127.0.0.1:3000`.

## Run with the Phase 1A backend

Start the backend in one PowerShell window:

```powershell
Set-Location backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

Start Next.js in another PowerShell window:

```powershell
$env:NEXT_PUBLIC_API_MODE = "backend"
$env:FINTRACE_BACKEND_URL = "http://127.0.0.1:8000"
npm run dev
```

The browser continues to call relative `/api/v1` URLs. Next.js proxies those requests to the loopback backend, so no browser CORS configuration is needed. Swagger is available at `http://127.0.0.1:8000/docs`.

## Verification

```powershell
npm run test:frontend
npm run generate:api
npm run typecheck
npm run build

Set-Location backend
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
```

## Current limits

- All analysis output is synthetic fixture data, regardless of uploaded contents.
- The backend retains sanitized metadata only in single-process memory; restart clears every analysis.
- Authentication, persistent storage, OCR/extraction, LLM workflows, queues, exports, payments, and production deployment are outside Phase 1A.
- Use one Uvicorn worker because the analysis registry is process-local.
