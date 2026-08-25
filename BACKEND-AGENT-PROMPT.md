# AI Agent Prompt — Implement FinTrace AI Phase 1A Backend

Paste the prompt below into the AI coding agent after opening the root of the new FinTrace AI project.

---

Implement FinTrace AI Phase 1A as a real FastAPI vertical slice.

## Control status

- Change ID: CHANGE-FT-002.
- Project tier: T1.
- Task risk: Yellow — multipart file intake, API contract, financial fixture, and frontend integration.
- Enforcement: Advisory-only.
- Starting state: the Next.js frontend and MSW API seam are implemented; `backend/` contains only a README.
- Target state: implemented and verified locally/preview. Do not claim accepted, released, production-ready, secure for real financial data, or connected to real extraction/AI.

## First action: read and report

Before editing, read these files completely in this exact order:

1. `BACKEND-PRD.md`
2. `docs/api/openapi.yaml`
3. `PRD.md`
4. `BACKEND-TECH-STACK.md`
5. `docs/FRONTEND-API-MAP.md`
6. `src/fixtures/sample-analysis.json`
7. `src/mocks/handlers.ts`
8. `src/mocks/scenarios.ts`
9. `src/features/analysis/api.ts`
10. `src/features/evidence/api.ts`
11. `src/lib/api/client.ts`
12. `components/api-provider.tsx`
13. `next.config.mjs`
14. `backend/README.md`

Then report:

- the exact four operation IDs and paths;
- the approved Phase 1A scope/non-goals;
- the protected files you will not modify;
- the files/directories you expect to create or change;
- the verification commands you will run; and
- any blocking contradiction.

If a blocking contradiction exists, stop before editing and ask for a Product Owner decision. Do not reconstruct or expand the contract from memory.

## Source precedence

1. `BACKEND-PRD.md`
2. `docs/api/openapi.yaml`
3. `PRD.md`
4. `BACKEND-TECH-STACK.md`
5. `docs/FRONTEND-API-MAP.md`
6. `src/fixtures/sample-analysis.json`
7. Existing mock/frontend code

`BACKEND-PRD.md` supersedes the Phase 0 “no backend” restriction only for the narrow Phase 1A slice. All other Phase 0 exclusions remain.

## Protected assets

Do not modify without a separate Product Owner decision:

- `BACKEND-PRD.md`
- `PRD.md`
- `BACKEND-TECH-STACK.md`
- `docs/api/openapi.yaml`
- `docs/FRONTEND-API-MAP.md`
- `src/fixtures/sample-analysis.json`
- existing fixture financial values, formulas, counts, statuses, evidence bindings, and expected errors
- acceptance expectations after they are implemented as tests

Do not weaken, delete, skip, or rewrite a failing test to match implementation. Fix implementation or stop at the affected gate.

## Exact outcome

Create a Python 3.12 FastAPI application under `backend/` that implements exactly:

```text
createAnalysis
POST /api/v1/analyses

getAnalysisStatus
GET /api/v1/analyses/{analysisId}/status

getAnalysisResult
GET /api/v1/analyses/{analysisId}/result

getEvidenceDetail
GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}
```

FastAPI `/docs` and `/openapi.json` are allowed framework endpoints. Do not add another business endpoint, including `/health`.

The frontend must support:

```text
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_MODE=backend
```

Mock mode must remain the rollback path. Backend mode must skip MSW and proxy same-origin `/api/v1` calls to FastAPI using `FINTRACE_BACKEND_URL`.

## Approved dependencies

Backend runtime:

- FastAPI
- Uvicorn
- Pydantic v2
- pydantic-settings
- python-multipart
- PyYAML

Backend development/testing:

- pytest
- HTTPX
- Ruff
- mypy
- openapi-spec-validator
- jsonschema

Use `uv` with a committed lockfile if available in the environment; otherwise use a documented Python `venv` path with pinned dependencies. Do not require global installs.

Do not add a database/ORM, Redis, queue, worker, PDF/XLSX/OCR parser, LLM/AI SDK, Experian/T3 SDK, auth, storage, telemetry SaaS, or cloud dependency.

Before final reporting, disclose each added package, version, purpose, license, and vulnerability/dependency check result.

## Required backend structure

Create the layout defined in `BACKEND-TECH-STACK.md`, with thin routes and testable services/repositories.

Minimum responsibilities:

- `app/main.py` — FastAPI construction, shared error handling, committed OpenAPI exposure.
- `app/api/analyses.py` — only the four business route handlers.
- `app/models/contract.py` — strict Pydantic contract models; no unrestricted public response dictionaries.
- `app/repositories/fixture.py` — immutable fixture loading, validation, defensive copies.
- `app/repositories/in_memory.py` — single-process in-memory records and synchronization.
- `app/services/uploads.py` — count/type/duplicate/streamed-size validation and closing.
- `app/services/lifecycle.py` — injected-clock, elapsed-time stage calculation.
- `app/services/analysis.py` — use-case orchestration.

## File intake

Implement the exact boundary:

- 1–5 files.
- PDF, XLSX, CSV extensions, case-insensitive.
- Approved declared MIME types plus `application/octet-stream`.
- 20 MiB maximum per file.
- Duplicate normalized filenames rejected.
- Read in bounded chunks; stop at 20 MiB + 1 byte.
- Close every `UploadFile` on every success/failure path.
- Do not retain or log raw bytes.
- Do not create application-managed upload files or storage.

Do not inspect magic bytes or parse the file. The demo files are synthetic placeholders, and real parsing is Phase 1B.

Expected errors:

```text
413 FILE_TOO_LARGE
415 UNSUPPORTED_FILE_TYPE
422 INVALID_FILE_SET
```

An invalid request must not create an analysis record.

## Analysis IDs and store

- Generate unique opaque analysis/document IDs; UUID4 with stable prefixes is acceptable.
- Store only IDs, sanitized file metadata, scenario, and monotonic creation time.
- Use explicit in-process synchronization for writes.
- Return immutable/copy-safe reads.
- Run with one Uvicorn worker only.
- Restart loss is intentional; stale IDs return 404 `ANALYSIS_NOT_FOUND`.
- Do not add cleanup jobs, persistence, or delete endpoints.

## Lifecycle

- Use an injected monotonic clock.
- Use approximately 0.9 seconds per stage, matching the approved temporary decision.
- Derive lifecycle from elapsed time; GET calls must not increment poll counters or mutate progression.
- Always return all six stage records.
- Terminal happy outcome: `completed` + `completed_with_review_flags` + 17/19 + 3 reviews.
- Tests use a fake clock; do not sleep.
- Preserve the development-only `processing_failed` scenario with visible progress before terminal failure.

## Fixture and result

- Load `src/fixtures/sample-analysis.json` using a path independent of the caller's working directory.
- Validate create response, status sequence, result, evidence objects, and reference integrity at startup/tests.
- Fail startup with a clear non-sensitive error if the committed fixture is invalid.
- Never mutate the loaded fixture singleton; deep-copy response data before substituting generated IDs.
- Result requested before completion returns 409 `RESULT_NOT_READY`.
- Unknown analysis returns 404 `ANALYSIS_NOT_FOUND`.
- Unknown evidence on an existing analysis returns 404 `EVIDENCE_NOT_FOUND`.
- Preserve decimal strings and all fixture quantities.
- Preserve Debt-to-equity exactly as:
  - Borrowings / Shareholders' equity.
  - FY2025 = 1.13x.
  - FY2024 = 0.81x.
- `total_liabilities` is not an input to that formula.

The successful Phase 1A result is synthetic regardless of uploaded contents. Preserve and, where necessary, clarify the visible prototype/synthetic notice. Do not imply extraction occurred.

## OpenAPI and Swagger

- Parse and validate `docs/api/openapi.yaml`.
- Expose the committed document through FastAPI's OpenAPI/Swagger integration.
- Test exactly four approved business operation IDs and method/path pairs.
- Validate every success/error response against the committed schema.
- Do not edit the contract to match FastAPI defaults.
- If FastAPI default validation would return a different error shape, add the necessary exception mapping to return the committed `ApiError` behavior.

## Frontend integration — minimal authorized changes

Create `.env.example`:

```dotenv
NEXT_PUBLIC_API_MODE=mock
FINTRACE_BACKEND_URL=http://127.0.0.1:8000
```

Modify only the necessary integration surfaces:

1. `components/api-provider.tsx`
   - mock mode: start/await MSW exactly as today;
   - backend mode: do not import or start MSW;
   - preserve one stable QueryClient.
2. `next.config.mjs`
   - in backend mode rewrite `/api/v1/:path*` to `${FINTRACE_BACKEND_URL}/api/v1/:path*`;
   - preserve existing security headers and transpile settings.
3. Upload notice
   - mock: no file leaves the browser;
   - backend: files are sent to the configured Phase 1A backend, validated, and discarded without persistence.
4. Run documentation
   - exact commands for mock mode and backend mode.

Keep `src/lib/api/client.ts` relative same-origin unless evidence proves a change is necessary. Do not add wildcard CORS when the approved rewrite works. Do not redesign UI, add routing, add persistence, bypass typed hooks, or remove MSW.

## Development-only scenarios

Preserve deterministic paths for:

- `happy_path_with_review_flags`
- `unsupported_file`
- `file_too_large`
- `too_many_files`
- `processing_failed`
- `result_not_ready`
- `analysis_not_found`
- `evidence_not_found`

Use the documented filename convention only. Do not add undocumented query/header controls that could appear as a production feature.

## Required tests

Implement the traceability plan in `BACKEND-TECH-STACK.md`.

At minimum test:

- 0, 1, 5, and 6 files;
- exactly 20 MiB and 20 MiB + 1 byte;
- supported/unsupported and uppercase extensions;
- supported/unsupported MIME types;
- duplicate normalized filenames;
- malformed multipart request;
- every lifecycle boundary using a fake clock;
- repeated and concurrent status GET without GET-driven mutation;
- result immediately before and at completion;
- processing failure after visible progress;
- unknown and stale analysis IDs;
- known and unknown evidence IDs;
- exact four OpenAPI operations;
- every response schema and error envelope;
- fixture counts, IDs, references, decimal strings, manual review count, and Debt-to-equity inputs/results;
- upload stream closure and absence of raw bytes in the store;
- mock mode rollback;
- backend mode upload → status → result → evidence integration.

Do not use real sleeps in the backend test suite.

## Verification commands

Run and report actual output for the canonical dependency workflow you implement. With `uv`, the expected shape is:

```bash
cd backend
uv sync --dev
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
```

From the repository root:

```bash
npm ci
npm run generate:api
npm run typecheck
npm run lint
npm run build
```

Also run:

- an OpenAPI parse/operation/schema check;
- fixture referential-integrity check;
- search showing fixture imports remain limited to approved mock/backend fixture repositories;
- search showing UI components still contain no direct `fetch`, `useQuery`, or `useMutation` calls;
- direct HTTP trace for all four business operations and each error class;
- full browser journey in mock mode;
- full browser journey in backend mode;
- browser console check for runtime, hydration, unhandled request, and Ant Design warnings.

If package installation or browser verification cannot run in the environment, mark that check `deferred` with the exact blocker. Do not report it as passed.

## Three-strike rule

After three failed repair cycles on the same gate without materially new evidence, stop patching. Report the failed assumption and return to specification/design. Do not weaken the contract or tests.

## Completion report

Return a human-readable report with these exact sections:

1. `Implemented`
   - user-visible behavior and architecture;
   - exact files created/changed.
2. `Requirement traceability`
   - BE requirement → test ID → result.
3. `Verified`
   - exact commands, exit codes, test counts, HTTP traces, browser evidence.
4. `Data and security boundary`
   - file handling, retained metadata, logs, dependencies, licenses, vulnerability checks.
5. `Deferred / not applicable`
   - database, real extraction, OCR, LLM, Experian, T3, auth, production controls.
6. `Known limitations`
   - in-memory loss, single worker, fixture-backed result, synthetic files only.
7. `Rollback`
   - set `NEXT_PUBLIC_API_MODE=mock` and stop FastAPI.
8. `Contract deviations`
   - must be empty or list each unresolved deviation explicitly.
9. `Product Owner acceptance needed`
   - local URLs and five short scenarios for manual approval.

Use precise states: `implemented`, `verified`, and `acceptance pending`. Do not collapse them into “done.”
