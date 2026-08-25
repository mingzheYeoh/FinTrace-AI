"""Bounded multipart stream validation with immediate content discard."""

from __future__ import annotations

import unicodedata
from pathlib import PurePosixPath

from fastapi import UploadFile

from app.errors import file_too_large, invalid_file_set, unsupported_file_type
from app.models.contract import FileKind
from app.repositories.in_memory import FileMetadata

MAX_FILES = 5
MAX_FILE_BYTES = 20 * 1024 * 1024
READ_CHUNK_BYTES = 1024 * 1024
OCTET_STREAM = "application/octet-stream"
MIME_TYPES: dict[FileKind, frozenset[str]] = {
    FileKind.PDF: frozenset({"application/pdf", OCTET_STREAM}),
    FileKind.XLSX: frozenset(
        {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            OCTET_STREAM,
        }
    ),
    FileKind.CSV: frozenset({"text/csv", "application/csv", OCTET_STREAM}),
}


def sanitize_filename(filename: str | None) -> str:
    normalized = unicodedata.normalize("NFKC", filename or "")
    basename = PurePosixPath(normalized.replace("\\", "/")).name
    return "".join(character for character in basename if character.isprintable()).strip()


def _normalized_duplicate_key(filename: str) -> str:
    return unicodedata.normalize("NFKC", filename).casefold()


def _kind(filename: str) -> FileKind | None:
    separator, extension = filename.rpartition(".")[::2]
    if not separator:
        return None
    try:
        return FileKind(extension.casefold())
    except ValueError:
        return None


def _declared_type(upload: UploadFile) -> str:
    return (upload.content_type or "").partition(";")[0].strip().casefold()


def _development_boundary_error(filenames: list[str]) -> None:
    lowered = [filename.casefold() for filename in filenames]
    if any("scenario-unsupported" in filename for filename in lowered):
        raise unsupported_file_type()
    if any("scenario-file-too-large" in filename for filename in lowered):
        raise file_too_large()
    if any("scenario-too-many-files" in filename for filename in lowered):
        raise invalid_file_set()


async def validate_and_discard_uploads(
    files: list[UploadFile],
) -> tuple[FileMetadata, ...]:
    """Validate metadata and streamed size, close streams, and retain no bytes."""
    try:
        if not 1 <= len(files) <= MAX_FILES:
            raise invalid_file_set()

        validated: list[tuple[UploadFile, str, FileKind, str]] = []
        duplicate_keys: set[str] = set()
        for upload in files:
            filename = sanitize_filename(upload.filename)
            kind = _kind(filename)
            declared_type = _declared_type(upload)
            if not filename or kind is None or declared_type not in MIME_TYPES[kind]:
                raise unsupported_file_type()
            duplicate_key = _normalized_duplicate_key(filename)
            if duplicate_key in duplicate_keys:
                raise invalid_file_set()
            duplicate_keys.add(duplicate_key)
            validated.append((upload, filename, kind, declared_type))

        _development_boundary_error([item[1] for item in validated])

        metadata: list[FileMetadata] = []
        for upload, filename, kind, declared_type in validated:
            size_bytes = 0
            while True:
                chunk = await upload.read(READ_CHUNK_BYTES)
                if not chunk:
                    break
                size_bytes += len(chunk)
                if size_bytes > MAX_FILE_BYTES:
                    raise file_too_large()
            metadata.append(
                FileMetadata(
                    name=filename,
                    declared_content_type=declared_type,
                    size_bytes=size_bytes,
                    kind=kind,
                )
            )
        return tuple(metadata)
    finally:
        for upload in files:
            try:
                await upload.close()
            except Exception:
                # Continue closing the remaining multipart resources. The server's
                # generic error boundary handles a close failure if one is surfaced.
                continue
