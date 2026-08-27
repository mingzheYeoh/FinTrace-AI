import fixture from "@/src/fixtures/sample-analysis.json"
import type {
  AnalysisResult,
  AnalysisStatusResponse,
  ApiErrorBody,
  CreateAnalysisResponse,
  EvidenceDetail,
} from "@/src/lib/api/client"
import {
  DEFAULT_SCENARIO,
  isScenarioId,
  resolveResultScenario,
  scenarioFromFilenames,
  type ScenarioId,
} from "./scenario-routing"

/**
 * Deterministic Phase 0 scenarios. This module and `handlers.ts` are the only
 * files permitted to import the JSON fixture.
 */
/** Typed views over the fixture. */
interface Fixture {
  fixture_version: string
  scenario: string
  data_classification: string
  create_response: CreateAnalysisResponse
  status_sequence: AnalysisStatusResponse[]
  result: AnalysisResult
  evidence: Record<string, EvidenceDetail>
}

const data = fixture as unknown as Fixture

export const createResponse = data.create_response
export const statusSequence = data.status_sequence
export const analysisResult = data.result
export const evidenceIndex = data.evidence

/** Contract error bodies, matching the examples in openapi.yaml. */
export const errors = {
  fileTooLarge: {
    code: "FILE_TOO_LARGE",
    message: "Each file must be 20 MB or smaller.",
    retryable: false,
  },
  unsupportedFileType: {
    code: "UNSUPPORTED_FILE_TYPE",
    message: "FinTrace AI accepts searchable PDF, XLSX, and structured CSV files.",
    retryable: false,
  },
  invalidFileSet: {
    code: "INVALID_FILE_SET",
    message: "Select between one and five files for one analysis.",
    retryable: false,
  },
  analysisNotFound: {
    code: "ANALYSIS_NOT_FOUND",
    message: "The requested analysis could not be found.",
    retryable: false,
  },
  evidenceNotFound: {
    code: "EVIDENCE_NOT_FOUND",
    message: "The requested evidence trail could not be found.",
    retryable: false,
  },
  resultNotReady: {
    code: "RESULT_NOT_READY",
    message: "The analysis result is not ready yet.",
    retryable: true,
  },
  resultRetrievalFailed: {
    code: "RESULT_RETRIEVAL_FAILED",
    message: "The analysis result could not be retrieved. Retry before opening the dashboard.",
    retryable: true,
  },
  processingFailed: {
    code: "PROCESSING_FAILED",
    message: "The analysis could not be completed. Start a new analysis and try again.",
    retryable: true,
  },
} satisfies Record<string, ApiErrorBody>

/**
 * Terminal failure frame for `processing_failed`. Derived from the last real
 * sequence frame so stage titles and descriptions stay contract-accurate.
 */
export function buildFailedStatus(analysisId: string): AnalysisStatusResponse {
  const midpoint = statusSequence[3] ?? statusSequence[0]
  return {
    ...midpoint,
    analysis_id: analysisId,
    status: "failed",
    completion_outcome: null,
    active_stage: null,
    message: "Analysis failed while normalizing extracted values.",
    stages: midpoint.stages.map((stage, index) =>
      index === 2
        ? { ...stage, state: "failed" as const }
        : index > 2
          ? { ...stage, state: "pending" as const, progress_percent: 0 }
          : stage,
    ),
    error: errors.processingFailed,
  }
}

export {
  DEFAULT_SCENARIO,
  isScenarioId,
  resolveResultScenario,
  scenarioFromFilenames,
  type ScenarioId,
}
