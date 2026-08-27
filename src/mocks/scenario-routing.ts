export type ScenarioId =
  | "happy_path_with_review_flags"
  | "unsupported_file"
  | "file_too_large"
  | "too_many_files"
  | "processing_failed"
  | "result_not_ready"
  | "result_error"
  | "analysis_not_found"
  | "evidence_not_found"

export const DEFAULT_SCENARIO: ScenarioId = "happy_path_with_review_flags"

const SCENARIO_IDS: ScenarioId[] = [
  "happy_path_with_review_flags",
  "unsupported_file",
  "file_too_large",
  "too_many_files",
  "processing_failed",
  "result_not_ready",
  "result_error",
  "analysis_not_found",
  "evidence_not_found",
]

export type ResultScenarioResolution =
  | { kind: "success" }
  | {
      kind: "error"
      status: 409 | 500
      errorKey: "resultNotReady" | "resultRetrievalFailed"
      delayMs: number
    }

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return Boolean(value) && SCENARIO_IDS.includes(value as ScenarioId)
}

export function scenarioFromFilenames(names: string[]): ScenarioId {
  for (const name of names) {
    const lower = name.toLowerCase()
    if (lower.includes("scenario-processing-failed")) return "processing_failed"
    if (lower.includes("scenario-result-not-ready")) return "result_not_ready"
    if (lower.includes("result-error")) return "result_error"
    if (lower.includes("scenario-analysis-not-found")) return "analysis_not_found"
    if (lower.includes("scenario-evidence-not-found")) return "evidence_not_found"
    if (lower.includes("scenario-file-too-large")) return "file_too_large"
    if (lower.includes("scenario-unsupported")) return "unsupported_file"
    if (lower.includes("scenario-too-many-files")) return "too_many_files"
  }
  return DEFAULT_SCENARIO
}

export function resolveResultScenario(scenario: ScenarioId): ResultScenarioResolution {
  if (scenario === "result_error") {
    return { kind: "error", status: 500, errorKey: "resultRetrievalFailed", delayMs: 600 }
  }
  if (scenario === "result_not_ready") {
    return { kind: "error", status: 409, errorKey: "resultNotReady", delayMs: 600 }
  }
  if (scenario === "processing_failed") {
    return { kind: "error", status: 409, errorKey: "resultNotReady", delayMs: 0 }
  }
  return { kind: "success" }
}
