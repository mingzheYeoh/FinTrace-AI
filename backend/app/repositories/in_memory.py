"""Single-process synchronized analysis metadata repository."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Protocol

from app.models.contract import FileKind


@dataclass(frozen=True)
class FileMetadata:
    name: str
    declared_content_type: str
    size_bytes: int
    kind: FileKind


@dataclass(frozen=True)
class AnalysisRecord:
    analysis_id: str
    document_ids: tuple[str, ...]
    files: tuple[FileMetadata, ...]
    scenario: str
    created_at_monotonic: float


class AnalysisRepository(Protocol):
    async def create(self, record: AnalysisRecord) -> None: ...

    async def get(self, analysis_id: str) -> AnalysisRecord | None: ...


class InMemoryAnalysisRepository:
    """Lock writes and return immutable records safe for concurrent readers."""

    def __init__(self) -> None:
        self._records: dict[str, AnalysisRecord] = {}
        self._write_lock = asyncio.Lock()

    async def create(self, record: AnalysisRecord) -> None:
        async with self._write_lock:
            if record.analysis_id in self._records:
                raise ValueError(f"Analysis ID {record.analysis_id!r} already exists.")
            self._records[record.analysis_id] = record

    async def get(self, analysis_id: str) -> AnalysisRecord | None:
        return self._records.get(analysis_id)

    async def count(self) -> int:
        return len(self._records)
