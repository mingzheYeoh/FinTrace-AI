# FinTrace AI — Technical Stack

| Field | Value |
| --- | --- |
| Version | 1.1 — Frontend-first / contract-first |
| Related document | `PRD.md` v1.1 |
| Current delivery phase | Existing v0 frontend plus mock API seam |
| Project tier | T1 — hackathon/portfolio prototype |
| Task risk | Yellow — API and financial-data contract |
| Enforcement | Advisory-only |

## 1. Delivery strategy

FinTrace AI will settle the frontend behavior and API contract before building the real backend.

```text
PRD v1.1
  → OpenAPI 3.1 contract
  → generated TypeScript types
  → typed feature API functions
  → TanStack Query hooks
  → MSW handlers using a deterministic JSON fixture
  → existing Ant Design components
  → verified frontend behavior
  → future backend implementing the same four operations
```

Switching from the Phase 0 mock to the future backend must require an environment/base-URL change, not component rewrites.

## 2. Source-of-truth order

When artifacts conflict, use this order:

1. `PRD.md` — approved behavior, quantities, and non-goals.
2. `docs/api/openapi.yaml` — operations, schemas, and enums.
3. `docs/FRONTEND-API-MAP.md` — UI action-to-operation mapping.
4. `TECH-STACK.md` — implementation boundary and selected technology.
5. `src/fixtures/sample-analysis.json` — deterministic example data.
6. Generated TypeScript types — derived output; never edit manually.
7. Component implementation.

An implementation agent must not edit a higher-priority source merely to make generated code pass.

## 3. Current frontend baseline

Keep the versions already selected by the downloaded v0 project unless a compatibility failure is demonstrated:

| Layer | Current baseline | Purpose |
| --- | --- | --- |
| Framework | Next.js 16.3.2 App Router | Routing, rendering, development, Vercel preview |
| Runtime UI | React 19.2.8 | Component runtime |
| Language | TypeScript 5.9, strict mode | Compile-time contract safety |
| Component system | Ant Design 6.6.1 | All interface components and design tokens |
| Charts | `@ant-design/charts` 2.6.7 | Trend and ratio visualization |
| Icons | `@ant-design/icons` 6.3.2 | Ant-compatible icons |
| Styling | Ant `ConfigProvider`, CSS, existing theme tokens | Layout and application styling |

Rules:

- Do not upgrade Next.js, React, TypeScript, Ant Design, or charts during the API-seam change.
- Do not add shadcn/ui, Material UI, Carbon React, Chakra UI, or a second component library.
- Keep the existing light financial-workspace visual direction.
- Preserve the split revenue and profit/cash-flow chart panels.
- Keep tables internally scrollable at mobile widths.

## 4. Packages to add for the API seam

| Package | Role | Runtime/development |
| --- | --- | --- |
| `@tanstack/react-query` | Mutation, polling, result cache, evidence cache, retries | Runtime |
| `openapi-fetch` | Typed HTTP client generated from OpenAPI paths | Runtime |
| `msw` | Browser-side interception of the four real HTTP calls | Development/Phase 0 runtime |
| `openapi-typescript` | Generate TypeScript definitions from `openapi.yaml` | Development |

No database, ORM, authentication SDK, object-storage SDK, LLM SDK, T3 SDK, or queue package is approved for Phase 0.

## 5. Frontend structure

```text
src/
├── fixtures/
│   └── sample-analysis.json
├── features/
│   ├── analysis/
│   │   ├── api.ts
│   │   └── queries.ts
│   └── evidence/
│       ├── api.ts
│       └── queries.ts
├── lib/
│   └── api/
│       ├── client.ts
│       ├── generated.d.ts
│       └── query-keys.ts
└── mocks/
    ├── browser.ts
    ├── handlers.ts
    └── scenarios.ts
```

The existing `app/` and `components/` folders remain. Only `src/mocks/handlers.ts` and mock-scenario helpers may import `sample-analysis.json`.

### Component boundary

- Components never import the fixture.
- Components never call `fetch` directly.
- Components call feature hooks or receive data through props.
- Feature API functions use the single `openapi-fetch` client.
- Contract enums come from generated types; do not duplicate them in `lib/types.ts`.
- UI-only state such as drawer visibility and chart mode remains local.

## 6. API and Swagger

The approved OpenAPI 3.1 document is:

```text
docs/api/openapi.yaml
```

It contains exactly four Phase 0 operations:

1. `createAnalysis`
2. `getAnalysisStatus`
3. `getAnalysisResult`
4. `getEvidenceDetail`

Use Swagger Editor, Swagger UI, or a VS Code OpenAPI viewer to inspect the file. A runtime `/api-docs` page is optional and must not block the frontend seam.

Generate types with:

```bash
npx openapi-typescript docs/api/openapi.yaml -o src/lib/api/generated.d.ts
```

Recommended scripts:

```json
{
  "typecheck": "tsc --noEmit",
  "generate:api": "openapi-typescript docs/api/openapi.yaml -o src/lib/api/generated.d.ts",
  "check:api": "npm run generate:api && npm run typecheck"
}
```

The generated file is protected output: regenerate it from OpenAPI; never hand-edit it.

## 7. Mock API design

MSW intercepts the same paths, methods, request bodies, response shapes, and status codes that the future backend will expose.

### Happy-path behavior

1. `createAnalysis` accepts one to five `File` objects and returns HTTP 202.
2. `getAnalysisStatus` advances deterministically through six fixture-defined stages.
3. The terminal lifecycle status is `completed` and the outcome is `completed_with_review_flags`.
4. `getAnalysisResult` returns the complete dashboard payload.
5. `getEvidenceDetail` returns an evidence binding containing fact and calculation IDs.
6. The drawer resolves those IDs against the cached result, which contains source locations and calculation provenance.

### Required mock scenarios

| Scenario | Trigger | Expected UI |
| --- | --- | --- |
| `happy_path_with_review_flags` | Demo files/default | 17/19 fields and three review flags |
| `unsupported_file` | Unsupported extension/MIME | Upload guidance; queue preserved |
| `file_too_large` | More than 20 MB | Upload guidance; queue preserved |
| `too_many_files` | Sixth queued file | Five-file limit guidance |
| `processing_failed` | Deterministic development trigger | Polling stops; restart offered |
| `result_not_ready` | Result requested before completion | HTTP 409; processing state preserved |
| `analysis_not_found` | Unknown analysis ID | Recoverable full-page error |
| `evidence_not_found` | Unknown evidence ID | Drawer error; dashboard remains usable |

Development-only scenario selection may use a query string, a deterministic filename, or a local control. It must not appear as an unexplained production feature.

## 8. TanStack Query behavior

Recommended keys:

```text
["analysis", "create"]
["analysis", analysisId, "status"]
["analysis", analysisId, "result"]
["analysis", analysisId, "evidence", evidenceId]
```

Rules:

- Poll status only while the lifecycle is non-terminal.
- Do not fetch the result before status is `completed`.
- Cache evidence by `analysisId` and `evidenceId`.
- Do not automatically retry HTTP 404, 409, 413, 415, or 422.
- Allow one manual retry for evidence network/5xx failure.
- Cancelling or starting over clears the active analysis state and relevant query cache.
- Phase 0 refresh reset is accepted; do not add persistence solely to prevent it.

## 9. Financial data model

### Separation of concerns

| Concept | Contract representation |
| --- | --- |
| Lifecycle | `AnalysisLifecycleStatus` |
| Completion quality | `CompletionOutcome` |
| Overall coverage | `ExtractionSummary` |
| Per-field availability/quality | `ValueStatus` |
| Extraction confidence | `Confidence` |
| User review need | `requires_manual_review` |

`partial` is intentionally absent from `ValueStatus`. A 17/19 result is represented by `ExtractionSummary` and `completed_with_review_flags`.

Financial numeric values are decimal strings in API/JSON payloads. UI code converts them only for rendering/chart adapters. This avoids binary floating-point becoming the transport source of truth.

The future backend owns authoritative normalized values, changes, ratios, rule results, and formula substitutions. Phase 0 fixtures simulate that backend output.

## 10. Security and data handling

### Phase 0 guarantees

- Demo data is synthetic.
- The client validates extension/count/size before creating the request.
- MSW intercepts requests in the browser; no production upload endpoint exists.
- The API client uses relative `/api/v1` paths, so disabling MSW fails locally instead of sending files to a third party.
- Existing response headers remain enabled.
- No secrets or API keys are required.

### Explicit limitations

- Client validation is not production file security.
- The prototype does not scan malware, inspect true MIME signatures, sandbox parsers, encrypt stored documents, enforce retention, or provide access control.
- The prototype must not claim production security or compliance.

Future production upload design is a separate red/yellow review and is not authorized by this document.

## 11. Future backend boundary — not Phase 0 implementation

When the frontend contract is accepted, a future backend may implement the same OpenAPI using FastAPI and Pydantic. Storage, OCR, workers, LLM providers, Experian access, PostgreSQL, and T3 ADK require separate decisions and specifications.

The backend handoff can begin only after the Product Owner accepts:

- the four operations in Swagger/OpenAPI;
- all request and response schemas;
- lifecycle and value-status enums;
- the 19-field fixture and calculations;
- every success/failure UI behavior; and
- evidence linkage for all material items.

## 12. Verification and release state

Required checks for this yellow change:

- OpenAPI YAML parse.
- OpenAPI TypeScript generation.
- TypeScript strict check.
- Lint and production build.
- Zero direct fixture imports from the nine UI components.
- Four MSW handler paths with exact operation IDs.
- Fixture referential-integrity check for facts, calculations, and evidence IDs.
- Browser journey: upload → processing → dashboard → evidence.
- Visual checks at 1184×776 and 390×844.

The change remains `planned` until v0 implements it, `implemented` after code changes, `verified` after the checks above, and `accepted` only after Product Owner preview approval. No production release is authorized.
