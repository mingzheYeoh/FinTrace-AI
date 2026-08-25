"""Pure elapsed-time lifecycle selection with an injected monotonic clock."""

from __future__ import annotations

import math
import time
from typing import Protocol

from app.errors import processing_failed
from app.models.contract import (
    AnalysisLifecycleStatus,
    AnalysisStatusResponse,
    ProcessingStageState,
)
from app.repositories.fixture import FixtureRepository
from app.repositories.in_memory import AnalysisRecord


class Clock(Protocol):
    def monotonic(self) -> float: ...


class SystemClock:
    def monotonic(self) -> float:
        return time.monotonic()


class LifecycleService:
    """Calculate current status without mutating the stored analysis."""

    def __init__(
        self,
        fixture: FixtureRepository,
        clock: Clock,
        *,
        stage_interval_seconds: float = 0.9,
    ) -> None:
        if stage_interval_seconds <= 0:
            raise ValueError("Stage interval must be positive.")
        self._fixture = fixture
        self._clock = clock
        self._stage_interval_seconds = stage_interval_seconds

    def status(self, record: AnalysisRecord) -> AnalysisStatusResponse:
        elapsed = max(0.0, self._clock.monotonic() - record.created_at_monotonic)
        if record.scenario == "processing_failed" and self._failure_is_terminal(elapsed):
            return self._failed_status(record.analysis_id)

        frames = self._fixture.status_frames(record.analysis_id)
        frame_index = math.floor((elapsed + 1e-9) / self._stage_interval_seconds)
        return frames[min(frame_index, len(frames) - 1)].model_copy(deep=True)

    def is_completed(self, record: AnalysisRecord) -> bool:
        return self.status(record).status == AnalysisLifecycleStatus.COMPLETED

    def _failure_is_terminal(self, elapsed: float) -> bool:
        return elapsed + 1e-9 >= self._stage_interval_seconds * 3

    def _failed_status(self, analysis_id: str) -> AnalysisStatusResponse:
        status = self._fixture.status_frames(analysis_id)[2]
        status.status = AnalysisLifecycleStatus.FAILED
        status.completion_outcome = None
        status.active_stage = None
        status.message = "Analysis failed while normalizing extracted values."
        status.error = processing_failed().body
        status.stages[2].state = ProcessingStageState.FAILED
        for stage in status.stages[3:]:
            stage.state = ProcessingStageState.PENDING
            stage.progress_percent = 0
        return status
