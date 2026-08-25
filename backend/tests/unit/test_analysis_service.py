from __future__ import annotations

import asyncio
from io import BytesIO

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.errors import ApplicationError
from app.repositories.fixture import FixtureRepository
from app.repositories.in_memory import InMemoryAnalysisRepository


class FakeClock:
    def __init__(self, value: float = 100.0) -> None:
        self.value = value

    def monotonic(self) -> float:
        return self.value


def upload(name: str = "report.pdf", content_type: str = "application/pdf") -> UploadFile:
    return UploadFile(
        file=BytesIO(b"synthetic"),
        filename=name,
        headers=Headers({"content-type": content_type}),
    )


def build_service():
    try:
        from app.services.analysis import AnalysisService
        from app.services.lifecycle import LifecycleService
    except ModuleNotFoundError:
        pytest.fail("The analysis orchestration and lifecycle services must exist")

    clock = FakeClock()
    store = InMemoryAnalysisRepository()
    fixture = FixtureRepository()
    lifecycle = LifecycleService(fixture, clock, stage_interval_seconds=0.9)
    return AnalysisService(store, fixture, lifecycle, clock), store, clock


def run(coroutine):
    return asyncio.run(coroutine)


def test_create_generates_unique_opaque_ids_after_validation_only() -> None:
    """Break caught: IDs are reused or invalid requests create analysis records."""
    service, store, _ = build_service()

    first = run(service.create([upload("first.pdf")]))
    second = run(service.create([upload("second.pdf")]))

    assert first.analysis_id.startswith("anl_")
    assert second.analysis_id.startswith("anl_")
    assert first.analysis_id != second.analysis_id
    assert first.document_ids[0].startswith("doc_")
    assert first.document_ids != second.document_ids
    assert run(store.count()) == 2

    with pytest.raises(ApplicationError) as error:
        run(service.create([upload("bad.exe", "application/octet-stream")]))
    assert error.value.body.code == "UNSUPPORTED_FILE_TYPE"
    assert run(store.count()) == 2


def test_status_result_and_evidence_happy_boundaries() -> None:
    """Break caught: result readiness or evidence lookup ignores lifecycle/existence."""
    service, _, clock = build_service()
    created = run(service.create([upload()]))

    assert run(service.status(created.analysis_id)).status == "validating"
    with pytest.raises(ApplicationError) as early:
        run(service.result(created.analysis_id))
    assert early.value.status_code == 409
    assert early.value.body.code == "RESULT_NOT_READY"

    detail = run(service.evidence(created.analysis_id, "ev_kpi_revenue"))
    assert detail.evidence_id == "ev_kpi_revenue"

    clock.value = 105.4
    assert run(service.status(created.analysis_id)).status == "completed"
    result = run(service.result(created.analysis_id))
    assert result.summary.analysis_id == created.analysis_id
    assert result.summary.extraction_summary.extracted_fields == 17


@pytest.mark.parametrize("operation", ["status", "result", "evidence"])
def test_unknown_analysis_maps_to_contract_404(operation: str) -> None:
    """Break caught: a stale ID leaks an exception or returns the wrong 404 code."""
    service, _, _ = build_service()
    with pytest.raises(ApplicationError) as error:
        if operation == "status":
            run(service.status("anl_missing"))
        elif operation == "result":
            run(service.result("anl_missing"))
        else:
            run(service.evidence("anl_missing", "ev_kpi_revenue"))
    assert error.value.status_code == 404
    assert error.value.body.code == "ANALYSIS_NOT_FOUND"


def test_unknown_evidence_leaves_existing_analysis_usable() -> None:
    """Break caught: a missing evidence binding corrupts or hides the analysis."""
    service, _, _ = build_service()
    created = run(service.create([upload()]))

    with pytest.raises(ApplicationError) as error:
        run(service.evidence(created.analysis_id, "ev_missing"))
    assert error.value.status_code == 404
    assert error.value.body.code == "EVIDENCE_NOT_FOUND"
    assert run(service.status(created.analysis_id)).analysis_id == created.analysis_id


@pytest.mark.parametrize(
    ("filename", "operation", "expected_code"),
    [
        ("scenario-result-not-ready.pdf", "result", "RESULT_NOT_READY"),
        ("scenario-analysis-not-found.pdf", "status", "ANALYSIS_NOT_FOUND"),
        ("scenario-evidence-not-found.pdf", "evidence", "EVIDENCE_NOT_FOUND"),
    ],
)
def test_filename_scenarios_are_deterministic(
    filename: str, operation: str, expected_code: str
) -> None:
    """Break caught: development scenarios require hidden query/header controls."""
    service, _, clock = build_service()
    created = run(service.create([upload(filename)]))
    clock.value = 105.4

    with pytest.raises(ApplicationError) as error:
        if operation == "result":
            run(service.result(created.analysis_id))
        elif operation == "status":
            run(service.status(created.analysis_id))
        else:
            run(service.evidence(created.analysis_id, "ev_kpi_revenue"))
    assert error.value.body.code == expected_code


def test_processing_failed_scenario_never_exposes_a_result() -> None:
    """Break caught: a failed analysis can return the happy fixture result."""
    service, _, clock = build_service()
    created = run(service.create([upload("scenario-processing-failed.pdf")]))
    assert run(service.status(created.analysis_id)).status == "validating"

    clock.value = 102.7
    failed = run(service.status(created.analysis_id))
    assert failed.status == "failed"
    with pytest.raises(ApplicationError) as error:
        run(service.result(created.analysis_id))
    assert error.value.body.code == "RESULT_NOT_READY"
