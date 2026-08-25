from __future__ import annotations

import asyncio
from dataclasses import fields
from io import BytesIO
from typing import BinaryIO

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

MAX_FILE_BYTES = 20 * 1024 * 1024


class TrackingBytesIO(BytesIO):
    def __init__(self, initial_bytes: bytes) -> None:
        super().__init__(initial_bytes)
        self.read_sizes: list[int] = []

    def read(self, size: int = -1) -> bytes:
        self.read_sizes.append(size)
        return super().read(size)


def upload(
    name: str,
    content_type: str,
    *,
    content: bytes = b"synthetic",
    stream: BinaryIO | None = None,
) -> UploadFile:
    return UploadFile(
        file=stream or BytesIO(content),
        filename=name,
        headers=Headers({"content-type": content_type}),
    )


def validate(files: list[UploadFile]):
    try:
        from app.services.uploads import validate_and_discard_uploads
    except ModuleNotFoundError:
        pytest.fail("The streamed upload validator must exist")
    return asyncio.run(validate_and_discard_uploads(files))


def assert_error(files: list[UploadFile], status: int, code: str) -> None:
    try:
        from app.errors import ApplicationError
    except ModuleNotFoundError:
        pytest.fail("Expected upload errors must use the shared contract error")

    with pytest.raises(ApplicationError) as caught:
        validate(files)
    assert caught.value.status_code == status
    assert caught.value.body.code == code
    assert all(item.file.closed for item in files)


@pytest.mark.parametrize("count", [1, 5])
def test_accepts_one_through_five_files_and_closes_every_stream(count: int) -> None:
    """Break caught: an allowed file count is rejected or streams stay open."""
    files = [upload(f"report-{index}.pdf", "application/pdf") for index in range(count)]

    metadata = validate(files)

    assert len(metadata) == count
    assert all(item.file.closed for item in files)


def test_rejects_zero_and_six_files_without_reading_or_leaking_streams() -> None:
    """Break caught: invalid file counts create work or leave multipart resources open."""
    assert_error([], 422, "INVALID_FILE_SET")
    files = [upload(f"report-{index}.pdf", "application/pdf") for index in range(6)]
    assert_error(files, 422, "INVALID_FILE_SET")


def test_accepts_exactly_twenty_mib_and_rejects_one_byte_more() -> None:
    """Break caught: the inclusive 20 MiB boundary is implemented off by one."""
    exact = upload("exact.csv", "text/csv", content=b"x" * MAX_FILE_BYTES)
    metadata = validate([exact])
    assert metadata[0].size_bytes == MAX_FILE_BYTES
    assert exact.file.closed

    oversized = upload("oversized.csv", "text/csv", content=b"x" * (MAX_FILE_BYTES + 1))
    assert_error([oversized], 413, "FILE_TOO_LARGE")


@pytest.mark.parametrize(
    ("name", "content_type", "kind"),
    [
        ("REPORT.PDF", "application/pdf", "pdf"),
        (
            "REPORT.XLSX",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xlsx",
        ),
        ("REPORT.CSV", "text/csv; charset=utf-8", "csv"),
        ("browser.PDF", "application/octet-stream", "pdf"),
        ("export.csv", "application/csv", "csv"),
    ],
)
def test_accepts_supported_extensions_and_declared_mime_types(
    name: str, content_type: str, kind: str
) -> None:
    """Break caught: an approved case/MIME combination is rejected."""
    item = upload(name, content_type)
    metadata = validate([item])
    assert metadata[0].kind == kind


@pytest.mark.parametrize(
    ("name", "content_type"),
    [
        ("report.docx", "application/octet-stream"),
        ("report.pdf", "text/plain"),
        ("report.xlsx", "application/pdf"),
    ],
)
def test_rejects_unsupported_extension_or_declared_mime(name: str, content_type: str) -> None:
    """Break caught: extension-only validation permits an unapproved declared type."""
    assert_error([upload(name, content_type)], 415, "UNSUPPORTED_FILE_TYPE")


def test_rejects_duplicate_unicode_normalized_casefolded_filenames() -> None:
    """Break caught: visually equivalent filenames bypass duplicate detection."""
    files = [
        upload("R\u00e9sum\u00e9.PDF", "application/pdf"),
        upload("re\u0301sume\u0301.pdf", "application/pdf"),
    ]
    assert_error(files, 422, "INVALID_FILE_SET")


def test_reads_in_bounded_chunks_sanitizes_names_and_returns_no_raw_bytes() -> None:
    """Break caught: upload validation reads unbounded content or retains the payload."""
    stream = TrackingBytesIO(b"x" * (2 * 1024 * 1024 + 17))
    item = upload("../../Quarter.PDF", "application/pdf", stream=stream)

    metadata = validate([item])

    assert metadata[0].name == "Quarter.PDF"
    assert metadata[0].size_bytes == 2 * 1024 * 1024 + 17
    assert stream.read_sizes
    assert max(stream.read_sizes) <= 1024 * 1024
    assert not any(
        isinstance(getattr(metadata[0], field.name), (bytes, bytearray))
        for field in fields(metadata[0])
    )


def test_a_late_failure_still_closes_earlier_and_later_streams() -> None:
    """Break caught: only the stream that raised is closed on a multi-file failure."""
    files = [
        upload("first.pdf", "application/pdf"),
        upload("bad.exe", "application/octet-stream"),
        upload("last.csv", "text/csv"),
    ]
    assert_error(files, 415, "UNSUPPORTED_FILE_TYPE")
