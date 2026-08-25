from __future__ import annotations

import concurrent.futures

import pytest

from app.repositories.fixture import FixtureRepository
from app.repositories.in_memory import AnalysisRecord, FileMetadata


class FakeClock:
    def __init__(self, value: float = 100.0) -> None:
        self.value = value

    def monotonic(self) -> float:
        return self.value


def record(scenario: str = "happy_path_with_review_flags") -> AnalysisRecord:
    return AnalysisRecord(
        analysis_id="anl_clock",
        document_ids=("doc_clock",),
        files=(
            FileMetadata(
                name="report.pdf",
                declared_content_type="application/pdf",
                size_bytes=9,
                kind="pdf",
            ),
        ),
        scenario=scenario,
        created_at_monotonic=100.0,
    )


def lifecycle(clock: FakeClock):
    try:
        from app.services.lifecycle import LifecycleService
    except ModuleNotFoundError:
        pytest.fail("The elapsed-time lifecycle service must exist")
    return LifecycleService(FixtureRepository(), clock, stage_interval_seconds=0.9)


@pytest.mark.parametrize(
    ("elapsed", "expected_status", "expected_active"),
    [
        (0.0, "validating", "validate"),
        (0.899999, "validating", "validate"),
        (0.9, "extracting", "extract"),
        (1.8, "normalizing", "normalize"),
        (2.7, "calculating", "calculate"),
        (3.6, "detecting_exceptions", "detect"),
        (4.5, "generating_explanation", "explain"),
        (5.399999, "generating_explanation", "explain"),
        (5.4, "completed", None),
    ],
)
def test_lifecycle_uses_every_elapsed_time_boundary(
    elapsed: float, expected_status: str, expected_active: str | None
) -> None:
    """Break caught: a stage boundary is driven by polls or off-by-one timing."""
    clock = FakeClock(100.0 + elapsed)

    status = lifecycle(clock).status(record())

    assert status.status == expected_status
    assert status.active_stage == expected_active
    assert len(status.stages) == 6


def test_repeated_and_concurrent_reads_do_not_advance_or_mutate_status() -> None:
    """Break caught: GET count rather than elapsed time advances processing."""
    clock = FakeClock(101.8)
    service = lifecycle(clock)

    first = service.status(record()).model_dump(mode="json")
    repeated = [service.status(record()).model_dump(mode="json") for _ in range(20)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        concurrent_results = list(
            executor.map(lambda _: service.status(record()).model_dump(mode="json"), range(40))
        )

    assert repeated == [first] * 20
    assert concurrent_results == [first] * 40


def test_processing_failure_shows_progress_before_terminal_failure() -> None:
    """Break caught: the deterministic failure is immediate or lacks stage context."""
    clock = FakeClock(101.8)
    service = lifecycle(clock)
    processing = service.status(record("processing_failed"))
    assert processing.status == "normalizing"
    assert processing.progress_percent == 42
    assert processing.error is None

    clock.value = 102.7
    failed = service.status(record("processing_failed"))
    assert failed.status == "failed"
    assert failed.active_stage is None
    assert failed.error is not None
    assert failed.error.code == "PROCESSING_FAILED"
    assert len(failed.stages) == 6
    assert failed.stages[2].state == "failed"
    assert all(stage.state == "pending" for stage in failed.stages[3:])
