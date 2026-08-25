from __future__ import annotations

import pytest
from conftest import (
    ApiClient,
    ApiContext,
    assert_api_error,
    create_test_app,
    multipart_file,
    validate_component,
)

MAX_FILE_BYTES = 20 * 1024 * 1024


@pytest.mark.parametrize("count", [1, 5])
def test_create_accepts_one_or_five_files_with_unique_opaque_ids(
    api: ApiContext, count: int
) -> None:
    """Break caught: the HTTP boundary rejects valid counts or reuses IDs."""
    files = [multipart_file(f"report-{index}.pdf") for index in range(count)]

    first = api.client.post("/api/v1/analyses", files=files)
    second = api.client.post("/api/v1/analyses", files=files)

    assert first.status_code == 202
    assert second.status_code == 202
    first_body = first.json()
    second_body = second.json()
    validate_component(first_body, "CreateAnalysisResponse")
    assert first_body["analysis_id"].startswith("anl_")
    assert len(first_body["document_ids"]) == count
    assert all(document_id.startswith("doc_") for document_id in first_body["document_ids"])
    assert first_body["analysis_id"] != second_body["analysis_id"]


def test_create_rejects_zero_six_duplicate_and_malformed_multipart_without_records(
    api: ApiContext,
) -> None:
    """Break caught: malformed file sets pass FastAPI defaults or create state."""
    zero = api.client.post("/api/v1/analyses")
    six = api.client.post(
        "/api/v1/analyses",
        files=[multipart_file(f"report-{index}.pdf") for index in range(6)],
    )
    duplicate = api.client.post(
        "/api/v1/analyses",
        files=[multipart_file("Report.PDF"), multipart_file("report.pdf")],
    )
    malformed = api.client.post(
        "/api/v1/analyses",
        content=b"--not-a-valid-body",
        headers={"content-type": "multipart/form-data; boundary=broken"},
    )

    for response in (zero, six, duplicate, malformed):
        assert_api_error(response, 422, "INVALID_FILE_SET")
    assert api.app.state.analysis_store._records == {}


def test_create_enforces_exact_stream_size_boundary(api: ApiContext) -> None:
    """Break caught: HTTP multipart handling changes the inclusive 20 MiB rule."""
    exact = api.client.post(
        "/api/v1/analyses",
        files=[multipart_file("exact.csv", b"x" * MAX_FILE_BYTES, "text/csv")],
    )
    oversized = api.client.post(
        "/api/v1/analyses",
        files=[multipart_file("large.csv", b"x" * (MAX_FILE_BYTES + 1), "text/csv")],
    )

    assert exact.status_code == 202
    validate_component(exact.json(), "CreateAnalysisResponse")
    assert_api_error(oversized, 413, "FILE_TOO_LARGE")


@pytest.mark.parametrize(
    ("name", "content_type", "expected_status"),
    [
        ("REPORT.PDF", "application/pdf", 202),
        ("REPORT.XLSX", "application/octet-stream", 202),
        ("REPORT.CSV", "text/csv", 202),
        ("report.docx", "application/octet-stream", 415),
        ("report.pdf", "text/plain", 415),
    ],
)
def test_create_enforces_extension_and_declared_mime(
    api: ApiContext, name: str, content_type: str, expected_status: int
) -> None:
    """Break caught: the HTTP route bypasses upload extension/MIME validation."""
    response = api.client.post(
        "/api/v1/analyses", files=[multipart_file(name, content_type=content_type)]
    )
    if expected_status == 202:
        assert response.status_code == 202
        validate_component(response.json(), "CreateAnalysisResponse")
    else:
        assert_api_error(response, 415, "UNSUPPORTED_FILE_TYPE")


@pytest.mark.parametrize(
    ("filename", "status", "code"),
    [
        ("scenario-unsupported.pdf", 415, "UNSUPPORTED_FILE_TYPE"),
        ("scenario-file-too-large.pdf", 413, "FILE_TOO_LARGE"),
        ("scenario-too-many-files.pdf", 422, "INVALID_FILE_SET"),
    ],
)
def test_boundary_filename_scenarios_remain_reachable(
    api: ApiContext, filename: str, status: int, code: str
) -> None:
    """Break caught: documented demo failures require an undocumented control."""
    response = api.client.post("/api/v1/analyses", files=[multipart_file(filename)])
    assert_api_error(response, status, code)


def test_unexpected_failure_returns_generic_contract_500() -> None:
    """Break caught: an internal exception leaks a stack trace or FastAPI detail shape."""

    class FailingStore:
        async def create(self, record: object) -> None:
            raise RuntimeError("sensitive implementation detail")

        async def get(self, analysis_id: str) -> None:
            return None

    app, _ = create_test_app(store=FailingStore())
    response = ApiClient(app).post("/api/v1/analyses", files=[multipart_file()])

    assert_api_error(response, 500, "PROCESSING_FAILED")
    assert "sensitive" not in response.text
