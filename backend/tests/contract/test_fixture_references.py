from __future__ import annotations

import importlib
import json
from pathlib import Path
from typing import Any

import pytest

DECIMAL_PATTERN = r"^-?[0-9]+(?:\.[0-9]+)?$"


def fixture_repository_class() -> type[Any]:
    try:
        module = importlib.import_module("app.repositories.fixture")
    except ModuleNotFoundError:
        pytest.fail("FixtureRepository must validate fixture reference integrity")
    return module.FixtureRepository


def test_fixture_counts_values_and_references_are_preserved() -> None:
    """Break caught: fixture quantities or evidence/provenance references drift."""
    repository = fixture_repository_class()()
    result = repository.result("anl_contract")
    evidence = repository.all_evidence()

    assert len(result.fields) == 19
    assert len(result.calculations) == 19
    assert len(result.kpis) == 6
    assert len(result.ratios) == 7
    assert len(result.trends) == 25
    assert len({point.period for point in result.trends}) == 5
    assert len(result.anomalies) == 7
    assert len(result.insights) == 3
    assert len(result.follow_up_questions) == 5
    assert result.summary.extraction_summary.targeted_fields == 19
    assert result.summary.extraction_summary.extracted_fields == 17
    assert result.summary.extraction_summary.manual_review_count == 3
    assert sum(field.requires_manual_review for field in result.fields) == 3

    field_ids = {field.id for field in result.fields}
    value_ids = {value.id for field in result.fields for value in (field.current, field.prior)}
    calculation_ids = {calculation.id for calculation in result.calculations}
    evidence_ids = set(evidence)
    document_ids = {document.id for document in result.summary.documents}

    for field in result.fields:
        assert field.evidence_id in evidence_ids
        for value in (field.current, field.prior):
            for source in value.sources:
                assert source.document_id in document_ids
        if field.conflict is not None:
            assert field.conflict.source.document_id in document_ids
    for calculation in result.calculations:
        assert set(calculation.input_value_ids) <= value_ids
        assert calculation.evidence_id in evidence_ids
    for kpi in result.kpis:
        assert kpi.calculation_id in calculation_ids
        assert kpi.evidence_id in evidence_ids
    for ratio in result.ratios:
        assert ratio.current_calculation_id in calculation_ids
        assert ratio.prior_calculation_id in calculation_ids
        assert ratio.evidence_id in evidence_ids
    for item in [*result.anomalies, *result.insights]:
        assert set(item.fact_ids) <= field_ids
        assert set(item.calculation_ids) <= calculation_ids
        assert item.evidence_id in evidence_ids
    for evidence_id, detail in evidence.items():
        assert detail.evidence_id == evidence_id
        assert set(detail.fact_ids) <= field_ids
        assert set(detail.calculation_ids) <= calculation_ids


def test_debt_to_equity_uses_borrowings_and_equity_exactly() -> None:
    """Break caught: total liabilities replaces borrowings in Debt-to-equity."""
    result = fixture_repository_class()().result("anl_contract")
    calculations = {calculation.id: calculation for calculation in result.calculations}

    current = calculations["c_debt_to_equity_current"]
    prior = calculations["c_debt_to_equity_prior"]

    assert current.formula == "Borrowings / Shareholders' equity"
    assert current.input_value_ids == [
        "value_borrowings_current",
        "value_shareholders_equity_current",
    ]
    assert current.substitution == "54,600 / 48,210"
    assert current.result == "1.13"
    assert prior.formula == "Borrowings / Shareholders' equity"
    assert prior.input_value_ids == [
        "value_borrowings_prior",
        "value_shareholders_equity_prior",
    ]
    assert prior.substitution == "38,150 / 46,880"
    assert prior.result == "0.81"
    assert all("total_liabilities" not in value_id for value_id in current.input_value_ids)


def test_all_financial_transport_numbers_remain_decimal_strings() -> None:
    """Break caught: a financial transport value is coerced to a JSON number."""
    import re

    result = fixture_repository_class()().result("anl_contract")
    values: list[str] = []
    for field in result.fields:
        for period_value in (field.current, field.prior):
            if period_value.value is not None:
                values.append(period_value.value)
        for value in (field.absolute_change, field.percentage_change):
            if value is not None:
                values.append(value)
    values.extend(calculation.result for calculation in result.calculations)
    for kpi in result.kpis:
        values.extend((kpi.current, kpi.prior, kpi.absolute_change, kpi.percentage_change))
    for ratio in result.ratios:
        values.extend((ratio.current, ratio.prior, ratio.absolute_change, ratio.percentage_change))
    values.extend(point.value for point in result.trends)

    assert values
    assert all(isinstance(value, str) and re.fullmatch(DECIMAL_PATTERN, value) for value in values)


def test_fixture_path_is_independent_of_caller_working_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Break caught: starting Uvicorn outside the repository loses the fixture."""
    monkeypatch.chdir(tmp_path)
    repository = fixture_repository_class()()
    assert repository.result("anl_elsewhere").summary.analysis_id == "anl_elsewhere"


def test_invalid_fixture_fails_construction_with_a_non_sensitive_message(tmp_path: Path) -> None:
    """Break caught: invalid committed data reaches traffic or leaks fixture contents."""
    fixture_path = tmp_path / "invalid.json"
    fixture_path.write_text(json.dumps({"fixture_version": "broken"}), encoding="utf-8")

    with pytest.raises(RuntimeError, match="fixture is invalid") as error:
        fixture_repository_class()(fixture_path=fixture_path)

    assert "broken" not in str(error.value)
