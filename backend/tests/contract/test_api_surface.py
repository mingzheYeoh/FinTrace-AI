from __future__ import annotations

from conftest import ApiContext

from app.openapi import load_openapi_document

APPROVED_METHOD_PATHS = {
    ("POST", "/api/v1/analyses"),
    ("GET", "/api/v1/analyses/{analysisId}/status"),
    ("GET", "/api/v1/analyses/{analysisId}/result"),
    ("GET", "/api/v1/analyses/{analysisId}/evidence/{evidenceId}"),
}

APPROVED_FRAMEWORK_PATHS = {"/docs", "/openapi.json"}


def test_fastapi_registers_exactly_four_business_method_paths(api: ApiContext) -> None:
    """Break caught: implementation exposes an unapproved business operation."""
    implemented: set[tuple[str, str]] = set()
    routes = list(api.app.routes)
    for route in list(routes):
        included_router = getattr(route, "original_router", None)
        if included_router is not None:
            routes.extend(included_router.routes)
    for route in routes:
        path = getattr(route, "path", "")
        if path.startswith("/api/v1"):
            for method in getattr(route, "methods", set()) or set():
                if method in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                    implemented.add((method, path))
    assert implemented == APPROVED_METHOD_PATHS


def test_fastapi_registers_only_approved_framework_endpoints(api: ApiContext) -> None:
    """Break caught: a default framework route expands the approved API surface."""
    framework_paths = {
        path
        for route in api.app.routes
        if (path := getattr(route, "path", "")) and not path.startswith("/api/v1")
    }
    assert framework_paths == APPROVED_FRAMEWORK_PATHS


def test_swagger_exposes_the_validated_committed_document(api: ApiContext) -> None:
    """Break caught: FastAPI reconstructs and drifts from the protected contract."""
    response = api.client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json() == load_openapi_document()
    assert api.client.get("/docs").status_code == 200
