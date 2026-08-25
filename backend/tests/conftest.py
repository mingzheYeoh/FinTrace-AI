from __future__ import annotations

import asyncio
import importlib
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

from app.openapi import load_openapi_document


class FakeClock:
    def __init__(self, value: float = 100.0) -> None:
        self.value = value

    def monotonic(self) -> float:
        return self.value


@dataclass
class ApiContext:
    app: FastAPI
    client: ApiClient
    clock: FakeClock


class ApiClient:
    """Small synchronous facade over HTTPX's real in-process ASGI transport."""

    def __init__(self, app: FastAPI) -> None:
        self._app = app

    def request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        async def send() -> httpx.Response:
            transport = httpx.ASGITransport(app=self._app, raise_app_exceptions=False)
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://testserver",
            ) as client:
                return await client.request(method, path, **kwargs)

        return asyncio.run(send())

    def get(self, path: str, **kwargs: Any) -> httpx.Response:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> httpx.Response:
        return self.request("POST", path, **kwargs)


def create_test_app(*, store: object | None = None) -> tuple[FastAPI, FakeClock]:
    try:
        module = importlib.import_module("app.main")
    except ModuleNotFoundError:
        pytest.fail("The FastAPI application factory must exist")
    clock = FakeClock()
    app = module.create_app(clock=clock, store=store)
    return app, clock


@pytest.fixture
def api() -> Iterator[ApiContext]:
    app, clock = create_test_app()
    yield ApiContext(app=app, client=ApiClient(app), clock=clock)


def multipart_file(
    name: str = "report.pdf",
    content: bytes = b"synthetic",
    content_type: str = "application/pdf",
) -> tuple[str, tuple[str, bytes, str]]:
    return ("files", (name, content, content_type))


def validate_component(instance: object, component_name: str) -> None:
    document = load_openapi_document()
    base_uri = "urn:fintrace:openapi"
    resource = Resource.from_contents(document, DRAFT202012)
    registry = Registry().with_resource(base_uri, resource)
    schema = {"$ref": f"{base_uri}#/components/schemas/{component_name}"}
    Draft202012Validator(schema, registry=registry).validate(instance)


def assert_api_error(response: Any, status: int, code: str) -> None:
    assert response.status_code == status
    body = response.json()
    validate_component(body, "ApiError")
    assert body["code"] == code
