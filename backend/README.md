# FinTrace AI Backend - Phase 1A

This directory contains the implemented Phase 1A FastAPI service. It exposes exactly the four operations committed in `../docs/api/openapi.yaml`:

- `POST /api/v1/analyses`
- `GET /api/v1/analyses/{analysisId}/status`
- `GET /api/v1/analyses/{analysisId}/result`
- `GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}`

`/docs` and `/openapi.json` are the only additional framework endpoints.

## Run locally

From this directory:

```powershell
uv sync --dev
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

Open Swagger at `http://127.0.0.1:8000/docs`.

## Verify

```powershell
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
```

## Runtime behavior

- Accepts one to five `.pdf`, `.xlsx`, or `.csv` files, up to 20 MiB each.
- Streams, validates, closes, and discards uploaded file bytes.
- Keeps generated IDs, sanitized file metadata, scenario, and monotonic creation time in synchronized process memory.
- Derives six lifecycle stages from elapsed monotonic time at 0.9 seconds per stage.
- Returns startup-validated, defensive copies of `../src/fixtures/sample-analysis.json`.
- Supports the deterministic filename scenarios documented by the Phase 1A requirements.

The service performs no financial-document extraction. It has no database, object storage, authentication, queue, worker, OCR, LLM, third-party bureau integration, or production controls. Run exactly one worker because the registry is process-local.
