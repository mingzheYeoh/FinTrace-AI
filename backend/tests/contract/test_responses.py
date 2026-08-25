from __future__ import annotations

import importlib
from typing import Any

import pytest
from jsonschema import Draft202012Validator
from pydantic import ValidationError
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

from app.openapi import load_openapi_document


def fixture_repository_class() -> type[Any]:
    try:
        module = importlib.import_module("app.repositories.fixture")
    except ModuleNotFoundError:
        pytest.fail("FixtureRepository must validate and expose committed responses")
    return module.FixtureRepository


def validate_component(instance: object, component_name: str) -> None:
    document = load_openapi_document()
    base_uri = "urn:fintrace:openapi"
    resource = Resource(contents=document, specification=DRAFT202012)
    registry = Registry().with_resource(base_uri, resource)
    schema = {"$ref": f"{base_uri}#/components/schemas/{component_name}"}
    Draft202012Validator(schema, registry=registry).validate(instance)


def test_fixture_payloads_match_every_committed_success_schema() -> None:
    """Break caught: a fixture-backed response drifts from the committed schema."""
    repository = fixture_repository_class()()

    create = repository.create_response("anl_generated", ("doc_generated",))
    statuses = repository.status_frames("anl_generated")
    result = repository.result("anl_generated")
    evidence = repository.all_evidence()

    validate_component(create.model_dump(mode="json"), "CreateAnalysisResponse")
    for status in statuses:
        validate_component(status.model_dump(mode="json"), "AnalysisStatusResponse")
    validate_component(result.model_dump(mode="json"), "AnalysisResult")
    for detail in evidence.values():
        validate_component(detail.model_dump(mode="json"), "EvidenceDetail")


def test_public_models_reject_uncommitted_fields() -> None:
    """Break caught: public response dictionaries silently accept unknown fields."""
    try:
        module = importlib.import_module("app.models.contract")
    except ModuleNotFoundError:
        pytest.fail("Strict Pydantic contract models must exist")

    with pytest.raises(ValidationError):
        module.ApiError(
            code="ANALYSIS_NOT_FOUND",
            message="missing",
            retryable=False,
            uncommitted=True,
        )


def test_repository_returns_defensive_copies() -> None:
    """Break caught: one response mutates the fixture singleton for later requests."""
    repository = fixture_repository_class()()

    first = repository.result("anl_first")
    first.summary.company = "mutated"
    first.fields[0].current.value = "999999"

    second = repository.result("anl_second")
    assert second.summary.analysis_id == "anl_second"
    assert second.summary.company == "Northwind Components Bhd (synthetic)"
    assert second.fields[0].current.value == "148200"
