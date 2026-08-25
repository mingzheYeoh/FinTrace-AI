"""Shared expected-error representation for services and HTTP handlers."""

from __future__ import annotations

from app.models.contract import ApiError


class ApplicationError(Exception):
    """An expected API failure with an exact committed error envelope."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        *,
        retryable: bool,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.body = ApiError(code=code, message=message, retryable=retryable)


def invalid_file_set() -> ApplicationError:
    return ApplicationError(
        422,
        "INVALID_FILE_SET",
        "Select between one and five files for one analysis.",
        retryable=False,
    )


def unsupported_file_type() -> ApplicationError:
    return ApplicationError(
        415,
        "UNSUPPORTED_FILE_TYPE",
        "FinTrace AI accepts searchable PDF, XLSX, and structured CSV files.",
        retryable=False,
    )


def file_too_large() -> ApplicationError:
    return ApplicationError(
        413,
        "FILE_TOO_LARGE",
        "Each file must be 20 MB or smaller.",
        retryable=False,
    )


def analysis_not_found() -> ApplicationError:
    return ApplicationError(
        404,
        "ANALYSIS_NOT_FOUND",
        "The requested analysis could not be found.",
        retryable=False,
    )


def evidence_not_found() -> ApplicationError:
    return ApplicationError(
        404,
        "EVIDENCE_NOT_FOUND",
        "The requested evidence trail could not be found.",
        retryable=False,
    )


def result_not_ready() -> ApplicationError:
    return ApplicationError(
        409,
        "RESULT_NOT_READY",
        "The analysis result is not ready yet.",
        retryable=True,
    )


def processing_failed() -> ApplicationError:
    return ApplicationError(
        500,
        "PROCESSING_FAILED",
        "The analysis could not be completed. Start a new analysis and try again.",
        retryable=True,
    )
