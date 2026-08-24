import createClient from "openapi-fetch"
import type { paths, components } from "./generated"

/**
 * Single typed HTTP client for every FinTrace API call.
 *
 * Phase 0 uses relative same-origin paths so that Mock Service Worker can
 * intercept the request in the browser. Switching to a real backend later is a
 * base-URL change here, not a component rewrite.
 */
export const apiClient = createClient<paths>({
  baseUrl: "/",
})

/** Contract enums and schemas re-exported so features never redeclare them. */
export type Schemas = components["schemas"]
export type ApiErrorBody = Schemas["ApiError"]
export type CreateAnalysisResponse = Schemas["CreateAnalysisResponse"]
export type AnalysisStatusResponse = Schemas["AnalysisStatusResponse"]
export type AnalysisResult = Schemas["AnalysisResult"]
export type AnalysisSummary = Schemas["AnalysisSummary"]
export type EvidenceDetail = Schemas["EvidenceDetail"]
export type FinancialField = Schemas["FinancialField"]
export type FinancialPeriodValue = Schemas["FinancialPeriodValue"]
export type Calculation = Schemas["Calculation"]
export type KpiMetric = Schemas["KpiMetric"]
export type RatioComparison = Schemas["RatioComparison"]
export type TrendPoint = Schemas["TrendPoint"]
export type Anomaly = Schemas["Anomaly"]
export type Insight = Schemas["Insight"]
export type ProcessingStage = Schemas["ProcessingStage"]
export type ProcessingStageKey = Schemas["ProcessingStageKey"]
export type ProcessingStageState = Schemas["ProcessingStageState"]
export type AnalysisLifecycleStatus = Schemas["AnalysisLifecycleStatus"]
export type CompletionOutcome = Schemas["CompletionOutcome"]
export type ValueStatus = Schemas["ValueStatus"]
export type Confidence = Schemas["Confidence"]
export type MetricFormat = Schemas["MetricFormat"]
export type AnomalySeverity = Schemas["AnomalySeverity"]
export type InsightTone = Schemas["InsightTone"]
export type SourceLocation = Schemas["SourceLocation"]
export type DocumentSummary = Schemas["DocumentSummary"]
export type ExtractionSummary = Schemas["ExtractionSummary"]

/**
 * Error carrying the contract `ApiError` body plus the HTTP status, so hooks can
 * apply the retry rules in FRONTEND-API-MAP section 4 without re-parsing.
 */
export class FinTraceApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryable: boolean

  constructor(status: number, body: ApiErrorBody | undefined, fallback: string) {
    super(body?.message ?? fallback)
    this.name = "FinTraceApiError"
    this.status = status
    this.code = body?.code ?? "UNKNOWN_ERROR"
    this.retryable = body?.retryable ?? false
  }
}

/** Statuses the contract forbids retrying automatically. */
const NON_RETRYABLE_STATUSES = new Set([404, 409, 413, 415, 422])

export function isNonRetryableStatus(status: number): boolean {
  return NON_RETRYABLE_STATUSES.has(status)
}

/**
 * Shared TanStack Query retry predicate. Contract errors on 404/409/413/415/422
 * are terminal; transport and 5xx failures get one retry.
 */
export function retryUnlessContractError(failureCount: number, error: unknown): boolean {
  if (error instanceof FinTraceApiError && isNonRetryableStatus(error.status)) {
    return false
  }
  return failureCount < 1
}
