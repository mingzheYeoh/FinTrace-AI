// Phase 0 prototype types. No backend — these shapes mirror the PRD's
// internal representation so the real pipeline can drop in later.

export type ValueStatus = "verified" | "not_present" | "not_readable" | "ambiguous" | "conflicting" | "failed"

export type Confidence = "high" | "medium" | "low"

export interface EvidenceLocation {
  /** Source document file name */
  document: string
  /** Human readable location: page, sheet + cell, or table reference */
  locator: string
  /** Raw string exactly as it appears in the source, before normalization */
  rawValue: string
  /** Short excerpt of surrounding source text for context */
  excerpt: string
  extractedAt: string
}

export interface FinancialFact {
  id: string
  /** Display label, e.g. "Revenue" */
  label: string
  /** Canonical field key from the PRD target field list */
  field: string
  period: string
  /** Normalized value in base currency units. null when not available. */
  value: number | null
  currency: string
  unitScale: "units" | "thousands" | "millions"
  status: ValueStatus
  confidence: Confidence
  evidence: EvidenceLocation[]
  /** Populated when status is "conflicting" */
  conflictWith?: { value: number; evidence: EvidenceLocation }
  note?: string
}

export interface Calculation {
  id: string
  label: string
  /** Formula shown to the user, e.g. "Gross profit / Revenue x 100" */
  formula: string
  /** Fact ids used as inputs */
  inputs: string[]
  /** Rendered substitution, e.g. "(4,120 / 12,480) x 100" */
  substitution: string
  result: number
  unit: "%" | "x" | "currency"
  period: string
}

export interface KpiMetric {
  key: string
  label: string
  factId: string
  current: number | null
  prior: number | null
  currency: string
  /** Formatting hint */
  format: "currency" | "percent" | "ratio"
  /** true when a rise is the healthy direction */
  higherIsBetter: boolean
  status: ValueStatus
  calculationId?: string
}

export type AnomalySeverity = "high" | "medium" | "low"

export interface Anomaly {
  id: string
  rule: string
  title: string
  /** Deterministic, evidence-grounded description */
  detail: string
  severity: AnomalySeverity
  /** Facts and calculations backing the observation */
  factIds: string[]
  calculationIds: string[]
  followUp: string
  needsManualReview: boolean
}

export interface Insight {
  id: string
  title: string
  /** AI narrative — always labelled separately from source facts in the UI */
  narrative: string
  factIds: string[]
  calculationIds: string[]
  tone: "strength" | "concern" | "neutral"
}

export interface TrendPoint {
  period: string
  metric: string
  value: number
}

export interface UploadedDocument {
  id: string
  name: string
  sizeLabel: string
  kind: "pdf" | "xlsx" | "csv"
  pageOrSheetCount: number
}

export interface CaseSummary {
  id: string
  company: string
  registrationId: string
  currency: string
  unitScale: string
  currentPeriod: string
  priorPeriod: string
  statementDate: string
  documents: UploadedDocument[]
  fieldsExtracted: number
  fieldsTargeted: number
  manualReviewCount: number
}

export type ProcessingStageStatus = "pending" | "active" | "done" | "warning"

export interface ProcessingStage {
  key: string
  title: string
  description: string
  /** Simulated duration in ms for the Phase 0 prototype */
  duration: number
  status: ProcessingStageStatus
  /** Log lines revealed as the stage runs */
  logs: string[]
}
