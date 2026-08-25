from __future__ import annotations

import importlib
import importlib.util
from typing import Any

from openapi_spec_validator import validate

APPROVED_OPERATIONS = {
    ("post", "/api/v1/analyses", "createAnalysis"),
    ("get", "/api/v1/analyses/{analysisId}/status", "getAnalysisStatus"),
    ("get", "/api/v1/analyses/{analysisId}/result", "getAnalysisResult"),
    (
        "get",
        "/api/v1/analyses/{analysisId}/evidence/{evidenceId}",
        "getEvidenceDetail",
    ),
}


def business_operations(document: dict[str, Any]) -> set[tuple[str, str, str]]:
    operations: set[tuple[str, str, str]] = set()
    for path, path_item in document["paths"].items():
        for method in ("get", "post", "put", "patch", "delete"):
            operation = path_item.get(method)
            if operation is not None:
                operations.add((method, path, operation["operationId"]))
    return operations


def test_committed_openapi_is_valid_and_has_exactly_four_business_operations() -> None:
    """Break caught: serving a missing, invalid, or expanded API contract."""
    module_spec = importlib.util.find_spec("app.openapi")
    assert module_spec is not None, "app.openapi must load the committed OpenAPI document"

    module = importlib.import_module("app.openapi")
    document = module.load_openapi_document()

    validate(document)
    assert business_operations(document) == APPROVED_OPERATIONS
