from __future__ import annotations

import asyncio
from dataclasses import FrozenInstanceError, fields, is_dataclass
from typing import Any

import pytest


def store_types() -> tuple[type[Any], type[Any], type[Any]]:
    try:
        from app.repositories.in_memory import (
            AnalysisRecord,
            FileMetadata,
            InMemoryAnalysisRepository,
        )
    except ModuleNotFoundError:
        pytest.fail("The immutable synchronized analysis repository must exist")
    return AnalysisRecord, FileMetadata, InMemoryAnalysisRepository


def record(index: int = 1):
    AnalysisRecord, FileMetadata, _ = store_types()
    return AnalysisRecord(
        analysis_id=f"anl_{index}",
        document_ids=(f"doc_{index}",),
        files=(
            FileMetadata(
                name=f"report-{index}.pdf",
                declared_content_type="application/pdf",
                size_bytes=index,
                kind="pdf",
            ),
        ),
        scenario="happy_path_with_review_flags",
        created_at_monotonic=float(index),
    )


def contains_raw_bytes(value: object) -> bool:
    if isinstance(value, (bytes, bytearray, memoryview)):
        return True
    if is_dataclass(value) and not isinstance(value, type):
        return any(contains_raw_bytes(getattr(value, field.name)) for field in fields(value))
    if isinstance(value, (tuple, list, set)):
        return any(contains_raw_bytes(item) for item in value)
    if isinstance(value, dict):
        return any(contains_raw_bytes(item) for item in value.values())
    return False


def test_store_writes_and_reads_immutable_copy_safe_records() -> None:
    """Break caught: callers can mutate shared in-memory analysis state."""
    _, _, Repository = store_types()
    repository = Repository()
    expected = record()

    async def exercise():
        await repository.create(expected)
        return await repository.get(expected.analysis_id)

    actual = asyncio.run(exercise())
    assert actual == expected
    assert actual is not None
    with pytest.raises(FrozenInstanceError):
        actual.analysis_id = "mutated"
    assert not contains_raw_bytes(actual)


def test_store_returns_none_for_unknown_or_stale_analysis() -> None:
    """Break caught: a missing analysis raises or fabricates state."""
    _, _, Repository = store_types()
    assert asyncio.run(Repository().get("anl_missing")) is None


def test_store_synchronizes_concurrent_unique_writes() -> None:
    """Break caught: concurrent creates lose records in the single-process registry."""
    _, _, Repository = store_types()
    repository = Repository()
    records = [record(index) for index in range(1, 51)]

    async def exercise():
        await asyncio.gather(*(repository.create(item) for item in records))
        return await asyncio.gather(*(repository.get(item.analysis_id) for item in records))

    returned = asyncio.run(exercise())
    assert returned == records
    assert asyncio.run(repository.count()) == 50


def test_store_rejects_duplicate_analysis_ids_without_overwriting() -> None:
    """Break caught: a duplicate opaque ID silently replaces an active analysis."""
    _, _, Repository = store_types()
    repository = Repository()
    first = record(1)

    async def exercise() -> None:
        await repository.create(first)
        with pytest.raises(ValueError, match="already exists"):
            await repository.create(first)

    asyncio.run(exercise())
    assert asyncio.run(repository.get(first.analysis_id)) == first
