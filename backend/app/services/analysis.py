"""Use-case orchestration for the four approved FinTrace operations."""

from __future__ import annotations

from uuid import uuid4

from fastapi import UploadFile

from app.errors import analysis_not_found, evidence_not_found, result_not_ready
from app.models.contract import (
    AnalysisResult,
    AnalysisStatusResponse,
    CreateAnalysisResponse,
    EvidenceDetail,
)
from app.repositories.fixture import FixtureRepository
from app.repositories.in_memory import (
    AnalysisRecord,
    AnalysisRepository,
)
from app.services.lifecycle import Clock, LifecycleService
from app.services.uploads import validate_and_discard_uploads

DEFAULT_SCENARIO = "happy_path_with_review_flags"


def scenario_from_filenames(filenames: tuple[str, ...]) -> str:
    scenario_markers = (
        ("scenario-processing-failed", "processing_failed"),
        ("scenario-result-not-ready", "result_not_ready"),
        ("scenario-analysis-not-found", "analysis_not_found"),
        ("scenario-evidence-not-found", "evidence_not_found"),
        ("scenario-file-too-large", "file_too_large"),
        ("scenario-unsupported", "unsupported_file"),
        ("scenario-too-many-files", "too_many_files"),
    )
    for filename in filenames:
        lowered = filename.casefold()
        for marker, scenario in scenario_markers:
            if marker in lowered:
                return scenario
    return DEFAULT_SCENARIO


class AnalysisService:
    def __init__(
        self,
        store: AnalysisRepository,
        fixture: FixtureRepository,
        lifecycle: LifecycleService,
        clock: Clock,
    ) -> None:
        self._store = store
        self._fixture = fixture
        self._lifecycle = lifecycle
        self._clock = clock

    async def create(self, files: list[UploadFile]) -> CreateAnalysisResponse:
        metadata = await validate_and_discard_uploads(files)
        analysis_id = f"anl_{uuid4().hex}"
        document_ids = tuple(f"doc_{uuid4().hex}" for _ in metadata)
        record = AnalysisRecord(
            analysis_id=analysis_id,
            document_ids=document_ids,
            files=metadata,
            scenario=scenario_from_filenames(tuple(item.name for item in metadata)),
            created_at_monotonic=self._clock.monotonic(),
        )
        await self._store.create(record)
        return self._fixture.create_response(analysis_id, document_ids)

    async def status(self, analysis_id: str) -> AnalysisStatusResponse:
        record = await self._existing_record(analysis_id)
        return self._lifecycle.status(record)

    async def result(self, analysis_id: str) -> AnalysisResult:
        record = await self._existing_record(analysis_id)
        if record.scenario in {"result_not_ready", "processing_failed"}:
            raise result_not_ready()
        if not self._lifecycle.is_completed(record):
            raise result_not_ready()
        return self._fixture.result(analysis_id)

    async def evidence(self, analysis_id: str, evidence_id: str) -> EvidenceDetail:
        record = await self._existing_record(analysis_id)
        if record.scenario == "evidence_not_found":
            raise evidence_not_found()
        detail = self._fixture.evidence(evidence_id)
        if detail is None:
            raise evidence_not_found()
        return detail

    async def _existing_record(self, analysis_id: str) -> AnalysisRecord:
        record = await self._store.get(analysis_id)
        if record is None or record.scenario == "analysis_not_found":
            raise analysis_not_found()
        return record
