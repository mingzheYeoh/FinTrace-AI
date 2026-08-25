"""FastAPI construction, error boundaries, and committed OpenAPI exposure."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.analyses import router as analyses_router
from app.core.settings import Settings
from app.errors import ApplicationError, invalid_file_set, processing_failed
from app.openapi import load_openapi_document
from app.repositories.fixture import FixtureRepository
from app.repositories.in_memory import AnalysisRepository, InMemoryAnalysisRepository
from app.services.analysis import AnalysisService
from app.services.lifecycle import Clock, LifecycleService, SystemClock

logger = logging.getLogger("fintrace.backend")


class CommittedOpenAPIFastAPI(FastAPI):
    def openapi(self) -> dict[str, Any]:
        return load_openapi_document()


def _error_response(error: ApplicationError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content=error.body.model_dump(mode="json", exclude_none=True),
    )


def create_app(
    *,
    clock: Clock | None = None,
    store: AnalysisRepository | None = None,
    fixture: FixtureRepository | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    configured = settings or Settings()
    fixture_repository = fixture or FixtureRepository()
    analysis_store = store or InMemoryAnalysisRepository()
    lifecycle_clock = clock or SystemClock()
    lifecycle = LifecycleService(
        fixture_repository,
        lifecycle_clock,
        stage_interval_seconds=configured.stage_interval_seconds,
    )
    service = AnalysisService(
        analysis_store,
        fixture_repository,
        lifecycle,
        lifecycle_clock,
    )

    application = CommittedOpenAPIFastAPI(
        title="FinTrace AI API",
        version="1.1.0",
        docs_url="/docs",
        openapi_url="/openapi.json",
        redoc_url=None,
        swagger_ui_oauth2_redirect_url=None,
    )
    application.state.analysis_store = analysis_store
    application.state.analysis_service = service
    application.include_router(analyses_router)

    @application.exception_handler(ApplicationError)
    async def handle_application_error(request: Request, error: ApplicationError) -> JSONResponse:
        del request
        return _error_response(error)

    @application.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        del request, error
        return _error_response(invalid_file_set())

    @application.exception_handler(StarletteHTTPException)
    async def handle_framework_http_error(
        request: Request, error: StarletteHTTPException
    ) -> JSONResponse:
        del request
        if error.status_code == 400:
            return _error_response(invalid_file_set())
        return JSONResponse(status_code=error.status_code, content={"detail": error.detail})

    @application.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        del request, error
        logger.error("Unexpected backend failure; returning the generic contract error.")
        return _error_response(processing_failed())

    return application


app = create_app()
