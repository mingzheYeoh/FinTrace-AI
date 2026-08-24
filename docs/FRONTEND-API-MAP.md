# FinTrace AI — Frontend/API Map

| Field | Value |
| --- | --- |
| Version | 1.1 |
| Product scope | Phase 0 frontend with MSW mock API |
| Contract | `docs/api/openapi.yaml` |
| Fixture | `src/fixtures/sample-analysis.json` |

## 1. Classification rule

Every interactive element is one of:

- **UI-only** — local visual state; no API call.
- **API write** — creates or changes an analysis resource.
- **API read** — retrieves server-owned analysis or evidence state.

Components do not import the fixture, call `fetch`, or construct URL strings. They use feature hooks backed by the generated OpenAPI client.

## 2. Screen-to-operation map

### Upload screen

| UI element/action | Class | operationId | Request/input | Success behavior | Boundary/failure behavior |
| --- | --- | --- | --- | --- | --- |
| Drop/select files | UI-only | — | Browser `File` objects | Stage valid files | Reject unsupported, duplicate, >20 MB, or sixth file without changing valid queue |
| Remove queued file | UI-only | — | Staged-file ID | Remove one item | No effect on other files |
| Use demo files | UI-only | — | Creates two synthetic browser `File` objects | Stage PDF + XLSX demo set | No external request |
| Run analysis | API write | `createAnalysis` | `multipart/form-data`, `files[]` | Save `analysis_id`; show processing | Map 413/415/422/5xx/network error to actionable upload error |

### Processing screen

| UI element/action | Class | operationId | Request/input | Success behavior | Boundary/failure behavior |
| --- | --- | --- | --- | --- | --- |
| Screen load/poll | API read | `getAnalysisStatus` | `analysisId` | Render lifecycle, progress, six stages, logs, and coverage | 404 → recoverable analysis error; 5xx/network → retry state |
| Terminal `completed` | API read | `getAnalysisResult` | Same `analysisId` | Cache result and enable dashboard | 409 → keep processing; 404 → recoverable error |
| Cancel/start over | UI-only | — | Active analysis state | Clear active analysis and query cache; return to upload | No delete endpoint in Phase 0 |
| Open dashboard | UI-only | — | Cached completed result | Render dashboard | Disabled before terminal completion |

Polling rules:

- Poll only while lifecycle status is not `completed` or `failed`.
- Use the server/fixture-provided `stages`; do not reproduce the pipeline with local component timers.
- The final lifecycle is `completed`; the final outcome is `completed_with_review_flags`.

### Dashboard

Dashboard data comes from cached `getAnalysisResult` output.

| UI element/action | Class | operationId | Evidence ID source | Success behavior | Failure behavior |
| --- | --- | --- | --- | --- | --- |
| Case header | API read/cache | `getAnalysisResult` | — | Render company, documents, periods, 17/19 coverage, 3 reviews | Result-level error view |
| KPI card | API read | `getEvidenceDetail` | `kpi.evidence_id` | Open evidence drawer | Drawer error; dashboard remains visible |
| Financial-field row | API read | `getEvidenceDetail` | `field.evidence_id` | Open field/current/prior sources | Drawer error; dashboard remains visible |
| Ratio row | API read | `getEvidenceDetail` | `ratio.evidence_id` | Open formula/current/prior inputs | Drawer error; dashboard remains visible |
| Absolute/Margins toggle | UI-only | — | — | Switch cached trend view | Preserve selection during current page session |
| Anomaly Trace evidence | API read | `getEvidenceDetail` | `anomaly.evidence_id` | Open facts, calculations, and follow-up | Drawer error; dashboard remains visible |
| Insight Trace evidence | API read | `getEvidenceDetail` | `insight.evidence_id` | Open facts, calculations, and narrative | Drawer error; dashboard remains visible |
| New analysis | UI-only | — | — | Clear active analysis/result/evidence caches; return to upload | No backend delete implied |

### Evidence drawer

| UI element/action | Class | operationId | Success behavior | Failure behavior |
| --- | --- | --- | --- | --- |
| Open drawer | API read | `getEvidenceDetail` | Load evidence binding; resolve returned IDs against cached result | Loading skeleton followed by recoverable drawer error |
| Retry evidence | API read | `getEvidenceDetail` | Replace error with detail | Keep error and close action after failure |
| Close drawer | UI-only | — | Close without clearing analysis result | No effect on dashboard |

The result payload contains financial-field source records and deterministic calculation provenance. `getEvidenceDetail` selects which facts/calculations belong to the clicked UI item; this keeps the Phase 0 endpoint simple and deterministic.

## 3. Approved API modules

### Analysis module

#### `createAnalysis`

```text
POST /api/v1/analyses
```

Frontend sends one to five files. No user ID, authentication token, case ID, T3 grant, or persistence instruction is included.

Frontend stores:

- `analysis_id`
- `document_ids`
- `status_url`
- `result_url`

#### `getAnalysisStatus`

```text
GET /api/v1/analyses/{analysisId}/status
```

Frontend uses:

- `status` to control polling and terminal transitions;
- `completion_outcome` to distinguish ordinary completion from review flags;
- `progress_percent` and `active_stage` for progress;
- `stages` for the six-step UI and log;
- `extraction_summary` for 17/19 and three review flags; and
- `error` for the failed state.

#### `getAnalysisResult`

```text
GET /api/v1/analyses/{analysisId}/result
```

Frontend uses:

- `summary` for company/source/period/coverage context;
- `fields` for the 19-row comparison table and source records;
- `calculations` for deterministic formula provenance;
- `kpis` for six cards;
- `ratios` for seven ratio rows;
- `trends` for the five-period chart;
- `anomalies` for seven alerts;
- `insights` for three narrative cards; and
- `follow_up_questions` for five questions.

### Evidence module

#### `getEvidenceDetail`

```text
GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}
```

Frontend uses:

- `fact_ids` to select financial fields from cached result;
- `calculation_ids` to select formulas from cached result;
- `title` and `subtitle` for drawer context;
- optional `narrative` for AI interpretations; and
- optional `follow_up` for anomalies.

## 4. Query keys and cache rules

```text
mutation: ["analysis", "create"]
query:    ["analysis", analysisId, "status"]
query:    ["analysis", analysisId, "result"]
query:    ["analysis", analysisId, "evidence", evidenceId]
```

- Do not fetch result before terminal completion.
- Do not retry HTTP 404, 409, 413, 415, or 422 automatically.
- Cache evidence by analysis and evidence ID.
- A network/5xx evidence failure may have one manual retry.
- Starting over removes the active analysis queries.

## 5. Status model

### Lifecycle status

```text
accepted
validating
extracting
normalizing
calculating
detecting_exceptions
generating_explanation
completed
failed
```

### Completion outcome

```text
completed
completed_with_review_flags
```

### Field value status

```text
verified
not_present
not_readable
ambiguous
conflicting
failed
```

`partial` is not a field status. The overall 17/19 condition is expressed by `ExtractionSummary`.

## 6. Error map

| HTTP | Contract code | UI owner | Required behavior |
| --- | --- | --- | --- |
| 404 | `ANALYSIS_NOT_FOUND` | Processing/result | Recoverable page; return to upload |
| 404 | `EVIDENCE_NOT_FOUND` | Evidence drawer | Drawer error only; dashboard remains usable |
| 409 | `RESULT_NOT_READY` | Processing/result | Preserve processing and continue/offer retry |
| 413 | `FILE_TOO_LARGE` | Upload | Identify 20 MB per-file limit |
| 415 | `UNSUPPORTED_FILE_TYPE` | Upload | Identify PDF/XLSX/CSV formats |
| 422 | `INVALID_FILE_SET` | Upload | Identify one-to-five-file requirement |
| 500 | `PROCESSING_FAILED` | Processing | Stop polling; offer start over |

## 7. Direct-import migration inventory

These nine current components import `lib/mock-data.ts` and must be migrated:

1. `components/upload/upload-panel.tsx`
2. `components/processing/processing-view.tsx`
3. `components/dashboard/case-header.tsx`
4. `components/dashboard/kpi-grid.tsx`
5. `components/dashboard/period-comparison.tsx`
6. `components/dashboard/trend-charts.tsx`
7. `components/dashboard/anomaly-panel.tsx`
8. `components/dashboard/insights-panel.tsx`
9. `components/evidence/evidence-drawer.tsx`

Expected final state:

- zero component imports from `lib/mock-data.ts`;
- only mock handlers import the JSON fixture;
- data is passed via feature hooks, context, or props;
- all request/response types originate from generated OpenAPI definitions.

## 8. Backend handoff gate

Backend implementation remains blocked until the Product Owner accepts:

- all four operations in OpenAPI/Swagger;
- all schemas and enums;
- the 19-field fixture and 17/19/3 coverage semantics;
- the success/failure behavior above; and
- evidence linkage for every material item.
