# FinTrace AI — Phase 1A Backend Technical Stack

| Field | Value |
| --- | --- |
| Version | 1.0 — Phase 1A |
| Related requirements | `BACKEND-PRD.md` |
| API contract | `docs/api/openapi.yaml` |
| Architecture | Next.js frontend + FastAPI backend, same-origin development proxy |
| Persistence | In-memory only |
| Project tier / task risk / enforcement | T1 / Yellow / Advisory-only |

## 1. Architecture

```text
Browser
  │
  ├─ NEXT_PUBLIC_API_MODE=mock
  │    └─ Next.js → MSW → fixture
  │
  └─ NEXT_PUBLIC_API_MODE=backend
       └─ Next.js /api/v1 rewrite
            └─ FastAPI :8000
                 ├─ upload validator (stream and discard)
                 ├─ in-memory analysis store
                 ├─ elapsed-time lifecycle service
                 └─ read-only fixture/evidence repository
```

The four OpenAPI operations and response shapes remain unchanged. Mock mode is the rollback path during Phase 1A.

## 2. Selected backend stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Language | Python 3.12 | Backend runtime |
| Web framework | FastAPI | Typed HTTP routes and Swagger integration |
| ASGI server | Uvicorn | Local single-worker development server |
| Validation | Pydantic v2 | Contract-shaped request/response models |
| Multipart | `python-multipart` | FastAPI `UploadFile` form parsing |
| Configuration | `pydantic-settings` | Typed local environment settings |
| YAML | PyYAML | Load committed OpenAPI YAML for documentation/validation |
| Testing | pytest + HTTPX | Unit and async/synchronous API tests |
| Contract validation | `openapi-spec-validator` + `jsonschema` | Parse OpenAPI and validate fixture/responses |
| Formatting/lint | Ruff | Fast formatting and lint checks |
| Static typing | mypy | Backend type checks |

Do not add an ORM, database driver, Redis client, queue, OCR library, PDF/XLSX parser, LLM SDK, Experian SDK, T3 SDK, auth SDK, or cloud-storage dependency.

Package versions must be resolved and pinned in the chosen lock mechanism by the implementation agent. Dependency installation is a protected change: report every added package, license, purpose, and transitive-security check.

## 3. Project layout

```text
backend/
├── README.md
├── pyproject.toml
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── analyses.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── contract.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── fixture.py
│   │   └── in_memory.py
│   └── services/
│       ├── __init__.py
│       ├── analysis.py
│       ├── lifecycle.py
│       └── uploads.py
└── tests/
    ├── conftest.py
    ├── contract/
    │   ├── test_openapi.py
    │   ├── test_responses.py
    │   └── test_fixture_references.py
    ├── unit/
    │   ├── test_lifecycle.py
    │   ├── test_store.py
    │   └── test_upload_validation.py
    └── api/
        ├── test_create_analysis.py
        ├── test_status.py
        ├── test_result.py
        └── test_evidence.py
```

Keep business routes thin. Validation, lifecycle selection, store access, and fixture loading belong in services/repositories so they can be tested without HTTP.

## 4. Source and contract rules

### Source order

1. `BACKEND-PRD.md`
2. `docs/api/openapi.yaml`
3. `PRD.md`
4. `BACKEND-TECH-STACK.md`
5. `docs/FRONTEND-API-MAP.md`
6. `src/fixtures/sample-analysis.json`

### Contract implementation

- Define Pydantic response models corresponding to committed schemas.
- Do not use unrestricted `dict[str, Any]` for public response bodies.
- Configure models to reject unexpected fields where the OpenAPI schema has `additionalProperties: false`.
- Keep numeric financial values as strings.
- Validate the fixture once at startup; fail startup clearly if it is invalid.
- Serve the committed OpenAPI document through FastAPI's OpenAPI function so Swagger shows the approved contract, not an independently drifted reconstruction.
- Runtime and tests must verify that the implemented route method/path set contains exactly the four approved business operations.

The implementation must not modify `docs/api/openapi.yaml` or `src/fixtures/sample-analysis.json` without a separate Product Owner decision.

## 5. File upload implementation

Use FastAPI `UploadFile` and read in bounded chunks, for example 1 MiB per read.

Required algorithm:

1. Validate total file count before reading content.
2. Normalize and validate filename extension case-insensitively.
3. Validate declared content type against the approved allowlist.
4. Reject duplicate normalized filenames.
5. Read each file stream in bounded chunks while counting bytes.
6. Stop immediately and return 413 when the count exceeds 20 MiB.
7. Close every stream in a `finally` path.
8. Do not save bytes to application storage or the analysis record.

The underlying multipart library may spool temporary upload bytes while parsing. Phase 1A must not create its own persistent copy and must close `UploadFile` promptly so temporary resources are released. Do not claim “never touches disk” because spooling behavior depends on the server/runtime.

Sanitize filenames before logs. Prefer logging counts, sizes, generated IDs, status codes, and timings; do not log raw content or evidence excerpts.

## 6. In-memory store

Define a small repository interface and one in-memory implementation.

### Analysis record

```text
analysis_id
document_ids
file metadata (sanitized name, declared type, byte size)
scenario
created_at_monotonic
```

Do not store upload bytes or the completed result. The result remains in the read-only fixture repository.

### Concurrency

- Protect writes with an async lock or other explicit in-process synchronization.
- Reads return immutable/copy-safe records.
- Use unique opaque IDs such as UUID4 with an `anl_`/`doc_` presentation prefix.
- Run Uvicorn with exactly one worker in Phase 1A.

No cleanup job is required because the process is disposable. Record growth is a known limitation; do not expose Phase 1A publicly or run it long term.

## 7. Lifecycle service

Use an injected clock interface:

```python
class Clock(Protocol):
    def monotonic(self) -> float: ...
```

Production/local code uses `time.monotonic`. Tests use a fake clock. Do not use `sleep` in tests.

Map elapsed time into the six fixture frames and the final frame. The default temporary interval is 0.9 seconds per stage. A slow poll may observe earlier stages already marked completed; the full six-element stage array remains present.

GET requests must not increment a poll counter or otherwise mutate lifecycle state. `processing_failed` uses the same elapsed-time approach and returns the fixture-derived failure response after visible progress.

## 8. Fixture repository

Load the single committed fixture from the repository root:

```text
src/fixtures/sample-analysis.json
```

The backend project must resolve the repository root robustly; do not depend on the caller's working directory.

Repository responsibilities:

- validate `create_response`, every status frame, result, and every evidence object against the OpenAPI schemas;
- validate reference integrity among fields, period values, calculations, KPIs, ratios, anomalies, insights, and evidence;
- return defensive deep copies before substituting generated analysis/document IDs;
- never mutate the loaded fixture singleton;
- preserve all financial values and formulas.

## 9. Error handling

Create one shared exception-to-`ApiError` mapping. All expected errors use the committed envelope:

```json
{
  "code": "...",
  "message": "...",
  "retryable": false
}
```

Unexpected exceptions return the generic 500 contract envelope and are logged without request bodies or stack traces in the response.

Required status/code pairs:

```text
413 FILE_TOO_LARGE
415 UNSUPPORTED_FILE_TYPE
422 INVALID_FILE_SET
404 ANALYSIS_NOT_FOUND
404 EVIDENCE_NOT_FOUND
409 RESULT_NOT_READY
500 PROCESSING_FAILED
```

## 10. FastAPI documentation

Allowed framework endpoints:

- `/docs`
- `/openapi.json`

Swagger/OpenAPI must show the committed four business operations. Do not add `/health`, `/files`, `/jobs`, `/users`, `/cases`, `/delete`, `/admin`, `/t3`, or other business endpoints.

If serving the committed YAML as FastAPI's OpenAPI representation requires a conversion layer, keep it deterministic and test that the four operation IDs, methods, paths, schemas, and examples remain intact.

## 11. Frontend integration

### Environment

Root `.env.example`:

```dotenv
NEXT_PUBLIC_API_MODE=mock
FINTRACE_BACKEND_URL=http://127.0.0.1:8000
```

No secrets belong in either value.

### Approved frontend changes

Only the minimum integration surfaces may change:

- `components/api-provider.tsx` — conditionally start MSW only in mock mode.
- `next.config.mjs` — backend-mode `/api/v1/:path*` rewrite.
- upload notice component/copy — truthful mock vs backend behavior.
- `.env.example` and run documentation.

Do not redesign components, rename API fields, bypass typed hooks, change calculations, add routes, or add persistence.

### Local ports

- Next.js: `http://127.0.0.1:3000`
- FastAPI: `http://127.0.0.1:8000`

The browser calls the Next.js origin. Next.js proxies business API requests to FastAPI, avoiding browser CORS.

## 12. Backend commands

The implementation agent may choose `uv` or standard `venv`/`pip`, but must document one canonical path. Recommended commands using `uv`:

```bash
cd backend
uv sync --dev
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

Do not require global package installation.

## 13. Verification plan

| Test ID | Requirements | Check |
| --- | --- | --- |
| TEST-BE-001 | BE-001–BE-003 | Multipart minimum/maximum/type/duplicate/20 MiB boundary and stream closure |
| TEST-BE-002 | BE-004–BE-005 | Fake-clock lifecycle across every stage, terminal state, repeated/concurrent GET |
| TEST-BE-003 | BE-006–BE-007 | Early result, unknown analysis, unknown evidence, failed scenario |
| TEST-BE-004 | BE-008–BE-009 | Fixture counts/references/decimal strings/debt-to-equity formula |
| TEST-BE-005 | BE-013 | OpenAPI parse, exactly four operation IDs, response-schema validation |
| TEST-BE-006 | BE-010–BE-012 | Browser integration in backend mode, mock rollback mode, restart recovery |
| TEST-BE-007 | BE-014 | Ruff, mypy, pytest, frontend generate/type/lint/build |

### Important exact boundaries

- 0, 1, 5, and 6 files.
- Exactly 20 MiB and 20 MiB + 1 byte.
- Uppercase/lowercase extensions.
- Duplicate normalized filenames.
- Empty/malformed multipart body.
- Result immediately before and at completion boundary.
- Unknown and stale IDs.
- Same status/evidence GET repeated and concurrent.
- Mock mode and backend mode.

### End-to-end journey

Run the existing frontend with backend mode and verify:

1. Demo files are staged.
2. The POST reaches FastAPI.
3. Six server-derived stages are visible.
4. Completion displays 17/19 and three review flags.
5. Dashboard counts and formulas match the fixture.
6. Evidence opens from a KPI, financial field, ratio, anomaly, and insight.
7. Evidence 404 does not break the dashboard.
8. Start over works.
9. Browser console has no unhandled request, hydration, runtime, or Ant Design warnings.

## 14. Evidence, rollback, and release

### Evidence required from the implementation agent

- changed-file list and architecture summary;
- dependency and license list;
- OpenAPI parse/operation/schema validation output;
- fixture-reference validation output;
- backend format/lint/type/test output;
- frontend generate/type/lint/build output;
- actual HTTP request/response trace for all four operations;
- browser trace/screenshots for the critical journey;
- proof mock mode still works;
- disclosure that uploaded bytes are not retained by application code;
- known limits and deferred checks.

### Rollback

Set:

```text
NEXT_PUBLIC_API_MODE=mock
```

and stop FastAPI. Existing MSW behavior is the Phase 1A rollback. Do not delete MSW until a later accepted change.

### Release state

Phase 1A authorizes local/preview verification only. It does not authorize production deployment, real financial data, or external users.
