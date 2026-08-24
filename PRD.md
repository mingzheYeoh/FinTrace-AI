# FinTrace AI — Product Requirements Document

> Turn financial reports into traceable insights.

| Field | Value |
| --- | --- |
| Version | 1.1 — Phase 0 contract alignment |
| Product | FinTrace AI |
| Challenge | AI-Powered Financial Report Analysis — Experian |
| Delivery status | Frontend implemented; API seam planned |
| Project tier | T1 — hackathon/portfolio prototype |
| Data policy | Synthetic, public, or redacted demonstration data only |

## 1. Instructions for AI agents

This PRD is the product source of truth for the Phase 0 prototype. Read it before changing code, tests, fixtures, API contracts, or UI behavior.

An implementation agent MUST:

1. Preserve the current Ant Design information architecture and responsive layout.
2. Route all server-like interactions through the approved OpenAPI client and MSW mock API.
3. Keep the complete judge demo within three to five minutes.
4. Keep every material figure, calculation, anomaly, and insight traceable to evidence.
5. Never invent, repair, merge, or silently substitute a missing, unreadable, ambiguous, conflicting, or failed value.
6. Use deterministic code for financial calculations and rule evaluation; AI may explain results but must not create financial values.
7. Present anomalies as investigation prompts, not findings of fraud, insolvency, misconduct, or financial distress.
8. Use Ant Design 6 as the only component system.
9. Stop and request a product decision before expanding the approved endpoints, trust boundary, or persistence scope.

The agent MUST NOT add authentication, a database, persistent document storage, a production extraction service, a job queue, real Experian access, payments, credit decisions, or T3 ADK during Phase 0.

## 2. Problem statement

Financial teams review reports and spreadsheets to understand performance and risk. Manual review is slow and error-prone because figures are distributed across pages, worksheets, formats, units, and reporting periods. Generic AI summaries are also difficult to trust when their conclusions are not connected to the source.

Users need a fast way to:

- locate and normalize financial figures;
- compare reporting periods;
- calculate ratios consistently;
- detect noteworthy movements and data-quality exceptions;
- understand the observations in plain language; and
- verify every conclusion against the original evidence.

## 3. Product definition

FinTrace AI is a financial-report analysis workspace that converts one analysis file set into structured, explainable, and traceable financial insights.

The primary experience is a dashboard, not a generic chatbot. It supports decisions but does not make lending, investment, audit, legal, or tax decisions.

### Product principles

- Evidence before narrative.
- Calculations before interpretation.
- No silent uncertainty.
- Dashboard first, chat later.
- One convincing vertical slice before production infrastructure.

## 4. Phase 0 outcome

During a three-to-five-minute demo, a user can:

1. stage a synthetic or local PDF, XLSX, or CSV file set;
2. start a mocked analysis through the same API boundary intended for the backend;
3. observe six processing stages and a truthful completion outcome;
4. review two-period financial performance and five-period trend context;
5. inspect KPIs, deterministic ratios, anomalies, and AI-style explanations; and
6. open the evidence trail for every material item.

Phase 0 is successful when the frontend no longer depends directly on a static TypeScript data module and can later switch from MSW to a compatible backend without changing component data shapes.

## 5. Users

| User | Need |
| --- | --- |
| Financial analyst | Review performance quickly and verify every figure. |
| Finance manager or credit reviewer | Identify performance, liquidity, leverage, cash-flow, and data-quality issues for follow-up. |
| SME owner | Understand financial results in accessible language without losing the underlying evidence. |

Phase 0 is single-user and has no identity, roles, tenancy, or permissions.

## 6. Approved Phase 0 scope

### Included

- One frontend-only analysis workflow: upload, processing, dashboard, evidence drawer.
- One synthetic company and one deterministic demo file set.
- Up to five staged files per analysis.
- Searchable PDF, XLSX, and structured CSV; maximum 20 MB per file.
- Two primary comparison periods: FY2025 and FY2024.
- Five-period synthetic trend context: FY2021–FY2025.
- Nineteen target financial fields.
- Nineteen deterministic calculations.
- Six KPI cards.
- Seven ratio-comparison rows.
- Seven anomaly/data-quality alerts.
- Three evidence-grounded AI-style insights and five follow-up questions.
- Six mocked processing stages.
- Loading, empty, warning, unsupported-file, too-large, failed, not-ready, and not-found states.
- Desktop and mobile responsive behavior.
- Four OpenAPI operations implemented through a typed client, TanStack Query, and MSW.

### Explicitly excluded

- Login, roles, teams, and multi-tenancy.
- Database, object storage, persistence, or linkable saved dashboards.
- Production file upload or document parsing.
- Production OCR. The demo may model a future OCR failure using synthetic fixture data.
- Real AI/LLM calls.
- Redis, Celery, queues, workers, or durable workflows.
- Real Experian API access or paid financial reports.
- T3 ADK, T3N identity, grants, or TEE contracts.
- Export, payments, subscriptions, credit scoring, and industry benchmarking.
- Production security, compliance, retention, or data-residency claims.

Refreshing the page may return the user to the upload screen. This limitation must remain visible and is accepted for Phase 0.

## 7. Demonstration data contract

### 7.1 Reporting context

| Attribute | Value |
| --- | --- |
| Company | Northwind Components Bhd (synthetic) |
| Currency | MYR |
| Unit scale | Thousands |
| Current period | FY2025 |
| Prior period | FY2024 |
| Trend periods | FY2021–FY2025 |
| Demo sources | One PDF and one XLSX |

### 7.2 Nineteen target financial fields

| ID | Field key | Display label |
| --- | --- | --- |
| FIELD-01 | `revenue` | Revenue |
| FIELD-02 | `cost_of_sales` | Cost of sales |
| FIELD-03 | `gross_profit` | Gross profit |
| FIELD-04 | `operating_profit` | Operating profit |
| FIELD-05 | `profit_before_tax` | Profit before tax |
| FIELD-06 | `net_profit` | Net profit |
| FIELD-07 | `operating_cash_flow` | Operating cash flow |
| FIELD-08 | `current_assets` | Current assets |
| FIELD-09 | `non_current_assets` | Non-current assets |
| FIELD-10 | `total_assets` | Total assets |
| FIELD-11 | `current_liabilities` | Current liabilities |
| FIELD-12 | `non_current_liabilities` | Non-current liabilities |
| FIELD-13 | `total_liabilities` | Total liabilities |
| FIELD-14 | `shareholders_equity` | Shareholders' equity |
| FIELD-15 | `borrowings` | Borrowings |
| FIELD-16 | `trade_receivables` | Trade receivables |
| FIELD-17 | `trade_payables` | Trade payables |
| FIELD-18 | `inventory` | Inventory |
| FIELD-19 | `cash` | Cash and cash equivalents |

The demo result reports 17 of 19 target fields with normalized values. It also reports exactly three review flags:

1. `trade_receivables` — conflicting values across the PDF and XLSX; both values are retained.
2. `trade_payables` — source region is not readable; no value is substituted.
3. `profit_before_tax` — not present as a separate line item; absence is not treated as extraction failure.

### 7.3 Value status model

`partial` is not a field-level `ValueStatus`.

Allowed field statuses are:

- `verified`
- `not_present`
- `not_readable`
- `ambiguous`
- `conflicting`
- `failed`

Confidence is separate: `high`, `medium`, or `low`.

Each field also carries `requires_manual_review`. Partial completion belongs at analysis level:

```text
completion_outcome = completed | completed_with_review_flags
extraction_summary = targeted_fields + extracted_fields + manual_review_count
```

### 7.4 Evidence requirements

Each normalized period value retains:

- period, currency, and unit scale;
- normalized value or an explicit `null`;
- original raw value when present;
- source document and page/sheet/cell/table locator;
- a short source excerpt;
- confidence and status; and
- conflict details when two sources disagree.

## 8. Required analysis

### 8.1 Six KPI cards

1. Revenue.
2. Net profit.
3. Operating cash flow.
4. Net profit margin.
5. Current ratio.
6. Debt-to-equity.

Each card shows the current value, prior value, change, semantic direction, and evidence action.

### 8.2 Seven ratio rows

1. Gross profit margin.
2. Operating margin.
3. Net profit margin.
4. Current ratio.
5. Debt-to-equity.
6. Return on assets.
7. Return on equity.

The API supplies formulas, inputs, substitutions, results, and evidence IDs. The frontend does not invent authoritative calculations.

### 8.3 Seven anomaly and data-quality alerts

| Rule ID | Observation |
| --- | --- |
| `RULE-PROFIT-CASH-DIVERGENCE` | Profit is positive while operating cash flow is negative. |
| `RULE-REVENUE-UP-PROFIT-DOWN` | Revenue increased while net profit fell. |
| `RULE-WORKING-CAPITAL-DEFICIT` | Current liabilities exceed current assets. |
| `RULE-DEBT-INCREASE` | Borrowings rose materially between periods. |
| `RULE-RECEIVABLES-VS-REVENUE` | Receivables grew faster than revenue. |
| `RULE-VALUE-CONFLICT` | Trade receivables conflict across two documents. |
| `RULE-LOW-CONFIDENCE-EXTRACTION` | Trade payables could not be read reliably. |

Each alert has severity, rule ID, evidence, a follow-up question, and an explicit manual-review flag where applicable.

### 8.4 AI-style insights

AI-style narrative may summarize verified changes, explain patterns, and suggest follow-up questions. It must:

- introduce no new financial figure;
- distinguish observation from interpretation;
- avoid inventing causes;
- cite facts and calculations by ID; and
- provide a working evidence action.

## 9. Processing lifecycle

The mocked lifecycle has six visible stages:

1. `validate` — file type, size, and parseability.
2. `extract` — locate values and source positions.
3. `normalize` — resolve periods, currency, units, and signs.
4. `calculate` — run deterministic changes and ratios.
5. `detect` — evaluate anomaly and data-quality rules.
6. `explain` — generate evidence-grounded narrative.

The terminal lifecycle state is `completed`; the terminal outcome is `completed_with_review_flags`. The UI displays **Completed with review flags**, not a false all-green success.

## 10. Required screens and behavior

### Upload

- Multi-file drag-and-drop queue with removal and duplicate prevention.
- Client-side extension and 20 MB per-file validation.
- Maximum five files per analysis.
- **Use demo files** creates a deterministic synthetic file set.
- **Run analysis** calls `createAnalysis` through the typed API client.
- Phase 0 notice states that MSW intercepts the request and no file leaves the browser.

### Processing

- Poll `getAnalysisStatus` through TanStack Query.
- Render all six server-provided stage states and logs.
- Stop polling on `completed` or `failed`.
- Show 17/19 coverage and three review flags on completion.
- Do not use component-owned timers as the source of truth.

### Dashboard

- Case header, source documents, periods, currency, coverage, and review count.
- Six KPI cards.
- Nineteen-field two-period comparison table.
- Seven deterministic ratio rows.
- Five-period Absolute/Margins trend toggle.
- Separate revenue and profit/cash-flow panels in Absolute mode.
- Seven anomaly alerts, three insights, and five follow-up questions.
- Every material item carries an `evidence_id`.

### Evidence drawer

- Call `getEvidenceDetail` when opened.
- Show loading, success, empty, recoverable error, and retry states.
- Resolve the returned fact/calculation IDs against the cached analysis result.
- Show source document, locator, raw text, excerpt, normalized value, status, confidence, conflict detail, formula, inputs, and substitution as applicable.

## 11. API boundary

Phase 0 has exactly four operations:

| operationId | Method and path | Purpose |
| --- | --- | --- |
| `createAnalysis` | `POST /api/v1/analyses` | Submit the staged file set and create an analysis. |
| `getAnalysisStatus` | `GET /api/v1/analyses/{analysisId}/status` | Poll lifecycle, progress, and review coverage. |
| `getAnalysisResult` | `GET /api/v1/analyses/{analysisId}/result` | Load the dashboard result. |
| `getEvidenceDetail` | `GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}` | Load the evidence binding for the drawer. |

UI components MUST NOT import the fixture or call `fetch` directly. Only MSW handlers may read the fixture.

## 12. Acceptance criteria

| ID | Observable requirement |
| --- | --- |
| FR-001 | WHEN the user selects an unsupported file, THE SYSTEM SHALL reject it before starting analysis and preserve the existing queue. |
| FR-002 | WHEN a file exceeds 20 MB or the queue would exceed five files, THE SYSTEM SHALL reject it with actionable guidance. |
| FR-003 | WHEN the user starts analysis, THE SYSTEM SHALL call `createAnalysis` through the typed client; no component shall import the fixture. |
| FR-004 | WHEN processing is active, THE SYSTEM SHALL poll `getAnalysisStatus` and render the six API-provided stages. |
| FR-005 | WHEN processing completes, THE SYSTEM SHALL display `completed_with_review_flags`, 17/19 extracted fields, and three manual-review items. |
| FR-006 | WHEN the dashboard loads, THE SYSTEM SHALL obtain all dashboard data through `getAnalysisResult`. |
| FR-007 | THE SYSTEM SHALL display 19 field rows, 6 KPIs, 7 ratio rows, 7 anomaly alerts, 3 insights, and 5 trend periods from the fixture. |
| FR-008 | WHEN a material field, KPI, ratio, anomaly, or insight is selected, THE SYSTEM SHALL call `getEvidenceDetail` with its valid `evidence_id`. |
| FR-009 | WHEN evidence loading fails, THE SYSTEM SHALL keep the dashboard usable and offer retry or close actions. |
| FR-010 | THE SYSTEM SHALL render unavailable values as explicit labelled states and SHALL NOT substitute a number. |
| FR-011 | THE SYSTEM SHALL expose generated OpenAPI types and SHALL NOT duplicate contract enums manually. |
| FR-012 | THE SYSTEM SHALL have zero imports of `lib/mock-data.ts` outside the MSW migration step; the final runtime source is the typed API layer. |
| FR-013 | Keyboard users SHALL receive labelled controls, visible focus, and working Enter/Space activation for traceable rows. |
| FR-014 | Financial tables SHALL scroll internally at 390 px width and SHALL NOT widen the page. |
| FR-015 | Refreshing MAY reset to upload, and the UI SHALL identify non-persistence as a Phase 0 limitation. |

## 13. Definition of done

The API-seam change is `verified` only when:

- the OpenAPI document parses and generates TypeScript types;
- the four operation IDs are implemented by the client and MSW handlers;
- all nine former direct-import components receive data through hooks, props, or cached API state;
- every fixture `evidence_id` resolves;
- calculations and visible counts are internally consistent;
- build, lint, and TypeScript checks pass;
- the upload-to-dashboard-to-evidence journey passes in a browser;
- the UI is visually checked at 1184×776 and 390×844; and
- no framework, Ant Design, routing, persistence, authentication, backend, or T3 scope is added.

The frontend is not `accepted` until the Product Owner reviews the preview and explicitly accepts the behavior. It is not `released` merely because v0 reports that generation completed.
