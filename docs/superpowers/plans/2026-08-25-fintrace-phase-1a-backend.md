# FinTrace AI Phase 1A Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the contract-compatible FastAPI Phase 1A vertical slice while preserving the existing MSW rollback path.

**Architecture:** FastAPI exposes only the four committed business operations. Thin routes delegate to upload, lifecycle, fixture, and in-memory repository services; lifecycle is derived from an injected monotonic clock and completed responses come from a startup-validated, immutable fixture. Next.js keeps relative API calls and conditionally uses either MSW or a same-origin backend rewrite.

**Tech Stack:** Python 3.12, FastAPI, Uvicorn, Pydantic v2, pydantic-settings, python-multipart, PyYAML, pytest, HTTPX, Ruff, mypy, openapi-spec-validator, jsonschema, Next.js 16, TypeScript, TanStack Query, MSW.

**Spec:** `BACKEND-PRD.md`, `docs/api/openapi.yaml`, `BACKEND-TECH-STACK.md`, and `docs/FRONTEND-API-MAP.md`

## Global Constraints

- Change ID is `CHANGE-FT-002`; project tier/risk/enforcement are `T1 / Yellow / advisory-only`.
- Python runtime is 3.12 and Uvicorn uses one worker bound to `127.0.0.1` for local development.
- Implement exactly the four approved business operations; `/docs` and `/openapi.json` are the only additional framework endpoints.
- Do not modify the protected PRDs, OpenAPI contract, frontend/API map, fixture, financial values, or accepted tests.
- Accept 1–5 `.pdf`, `.xlsx`, or `.csv` files, case-insensitively; limit each stream to exactly 20 MiB; close every stream; retain no raw bytes.
- Store only generated IDs, sanitized file metadata, filename-selected scenario, and monotonic creation time in synchronized process memory.
- Derive lifecycle from elapsed monotonic time at 0.9 seconds per stage; tests use fake clocks and never sleep.
- Preserve the fixture counts, references, decimal strings, three review flags, and Debt-to-equity inputs/results exactly.
- Preserve both frontend modes; backend mode skips MSW and rewrites same-origin `/api/v1` requests to `FINTRACE_BACKEND_URL`.
- The dirty starting worktree contains user-owned Phase 0 changes. Do not reset, overwrite, or commit them.

---

### Task 1: Backend environment and contract harness

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.python-version`
- Create: `backend/.gitignore`
- Create: `backend/uv.lock`
- Create: `backend/app/__init__.py`
- Create: `backend/app/openapi.py`
- Create: `backend/tests/contract/test_openapi.py`

**Interfaces:**
- Consumes: committed `../docs/api/openapi.yaml`.
- Produces: a Python 3.12 `uv` environment and `load_openapi_document() -> dict[str, object]` for later application construction.

- [ ] **Step 1: Add the pinned project configuration**

  Declare only the approved runtime and development dependencies, configure Ruff for Python 3.12, strict mypy, and pytest test discovery.

- [ ] **Step 2: Resolve and lock dependencies**

  Run `cd backend; uv lock` and `uv sync --dev`. Expected: Python 3.12 environment and committed `uv.lock`.

- [ ] **Step 3: Write the failing OpenAPI operation test**

  Parse `../docs/api/openapi.yaml`, validate it with `openapi-spec-validator`, and assert this literal set:

  ```python
  {
      ("post", "/api/v1/analyses", "createAnalysis"),
      ("get", "/api/v1/analyses/{analysisId}/status", "getAnalysisStatus"),
      ("get", "/api/v1/analyses/{analysisId}/result", "getAnalysisResult"),
      ("get", "/api/v1/analyses/{analysisId}/evidence/{evidenceId}", "getEvidenceDetail"),
  }
  ```

- [ ] **Step 4: Run the test and verify RED**

  Run `cd backend; uv run pytest tests/contract/test_openapi.py -q`. Expected: failure because the application OpenAPI loader does not exist.

- [ ] **Step 5: Implement the minimal loader and verify GREEN**

  Add `app/openapi.py` with repository-root path resolution, YAML parsing, OpenAPI validation, and a defensive returned copy; rerun the focused test, then run Ruff on touched files.

### Task 2: Strict contract models and immutable fixture repository

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/contract.py`
- Create: `backend/app/repositories/__init__.py`
- Create: `backend/app/repositories/fixture.py`
- Create: `backend/tests/contract/test_responses.py`
- Create: `backend/tests/contract/test_fixture_references.py`

**Interfaces:**
- Consumes: OpenAPI schemas and `src/fixtures/sample-analysis.json` resolved from `Path(__file__)`, independent of process CWD.
- Produces: strict Pydantic response types plus `FixtureRepository.status_frames()`, `result(analysis_id)`, and `evidence(evidence_id)` defensive-copy methods.

- [ ] **Step 1: Write fixture schema and integrity tests**

  Assert schema validity for create/status/result/evidence, literal counts `19/19/6/7/25/7/3/5`, 17 extracted fields, three manual-review fields, all cross-references, decimal strings, and Debt-to-equity formula/input IDs/substitutions/results.

- [ ] **Step 2: Run fixture tests and verify RED**

  Run `cd backend; uv run pytest tests/contract/test_responses.py tests/contract/test_fixture_references.py -q`. Expected: import failure for missing models/repository.

- [ ] **Step 3: Implement strict Pydantic models**

  Use a shared `ConfigDict(extra="forbid")` base for schemas whose OpenAPI definition forbids extra properties. Define typed enums and nested response objects; public route response bodies must not use `dict[str, Any]`.

- [ ] **Step 4: Implement fixture loading and validation**

  Validate the OpenAPI schemas and Pydantic models once at repository construction, validate reference integrity, retain a private immutable source copy, and return `model_copy(deep=True)` or `copy.deepcopy` results. Substitute only `result.summary.analysis_id` for completed analyses.

- [ ] **Step 5: Verify GREEN and defensive-copy behavior**

  Rerun both fixture suites and add a mutation attempt proving a returned response cannot mutate later reads.

### Task 3: Upload intake and in-memory repository

**Files:**
- Create: `backend/app/errors.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/uploads.py`
- Create: `backend/app/repositories/in_memory.py`
- Create: `backend/tests/unit/test_upload_validation.py`
- Create: `backend/tests/unit/test_store.py`

**Interfaces:**
- Produces: `validate_and_discard_uploads(files) -> tuple[FileMetadata, ...]`; immutable `AnalysisRecord`; async `InMemoryAnalysisRepository.create(record)` and `.get(analysis_id)`.
- Errors: typed application exception carrying the exact HTTP status and `ApiError` body.

- [ ] **Step 1: Write upload boundary tests**

  Cover 0/1/5/6 files, exactly `20 * 1024 * 1024`, one byte over, uppercase extensions, canonical PDF/XLSX/CSV MIME values, `application/octet-stream`, unsupported extension/MIME, duplicate Unicode-normalized case-folded filenames, every-stream closure, filename sanitization, and absence of raw bytes from metadata.

- [ ] **Step 2: Verify upload tests RED**

  Run `cd backend; uv run pytest tests/unit/test_upload_validation.py -q`. Expected: missing upload service.

- [ ] **Step 3: Implement bounded streaming**

  Validate count/name/type before reading; read at most 1 MiB per call and stop after 20 MiB + 1 byte; close all supplied `UploadFile` instances in one `finally` block on success or any failure; never log or store content.

- [ ] **Step 4: Write and verify store tests RED**

  Test unique records, explicit async synchronization under concurrent writes, immutable/copy-safe reads, missing ID behavior, and a recursive assertion that stored state contains no `bytes`, `bytearray`, stream, or upload object.

- [ ] **Step 5: Implement the minimal synchronized store and verify GREEN**

  Use frozen dataclasses/tuples and `asyncio.Lock`; rerun both unit suites.

### Task 4: Elapsed-time lifecycle and analysis orchestration

**Files:**
- Create: `backend/app/services/lifecycle.py`
- Create: `backend/app/services/analysis.py`
- Create: `backend/tests/unit/test_lifecycle.py`
- Create: `backend/tests/unit/test_analysis_service.py`

**Interfaces:**
- Produces: `Clock` protocol, `SystemClock`, `LifecycleService.status(record)`, and `AnalysisService` create/status/result/evidence use cases.
- Consumes: immutable record store and fixture repository.

- [ ] **Step 1: Write lifecycle boundary tests with a fake clock**

  Assert frames at elapsed `0`, `0.9`, `1.8`, `2.7`, `3.6`, `4.5`, immediately before `5.4`, and at `5.4`; always six stages; identical repeated/concurrent reads; no GET-driven mutation.

- [ ] **Step 2: Verify lifecycle tests RED and implement GREEN**

  Select fixture frames with `floor(elapsed / 0.9)` clamped to the terminal frame. For `processing_failed`, expose progress before returning a terminal failed contract status derived from a defensive fixture copy.

- [ ] **Step 3: Write use-case tests RED**

  Assert early result is 409, completion result is fixture-valid, stale/unknown analysis is 404, known/unknown evidence is 200/404, `result_not_ready` stays 409, and `analysis_not_found`/`evidence_not_found` filename scenarios remain deterministic.

- [ ] **Step 4: Implement orchestration and verify GREEN**

  Generate `anl_<uuid4hex>` and `doc_<uuid4hex>` identifiers; create a record only after all uploads validate; map all expected failures to exact `ApiError` messages.

### Task 5: Four-route FastAPI application and contract responses

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/analyses.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/settings.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/api/test_create_analysis.py`
- Update: `backend/tests/api/test_status.py`
- Update: `backend/tests/api/test_result.py`
- Update: `backend/tests/api/test_evidence.py`
- Update: `backend/tests/contract/test_responses.py`

**Interfaces:**
- Produces: `create_app(clock=..., store=..., fixture=...) -> FastAPI` and module-level `app`.
- HTTP surface: only the four committed business method/path pairs plus framework docs/OpenAPI.

- [ ] **Step 1: Write API tests RED**

  Use HTTPX/TestClient multipart requests for every intake and error boundary, malformed multipart, unique repeated POSTs, lifecycle/status/result/evidence behavior, failure scenarios, and generic 500 mapping. Validate each body with the exact committed response schema.

- [ ] **Step 2: Implement thin routes and shared error mapping**

  Route handlers call `AnalysisService`; map `RequestValidationError` and multipart parsing failures to 422 `INVALID_FILE_SET`; map expected domain exceptions exactly; map unexpected exceptions to generic 500 `PROCESSING_FAILED` without response stack traces.

- [ ] **Step 3: Expose the committed OpenAPI document**

  Override `app.openapi` with the validated YAML mapping so Swagger displays the protected operation IDs/schemas/examples unchanged.

- [ ] **Step 4: Verify the API and exact route set GREEN**

  Run `cd backend; uv run pytest tests/api tests/contract -q`, then assert the implemented business route set equals the four literal pairs.

### Task 6: Frontend mode switch and truthful upload notice

**Files:**
- Create: `.env.example`
- Modify: `components/api-provider.tsx`
- Modify: `next.config.mjs`
- Modify: `components/upload/upload-panel.tsx`
- Modify: `README.md`
- Modify: `backend/README.md`

**Interfaces:**
- Mock mode: stable QueryClient, awaited dynamic MSW startup, no backend requirement.
- Backend mode: stable QueryClient, no MSW import/start, relative client unchanged, `/api/v1/:path*` rewritten to `${FINTRACE_BACKEND_URL}/api/v1/:path*`.

- [ ] **Step 1: Add failing frontend behavior checks**

  Exercise exported/configured mode behavior rather than grepping implementation text: mock mode starts MSW; backend mode renders without loading MSW; rewrite exists only in backend mode and retains existing security headers/transpile packages.

- [ ] **Step 2: Implement the minimal mode branches**

  Read `NEXT_PUBLIC_API_MODE`, default to `mock`, dynamically import MSW only in mock mode, set backend readiness immediately, and return the existing stable QueryClient.

- [ ] **Step 3: Update truthful copy and run docs**

  Mock notice says files remain in the browser. Backend notice says files are sent to the configured Phase 1A backend, validated, and discarded without application persistence. Document exact mock/backend start commands and synthetic-data limits.

- [ ] **Step 4: Run frontend static verification**

  Run `npm run generate:api`, `npm run typecheck`, `npm run lint`, and `npm run build`; retain the baseline disclosure if the pre-existing missing ESLint dependency remains unresolved.

### Task 7: Full verification and evidence bundle

**Files:**
- Modify only implementation files needed to fix observed failures.
- Do not weaken or rewrite expectations to obtain a pass.

**Interfaces:**
- Produces: command output, HTTP traces, browser evidence, dependency/license/security inventory, traceability, limitations, and rollback report.

- [ ] **Step 1: Run canonical backend gates**

  ```powershell
  Set-Location backend
  uv sync --dev
  uv run ruff format --check .
  uv run ruff check .
  uv run mypy app
  uv run pytest
  ```

- [ ] **Step 2: Run canonical frontend gates**

  ```powershell
  Set-Location ..
  npm ci
  npm run generate:api
  npm run typecheck
  npm run lint
  npm run build
  ```

- [ ] **Step 3: Run structural and integrity checks**

  Check exactly four OpenAPI operations, response schemas, fixture references, fixture-import boundaries, and absence of direct `fetch`, `useQuery`, or `useMutation` in UI components.

- [ ] **Step 4: Capture direct HTTP traces**

  Start one Uvicorn worker on loopback and exercise create, every lifecycle class, completed result, known evidence, and each 404/409/413/415/422/500 contract error. Record statuses and response bodies without raw uploaded bytes.

- [ ] **Step 5: Verify both browser journeys**

  Run mock then backend mode at the specified ports; verify upload → six stages → 17/19 and three reviews → dashboard → field/KPI/ratio/anomaly/insight evidence → evidence 404 recovery → start over, with no runtime, hydration, MSW, or Ant Design console warnings.

- [ ] **Step 6: Review dependencies and prepare handoff**

  Record each added direct package/version/purpose/license, `uv tree`, vulnerability check result, `npm audit`, known limitations, exact rollback, empty or explicit contract deviations, and Product Owner acceptance scenarios.
