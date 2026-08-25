"""Strict Pydantic representations of the committed OpenAPI schemas."""

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field

DecimalString = Annotated[str, Field(pattern=r"^-?[0-9]+(?:\.[0-9]+)?$")]
CurrencyCode = Annotated[str, Field(min_length=3, max_length=3)]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AnalysisLifecycleStatus(StrEnum):
    ACCEPTED = "accepted"
    VALIDATING = "validating"
    EXTRACTING = "extracting"
    NORMALIZING = "normalizing"
    CALCULATING = "calculating"
    DETECTING_EXCEPTIONS = "detecting_exceptions"
    GENERATING_EXPLANATION = "generating_explanation"
    COMPLETED = "completed"
    FAILED = "failed"


class CompletionOutcome(StrEnum):
    COMPLETED = "completed"
    COMPLETED_WITH_REVIEW_FLAGS = "completed_with_review_flags"


class ValueStatus(StrEnum):
    VERIFIED = "verified"
    NOT_PRESENT = "not_present"
    NOT_READABLE = "not_readable"
    AMBIGUOUS = "ambiguous"
    CONFLICTING = "conflicting"
    FAILED = "failed"


class Confidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class UnitScale(StrEnum):
    UNITS = "units"
    THOUSANDS = "thousands"
    MILLIONS = "millions"


class FileKind(StrEnum):
    PDF = "pdf"
    XLSX = "xlsx"
    CSV = "csv"


class ProcessingStageKey(StrEnum):
    VALIDATE = "validate"
    EXTRACT = "extract"
    NORMALIZE = "normalize"
    CALCULATE = "calculate"
    DETECT = "detect"
    EXPLAIN = "explain"


class ProcessingStageState(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    WARNING = "warning"
    FAILED = "failed"


class MetricFormat(StrEnum):
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    RATIO = "ratio"


class AnomalySeverity(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class InsightTone(StrEnum):
    STRENGTH = "strength"
    CONCERN = "concern"
    NEUTRAL = "neutral"


class CalculationUnit(StrEnum):
    PERCENTAGE = "percentage"
    RATIO = "ratio"
    CURRENCY = "currency"


class RatioUnit(StrEnum):
    PERCENTAGE = "percentage"
    RATIO = "ratio"


class ApiError(ContractModel):
    code: str
    message: str
    retryable: bool
    details: dict[str, Any] | None = Field(default=None, exclude_if=lambda value: value is None)


class CreateAnalysisResponse(ContractModel):
    analysis_id: str
    document_ids: Annotated[list[str], Field(min_length=1, max_length=5)]
    status: AnalysisLifecycleStatus
    status_url: str
    result_url: str


class ExtractionSummary(ContractModel):
    targeted_fields: Annotated[int, Field(ge=0)]
    extracted_fields: Annotated[int, Field(ge=0)]
    manual_review_count: Annotated[int, Field(ge=0)]


class ProcessingStage(ContractModel):
    key: ProcessingStageKey
    title: str
    description: str
    state: ProcessingStageState
    progress_percent: Annotated[int, Field(ge=0, le=100)]
    logs: list[str]


class AnalysisStatusResponse(ContractModel):
    analysis_id: str
    status: AnalysisLifecycleStatus
    completion_outcome: CompletionOutcome | None = None
    progress_percent: Annotated[int, Field(ge=0, le=100)]
    active_stage: ProcessingStageKey | None = None
    message: str
    stages: Annotated[list[ProcessingStage], Field(min_length=6, max_length=6)]
    extraction_summary: ExtractionSummary
    error: ApiError | None = None


class DocumentSummary(ContractModel):
    id: str
    name: str
    size_bytes: Annotated[int, Field(ge=0)]
    size_label: str
    kind: FileKind
    page_or_sheet_count: Annotated[int, Field(ge=0)]


class AnalysisSummary(ContractModel):
    analysis_id: str
    company: str
    registration_id: str
    currency: CurrencyCode
    unit_scale: UnitScale
    current_period: str
    prior_period: str
    statement_date: str
    documents: Annotated[list[DocumentSummary], Field(min_length=1, max_length=5)]
    extraction_summary: ExtractionSummary
    completion_outcome: CompletionOutcome


class SourceLocation(ContractModel):
    document_id: str
    document_name: str
    locator: str
    raw_value: str
    excerpt: str
    extracted_at: str


class FinancialPeriodValue(ContractModel):
    id: str
    period: str
    value: DecimalString | None
    currency: CurrencyCode
    unit_scale: UnitScale
    sources: list[SourceLocation]


class ConflictCandidate(ContractModel):
    period: str
    value: DecimalString
    source: SourceLocation


class FinancialField(ContractModel):
    id: str
    key: str
    label: str
    status: ValueStatus
    confidence: Confidence
    requires_manual_review: bool
    current: FinancialPeriodValue
    prior: FinancialPeriodValue
    absolute_change: DecimalString | None
    percentage_change: DecimalString | None
    conflict: ConflictCandidate | None = None
    note: str | None = None
    evidence_id: str


class Calculation(ContractModel):
    id: str
    label: str
    formula: str
    input_value_ids: Annotated[list[str], Field(min_length=1)]
    substitution: str
    result: DecimalString
    unit: CalculationUnit
    period: str
    evidence_id: str


class KpiMetric(ContractModel):
    id: str
    label: str
    format: MetricFormat
    current: DecimalString
    prior: DecimalString
    absolute_change: DecimalString
    percentage_change: DecimalString
    higher_is_better: bool
    status: ValueStatus
    calculation_id: str
    evidence_id: str


class RatioComparison(ContractModel):
    id: str
    label: str
    unit: RatioUnit
    current: DecimalString
    prior: DecimalString
    absolute_change: DecimalString
    percentage_change: DecimalString
    higher_is_better: bool
    current_calculation_id: str
    prior_calculation_id: str
    evidence_id: str


class TrendPoint(ContractModel):
    period: str
    metric: str
    value: DecimalString
    format: MetricFormat


class Anomaly(ContractModel):
    id: str
    rule_id: str
    title: str
    detail: str
    severity: AnomalySeverity
    fact_ids: list[str]
    calculation_ids: list[str]
    follow_up: str
    requires_manual_review: bool
    evidence_id: str


class Insight(ContractModel):
    id: str
    title: str
    narrative: str
    fact_ids: list[str]
    calculation_ids: list[str]
    tone: InsightTone
    evidence_id: str


class AnalysisResult(ContractModel):
    summary: AnalysisSummary
    fields: Annotated[list[FinancialField], Field(min_length=19, max_length=19)]
    calculations: Annotated[list[Calculation], Field(min_length=19, max_length=19)]
    kpis: Annotated[list[KpiMetric], Field(min_length=6, max_length=6)]
    ratios: Annotated[list[RatioComparison], Field(min_length=7, max_length=7)]
    trends: Annotated[list[TrendPoint], Field(min_length=25)]
    anomalies: Annotated[list[Anomaly], Field(min_length=7, max_length=7)]
    insights: Annotated[list[Insight], Field(min_length=3, max_length=3)]
    follow_up_questions: Annotated[list[str], Field(min_length=5, max_length=5)]


class EvidenceDetail(ContractModel):
    evidence_id: str
    title: str
    subtitle: str | None = None
    fact_ids: list[str]
    calculation_ids: list[str]
    narrative: str | None = None
    follow_up: str | None = None
