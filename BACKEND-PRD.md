# FinTrace AI — Phase 1A Backend Product Requirements

> Replace the browser mock with a real, contract-compatible FastAPI service before adding extraction, storage, or AI.

| Field | Value |
| --- | --- |
| Change ID | CHANGE-FT-002 |
| Version | 1.0 — Phase 1A |
| Status | Planned |
| Project tier | T1 — hackathon/portfolio prototype |
| Task risk | Yellow — file intake, API, financial-data contract, frontend integration |
| Enforcement | Advisory-only |
| Data policy | Synthetic, public, or explicitly redacted test files only |

## 1. Authority and supersession

This document authorizes the Phase 1A backend slice that the Phase 0 `PRD.md` deliberately excluded.

For Phase 1A backend work, use this precedence:

1. `BACKEND-PRD.md` — backend outcome, scope, behavior, and acceptance.
2. `docs/api/openapi.yaml` — exact business operations, request/response schemas, enums, and errors.
3. `PRD.md` — frontend product behavior and financial-analysis meaning.
4. `BACKEND-TECH-STACK.md` — implementation architecture and technology.
5. `docs/FRONTEND-API-MAP.md` — frontend action-to-API behavior.
6. `src/fixtures/sample-analysis.json` — deterministic responses and financial values.
7. `src/mocks/handlers.ts` and `src/mocks/scenarios.ts` — existing mock behavior for reference only.
8. Current implementation code.

The Phase 0 statement “do not add a backend” is superseded only for the narrow Phase 1A work defined here. Its exclusions for database, production parsing, OCR, LLMs, Experian, T3, authentication, payments, and production security claims remain in force.

An implementation agent must not change this document, the committed OpenAPI contract, the fixture values, or protected acceptance tests merely to make implementation pass.

## 2. Outcome

Create a real FastAPI service that implements the existing four FinTrace API operations so the current Next.js frontend can run end to end without Mock Service Worker.

The completed vertical slice is:

```text
Next.js frontend
  → same-origin /api/v1 request
  → Next.js development rewrite
  → FastAPI service
  → in-memory analysis state
  → deterministic fixture result/evidence
  → existing frontend dashboard
```

This phase proves transport, lifecycle, error, schema, and frontend/backend compatibility. It does not prove financial-document extraction.

## 3. Users and environments

### User

One developer, hackathon judge, or Product Owner running the prototype. There is no login, role, tenant, or permission model.

### Approved environments

- Local development.
- Disposable preview/test environments using synthetic data.

Production use, real customer use, and confidential financial files are excluded.

## 4. Approved scope

### Included

- A new `backend/` Python application.
- FastAPI implementation of the existing four business operations.
- Multipart intake of one to five files.
- Server-side validation of file count, filename extension, declared content type, and streamed size.
- Immediate discard of uploaded file bytes after validation.
- Unique opaque analysis and document identifiers.
- In-memory analysis registry for one running process.
- Time-derived six-stage processing lifecycle without a worker or queue.
- Fixture-backed completed result and evidence responses.
- Existing contract-shaped error envelopes.
- Development-only deterministic failure scenarios.
- FastAPI/Swagger documentation based on the committed OpenAPI document.
- Unit, API, contract, boundary, and frontend integration tests.
- A frontend environment switch between `mock` and `backend` mode.
- A same-origin Next.js rewrite to the local FastAPI service.

### Explicit non-goals

- Reading or extracting the uploaded PDF/XLSX/CSV contents.
- OCR or scanned-document processing.
- Real financial normalization, calculations, anomaly detection, or LLM explanation at runtime.
- Database, Redis, object storage, queues, workers, scheduled jobs, or durable workflows.
- Persistence across backend restart.
- Linkable or shareable analysis routes.
- Authentication, authorization, roles, users, organizations, or tenancy.
- Real Experian reports or APIs.
- T3 ADK, T3N identity, grants, or TEE integration.
- Email, export, payments, subscriptions, credit scoring, or benchmarking.
- Production deployment, production secrets, production monitoring, compliance, retention, encryption-at-rest, malware scanning, or security claims.

## 5. Approved operations

Phase 1A implements exactly these business operations:

| operationId | Method and path | Purpose |
| --- | --- | --- |
| `createAnalysis` | `POST /api/v1/analyses` | Validate a file set and create an ephemeral analysis. |
| `getAnalysisStatus` | `GET /api/v1/analyses/{analysisId}/status` | Return lifecycle, progress, stages, logs, and extraction summary. |
| `getAnalysisResult` | `GET /api/v1/analyses/{analysisId}/result` | Return the fixture-backed dashboard after completion. |
| `getEvidenceDetail` | `GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}` | Return one fixture evidence binding. |

FastAPI framework documentation endpoints such as `/docs` and `/openapi.json` are allowed. No additional business resource, health, delete, admin, user, or upload endpoint is approved.

## 6. Normal journey

1. The user stages the synthetic demo PDF and XLSX in the frontend.
2. The frontend sends `POST /api/v1/analyses` through the Next.js rewrite.
3. FastAPI streams each file only far enough to validate the 20 MB limit, then discards its bytes.
4. FastAPI creates an in-memory record with unique analysis/document IDs, file metadata, selected development scenario, and monotonic creation time.
5. The frontend polls `getAnalysisStatus` approximately every 900 ms.
6. FastAPI calculates the visible lifecycle from elapsed monotonic time and returns all six stage records.
7. The terminal state is `completed` with `completed_with_review_flags`, 17/19 extracted fields, and three review flags.
8. `getAnalysisResult` returns the committed fixture with the generated `analysis_id` substituted only in the allowed summary field.
9. Selecting a field, KPI, ratio, anomaly, or insight calls `getEvidenceDetail` and returns the matching evidence binding.
10. **New analysis** clears frontend state. No delete request is sent.

The uploaded file content does not determine the result in Phase 1A. The UI must continue to identify the result as synthetic/prototype data.

## 7. File-intake behavior

### Accepted boundary

- Minimum: one file.
- Maximum: five files.
- Maximum size: 20 MiB per file (`20 * 1024 * 1024` bytes).
- Extensions: `.pdf`, `.xlsx`, `.csv`, case-insensitive.
- Declared content types: approved PDF/XLSX/CSV types plus `application/octet-stream` for browser compatibility.
- Duplicate filenames in the same request are invalid.

Phase 1A does not inspect magic bytes or parse document contents because the synthetic demo files are placeholders rather than real financial documents. This limitation must be documented and must not be described as production file security.

### Validation responses

| Condition | HTTP | Contract code |
| --- | ---: | --- |
| Zero files, more than five, duplicate names, or malformed multipart request | 422 | `INVALID_FILE_SET` |
| Unsupported extension or declared content type | 415 | `UNSUPPORTED_FILE_TYPE` |
| A streamed file exceeds 20 MiB | 413 | `FILE_TOO_LARGE` |

File streams must be closed in success and failure paths. Raw file content must not be written to disk, retained in the analysis record, returned, or logged.

## 8. In-memory lifecycle

### Record

Each analysis record contains only:

- analysis ID;
- document IDs;
- sanitized file metadata required for the response/test;
- selected development scenario;
- monotonic creation time; and
- no raw file bytes.

### Stage sequence

1. `validate`
2. `extract`
3. `normalize`
4. `calculate`
5. `detect`
6. `explain`

The backend derives stage state from elapsed monotonic time. The default temporary timing decision is approximately 900 ms per stage, chosen to match the existing frontend polling interval and keep the demo below ten seconds. Tests must use an injected/fake clock rather than sleeping.

Repeated GET requests do not advance state by themselves. Two clients querying the same analysis at the same moment receive the same logical state.

### Restart behavior

The registry is intentionally ephemeral. Restarting the backend removes all analysis IDs. A later request returns `ANALYSIS_NOT_FOUND`; the frontend offers **Start over**. This is the approved recovery path.

Run one backend worker only. Multiple workers would create separate registries and are outside Phase 1A.

## 9. Result and financial-data rules

- Load `src/fixtures/sample-analysis.json` read-only at application startup.
- Validate the fixture against the committed contract before serving traffic.
- Return numeric transport values as decimal strings.
- Do not recompute or change fixture financial values in Phase 1A.
- Do not change field, KPI, ratio, trend, anomaly, insight, or evidence counts.
- Preserve 19 fields, 17 extracted values, 19 calculations, 6 KPIs, 7 ratios, 25 trend points across 5 periods, 7 anomalies, 3 insights, and 3 manual-review fields.
- Preserve `Debt-to-equity = Borrowings / Shareholders' equity`:
  - FY2025: `54,600 / 48,210 = 1.13x`.
  - FY2024: `38,150 / 46,880 = 0.81x`.
- `total_liabilities` remains a separate target field and is not substituted into the debt-to-equity formula.
- Preserve explicit `not_present`, `not_readable`, and `conflicting` states; never invent unavailable amounts.

## 10. Error and boundary journeys

### Result before completion

WHEN result is requested before terminal completion, THE SYSTEM SHALL return HTTP 409 with `RESULT_NOT_READY` and SHALL preserve the analysis.

### Unknown analysis

WHEN status, result, or evidence is requested for an unknown/restarted analysis ID, THE SYSTEM SHALL return HTTP 404 with `ANALYSIS_NOT_FOUND`.

### Unknown evidence

WHEN an existing analysis requests an unknown evidence ID, THE SYSTEM SHALL return HTTP 404 with `EVIDENCE_NOT_FOUND` and SHALL leave the analysis usable.

### Processing failure scenario

A development-only deterministic filename convention may select `processing_failed`. The status sequence must show real progress and then terminal `failed` with a contract `ApiError`. It must not expose a hidden production control.

### Repeated and concurrent calls

- Repeated POST requests create distinct analyses; no idempotency key is defined in Phase 1A.
- Concurrent GET requests are read-only and return contract-compatible responses.
- Repeated evidence requests return the same immutable binding.
- Invalid requests do not create an analysis record.

## 11. Frontend integration requirements

Add two non-secret environment settings:

```text
NEXT_PUBLIC_API_MODE=mock | backend
FINTRACE_BACKEND_URL=http://127.0.0.1:8000
```

Behavior:

- `mock` mode preserves the existing MSW behavior.
- `backend` mode does not start MSW.
- The frontend continues using relative `/api/v1` paths.
- Next.js rewrites `/api/v1/:path*` to `FINTRACE_BACKEND_URL/api/v1/:path*` in backend mode.
- Direct browser CORS configuration is unnecessary for the approved same-origin path.
- The upload notice must be truthful in each mode:
  - mock: files stay in the browser;
  - backend: files are sent to the configured Phase 1A backend, validated, and discarded without persistence.

No component may bypass the existing typed API hooks.

## 12. Security, privacy, and operational boundary

### Required controls

- Bind local development to loopback by default.
- Accept only synthetic/public/redacted files.
- Enforce count and streamed-size limits server-side.
- Close and discard every upload stream.
- Do not log raw bodies, raw file bytes, financial excerpts, or secrets.
- Do not enable permissive wildcard CORS because the approved integration uses a same-origin rewrite.
- Do not add secrets or external services.
- Return generic 500 envelopes; do not expose stack traces in API responses.

### Disclosures

Phase 1A has no authentication, malware scanning, true MIME verification, sandboxed parser, persistence, encryption-at-rest, retention system, backups, multi-worker consistency, rate limiting, or production hardening. It is not safe or authorized for confidential or production financial reports.

## 13. Acceptance criteria

| ID | Observable requirement |
| --- | --- |
| BE-001 | WHEN one to five valid files are posted, THE SYSTEM SHALL return HTTP 202 matching `CreateAnalysisResponse` with unique opaque IDs. |
| BE-002 | WHEN zero, six, duplicate, unsupported, or oversized files are posted, THE SYSTEM SHALL return the specified 422/415/413 contract error and SHALL create no analysis. |
| BE-003 | WHEN a valid file is accepted or rejected, THE SYSTEM SHALL close its stream and SHALL retain no raw file bytes. |
| BE-004 | WHEN status is polled, THE SYSTEM SHALL return the six contract stages derived from elapsed time and SHALL not mutate state merely because GET was called. |
| BE-005 | WHEN lifecycle completes, THE SYSTEM SHALL return `completed_with_review_flags`, 17/19 coverage, and three manual-review fields. |
| BE-006 | WHEN result is requested early, THE SYSTEM SHALL return 409 `RESULT_NOT_READY`; after completion it SHALL return the contract-valid fixture result. |
| BE-007 | WHEN an unknown analysis or evidence ID is requested, THE SYSTEM SHALL return the correct 404 error without an unhandled exception. |
| BE-008 | THE SYSTEM SHALL return decimal strings and preserve all approved fixture values, counts, statuses, formulas, and references. |
| BE-009 | THE SYSTEM SHALL preserve Debt-to-equity as Borrowings divided by Shareholders' equity with 1.13x and 0.81x results. |
| BE-010 | WHEN backend mode is selected, THE FRONTEND SHALL skip MSW and complete upload → polling → result → five evidence-entry types through FastAPI. |
| BE-011 | WHEN mock mode is selected, THE EXISTING FRONTEND SHALL continue to work without FastAPI. |
| BE-012 | WHEN the backend restarts, stale analysis IDs SHALL return 404 and the frontend SHALL provide Start over. |
| BE-013 | THE SYSTEM SHALL expose the committed contract through Swagger/OpenAPI without adding unapproved business operations. |
| BE-014 | THE SYSTEM SHALL pass format, lint, type, unit, API, contract, fixture-reference, and end-to-end checks defined in `BACKEND-TECH-STACK.md`. |

## 14. Definition of done

Phase 1A is `implemented` when code exists for the backend and frontend mode switch.

It is `verified` only when evidence shows:

- all BE requirements map to tests;
- the committed OpenAPI YAML parses and has exactly four business operation IDs;
- response bodies validate against the committed schemas;
- the fixture and all references validate;
- backend unit/API/contract tests pass without real sleeps;
- frontend typecheck, lint, API generation, and production build pass;
- both mock and backend modes pass their critical browser journey;
- no uploaded bytes remain after requests;
- no database, OCR, LLM, Experian, T3, auth, queue, or production service was added; and
- known limitations and rollback instructions are disclosed.

It is `accepted` only after the Product Owner runs the demo and approves behavior. No production deployment or release is authorized by Phase 1A.

## 15. Deferred decisions

The following belong to separately approved Phase 1B or later work:

- real PDF/XLSX/CSV extraction and OCR;
- persistent analysis URLs and database schema;
- object storage and deletion/retention;
- background jobs and recovery;
- real financial calculation/rule engine;
- real LLM explanation and grounding controls;
- Experian integration;
- T3 ADK and trusted-agent workflow;
- authentication, roles, tenancy, audit logging, and production security.

Open blocking decision branches for Phase 1A: **0**.
