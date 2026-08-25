"""Read-only, validated access to the committed synthetic analysis fixture."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from pydantic import ValidationError
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

from app.models.contract import (
    AnalysisResult,
    AnalysisStatusResponse,
    CreateAnalysisResponse,
    EvidenceDetail,
)
from app.openapi import REPOSITORY_ROOT, load_openapi_document

DEFAULT_FIXTURE_PATH = REPOSITORY_ROOT / "src" / "fixtures" / "sample-analysis.json"


class FixtureRepository:
    """Validate once, then issue defensive typed copies for every request."""

    def __init__(self, fixture_path: Path | None = None) -> None:
        path = fixture_path or DEFAULT_FIXTURE_PATH
        try:
            with path.open(encoding="utf-8") as source:
                raw = json.load(source)
            if not isinstance(raw, dict):
                raise ValueError("fixture root is not an object")
            self._validate_openapi_payloads(raw)
            self._create = CreateAnalysisResponse.model_validate(raw["create_response"])
            self._statuses = tuple(
                AnalysisStatusResponse.model_validate(frame) for frame in raw["status_sequence"]
            )
            self._result = AnalysisResult.model_validate(raw["result"])
            self._evidence = {
                evidence_id: EvidenceDetail.model_validate(detail)
                for evidence_id, detail in raw["evidence"].items()
            }
            self._validate_integrity()
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as error:
            raise RuntimeError(
                "The FinTrace synthetic fixture is invalid and cannot be served."
            ) from error

    @staticmethod
    def _component_validator(component_name: str) -> Draft202012Validator:
        document = load_openapi_document()
        base_uri = "urn:fintrace:openapi"
        resource = Resource.from_contents(document, DRAFT202012)
        registry = Registry().with_resource(base_uri, resource)
        schema = {"$ref": f"{base_uri}#/components/schemas/{component_name}"}
        return Draft202012Validator(schema, registry=registry)

    def _validate_openapi_payloads(self, raw: dict[str, Any]) -> None:
        self._component_validator("CreateAnalysisResponse").validate(raw["create_response"])
        status_validator = self._component_validator("AnalysisStatusResponse")
        for status in raw["status_sequence"]:
            status_validator.validate(status)
        self._component_validator("AnalysisResult").validate(raw["result"])
        evidence_validator = self._component_validator("EvidenceDetail")
        for detail in raw["evidence"].values():
            evidence_validator.validate(detail)

    def _validate_integrity(self) -> None:
        if len(self._statuses) != 7:
            raise ValueError("unexpected lifecycle frame count")
        result = self._result
        expected_counts = (19, 19, 6, 7, 25, 7, 3, 5)
        actual_counts = (
            len(result.fields),
            len(result.calculations),
            len(result.kpis),
            len(result.ratios),
            len(result.trends),
            len(result.anomalies),
            len(result.insights),
            len(result.follow_up_questions),
        )
        if actual_counts != expected_counts:
            raise ValueError("unexpected result counts")
        summary = result.summary.extraction_summary
        if (summary.targeted_fields, summary.extracted_fields, summary.manual_review_count) != (
            19,
            17,
            3,
        ):
            raise ValueError("unexpected extraction summary")
        if sum(field.requires_manual_review for field in result.fields) != 3:
            raise ValueError("unexpected manual-review field count")

        field_ids = {field.id for field in result.fields}
        value_ids = {value.id for field in result.fields for value in (field.current, field.prior)}
        calculation_ids = {calculation.id for calculation in result.calculations}
        evidence_ids = set(self._evidence)
        document_ids = {document.id for document in result.summary.documents}

        for field in result.fields:
            self._require_reference(field.evidence_id, evidence_ids)
            for value in (field.current, field.prior):
                for source in value.sources:
                    self._require_reference(source.document_id, document_ids)
            if field.conflict is not None:
                self._require_reference(field.conflict.source.document_id, document_ids)
        for calculation in result.calculations:
            self._require_subset(calculation.input_value_ids, value_ids)
            self._require_reference(calculation.evidence_id, evidence_ids)
        for kpi in result.kpis:
            self._require_reference(kpi.calculation_id, calculation_ids)
            self._require_reference(kpi.evidence_id, evidence_ids)
        for ratio in result.ratios:
            self._require_reference(ratio.current_calculation_id, calculation_ids)
            self._require_reference(ratio.prior_calculation_id, calculation_ids)
            self._require_reference(ratio.evidence_id, evidence_ids)
        for anomaly in result.anomalies:
            self._require_subset(anomaly.fact_ids, field_ids)
            self._require_subset(anomaly.calculation_ids, calculation_ids)
            self._require_reference(anomaly.evidence_id, evidence_ids)
        for insight in result.insights:
            self._require_subset(insight.fact_ids, field_ids)
            self._require_subset(insight.calculation_ids, calculation_ids)
            self._require_reference(insight.evidence_id, evidence_ids)
        for evidence_id, detail in self._evidence.items():
            if detail.evidence_id != evidence_id:
                raise ValueError("evidence key mismatch")
            self._require_subset(detail.fact_ids, field_ids)
            self._require_subset(detail.calculation_ids, calculation_ids)

        calculations = {calculation.id: calculation for calculation in result.calculations}
        current = calculations["c_debt_to_equity_current"]
        prior = calculations["c_debt_to_equity_prior"]
        if (
            current.formula != "Borrowings / Shareholders' equity"
            or current.input_value_ids
            != ["value_borrowings_current", "value_shareholders_equity_current"]
            or current.substitution != "54,600 / 48,210"
            or current.result != "1.13"
            or prior.formula != "Borrowings / Shareholders' equity"
            or prior.input_value_ids
            != ["value_borrowings_prior", "value_shareholders_equity_prior"]
            or prior.substitution != "38,150 / 46,880"
            or prior.result != "0.81"
        ):
            raise ValueError("Debt-to-equity provenance drift")

    @staticmethod
    def _require_reference(reference: str, known: set[str]) -> None:
        if reference not in known:
            raise ValueError("unknown fixture reference")

    @staticmethod
    def _require_subset(references: list[str], known: set[str]) -> None:
        if not set(references) <= known:
            raise ValueError("unknown fixture references")

    def create_response(
        self, analysis_id: str, document_ids: tuple[str, ...]
    ) -> CreateAnalysisResponse:
        response = self._create.model_copy(deep=True)
        response.analysis_id = analysis_id
        response.document_ids = list(document_ids)
        response.status_url = f"/api/v1/analyses/{analysis_id}/status"
        response.result_url = f"/api/v1/analyses/{analysis_id}/result"
        return response

    def status_frames(self, analysis_id: str) -> tuple[AnalysisStatusResponse, ...]:
        frames = deepcopy(self._statuses)
        for frame in frames:
            frame.analysis_id = analysis_id
        return frames

    def result(self, analysis_id: str) -> AnalysisResult:
        result = self._result.model_copy(deep=True)
        result.summary.analysis_id = analysis_id
        return result

    def evidence(self, evidence_id: str) -> EvidenceDetail | None:
        detail = self._evidence.get(evidence_id)
        return detail.model_copy(deep=True) if detail is not None else None

    def all_evidence(self) -> dict[str, EvidenceDetail]:
        return {
            evidence_id: detail.model_copy(deep=True)
            for evidence_id, detail in self._evidence.items()
        }
