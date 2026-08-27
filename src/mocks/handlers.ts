import { delay, http, HttpResponse } from "msw"
import {
  analysisResult,
  buildFailedStatus,
  createResponse,
  DEFAULT_SCENARIO,
  errors,
  evidenceIndex,
  isScenarioId,
  resolveResultScenario,
  scenarioFromFilenames,
  statusSequence,
  type ScenarioId,
} from "./scenarios"

const MAX_FILES = 5
const MAX_FILE_BYTES = 20 * 1024 * 1024
const ALLOWED_EXTENSIONS = ["pdf", "xlsx", "csv"]

/**
 * In-memory analysis registry. Poll counters live here so `getAnalysisStatus`
 * advances deterministically through `status_sequence` on successive polls
 * rather than relying on wall-clock timing.
 */
interface AnalysisState {
  scenario: ScenarioId
  pollCount: number
}

const analyses = new Map<string, AnalysisState>()

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".")
  return parts.length > 1 ? (parts.pop() as string) : ""
}

export const handlers = [
  /** createAnalysis — POST /api/v1/analyses */
  http.post("/api/v1/analyses", async ({ request }) => {
    const form = await request.formData()
    const files = form.getAll("files").filter((entry): entry is File => entry instanceof File)

    if (files.length < 1 || files.length > MAX_FILES) {
      return HttpResponse.json(errors.invalidFileSet, { status: 422 })
    }
    if (files.some((file) => !ALLOWED_EXTENSIONS.includes(extensionOf(file.name)))) {
      return HttpResponse.json(errors.unsupportedFileType, { status: 415 })
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      return HttpResponse.json(errors.fileTooLarge, { status: 413 })
    }

    const names = files.map((file) => file.name)
    const requested = new URL(request.url).searchParams.get("scenario")
    const scenario: ScenarioId = isScenarioId(requested) ? requested : scenarioFromFilenames(names)

    // Server-side mirrors of the client validation, reachable via scenario files.
    if (scenario === "unsupported_file") {
      return HttpResponse.json(errors.unsupportedFileType, { status: 415 })
    }
    if (scenario === "file_too_large") {
      return HttpResponse.json(errors.fileTooLarge, { status: 413 })
    }
    if (scenario === "too_many_files") {
      return HttpResponse.json(errors.invalidFileSet, { status: 422 })
    }

    const analysisId = createResponse.analysis_id
    analyses.set(analysisId, { scenario, pollCount: 0 })

    return HttpResponse.json(
      {
        ...createResponse,
        analysis_id: analysisId,
        document_ids: files.map((_, index) => createResponse.document_ids[index] ?? `doc_${index + 1}`),
      },
      { status: 202 },
    )
  }),

  /** getAnalysisStatus — GET /api/v1/analyses/{analysisId}/status */
  http.get("/api/v1/analyses/:analysisId/status", ({ params }) => {
    const analysisId = String(params.analysisId)
    const state = analyses.get(analysisId)

    if (!state || state.scenario === "analysis_not_found") {
      return HttpResponse.json(errors.analysisNotFound, { status: 404 })
    }

    if (state.scenario === "processing_failed") {
      // Fail partway so the user sees real progress before the failure.
      if (state.pollCount >= 3) {
        return HttpResponse.json(buildFailedStatus(analysisId), { status: 200 })
      }
      const frame = statusSequence[state.pollCount]
      state.pollCount += 1
      return HttpResponse.json({ ...frame, analysis_id: analysisId }, { status: 200 })
    }

    const index = Math.min(state.pollCount, statusSequence.length - 1)
    const frame = statusSequence[index]
    if (state.pollCount < statusSequence.length - 1) {
      state.pollCount += 1
    }
    return HttpResponse.json({ ...frame, analysis_id: analysisId }, { status: 200 })
  }),

  /** getAnalysisResult — GET /api/v1/analyses/{analysisId}/result */
  http.get("/api/v1/analyses/:analysisId/result", async ({ params }) => {
    const analysisId = String(params.analysisId)
    const state = analyses.get(analysisId)

    if (!state || state.scenario === "analysis_not_found") {
      return HttpResponse.json(errors.analysisNotFound, { status: 404 })
    }
    const scenarioResolution = resolveResultScenario(state.scenario)
    if (scenarioResolution.kind === "error") {
      if (scenarioResolution.delayMs > 0) {
        await delay(scenarioResolution.delayMs)
      }
      return HttpResponse.json(errors[scenarioResolution.errorKey], {
        status: scenarioResolution.status,
      })
    }
    if (state.pollCount < statusSequence.length - 1) {
      return HttpResponse.json(errors.resultNotReady, { status: 409 })
    }

    return HttpResponse.json(
      { ...analysisResult, summary: { ...analysisResult.summary, analysis_id: analysisId } },
      { status: 200 },
    )
  }),

  /** getEvidenceDetail — GET /api/v1/analyses/{analysisId}/evidence/{evidenceId} */
  http.get("/api/v1/analyses/:analysisId/evidence/:evidenceId", ({ params }) => {
    const analysisId = String(params.analysisId)
    const evidenceId = String(params.evidenceId)
    const state = analyses.get(analysisId)

    if (!state) {
      return HttpResponse.json(errors.analysisNotFound, { status: 404 })
    }
    if (state.scenario === "evidence_not_found") {
      return HttpResponse.json(errors.evidenceNotFound, { status: 404 })
    }

    const detail = evidenceIndex[evidenceId]
    if (!detail) {
      return HttpResponse.json(errors.evidenceNotFound, { status: 404 })
    }
    return HttpResponse.json(detail, { status: 200 })
  }),
]

/** Test affordance: clears registry state between manual runs. */
export function resetMockAnalyses() {
  analyses.clear()
}

export { DEFAULT_SCENARIO }
