# Start FinTrace AI Phase 1A

This package contains the complete Phase 0 frontend/API seam plus the approved Phase 1A backend specification. The backend is **planned, not implemented**.

## Give this project to Codex

1. Extract the ZIP and open the top-level `fintrace-ai-phase1a` folder as a new project.
2. Commit the starting state or create a new branch so every agent change is reviewable.
3. Open `BACKEND-AGENT-PROMPT.md` and paste its complete contents into the coding agent.
4. Let the agent perform its required read-and-report step before it edits files.
5. If it reports no blocking contradiction, tell it to implement and verify Phase 1A exactly as specified.
6. Review its completion report and manually test both `mock` and `backend` modes before accepting the change.

## Keep these files in the new project

Do not upload only `backend/`. The agent needs the frontend, OpenAPI contract, typed API layer, mock handlers, and fixture to implement and verify the real HTTP seam end to end.

The main control files are:

- `BACKEND-PRD.md` — outcome, boundaries, behavior, and acceptance criteria.
- `BACKEND-TECH-STACK.md` — approved architecture, structure, and verification plan.
- `BACKEND-AGENT-PROMPT.md` — complete implementation instruction for the coding agent.
- `docs/api/openapi.yaml` — protected API contract.
- `src/fixtures/sample-analysis.json` — protected deterministic financial fixture.
- `backend/README.md` — backend folder scope and reading order.

## Phase boundary

Phase 1A proves frontend-to-backend transport, lifecycle, schema, errors, and evidence retrieval. It intentionally does not add a database, document parsing, OCR, LLM processing, Experian, T3 ADK, authentication, or production deployment.

