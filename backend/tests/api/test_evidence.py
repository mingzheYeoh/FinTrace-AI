from __future__ import annotations

from conftest import ApiContext, assert_api_error, multipart_file, validate_component


def create_analysis(api: ApiContext, filename: str = "report.pdf") -> str:
    response = api.client.post("/api/v1/analyses", files=[multipart_file(filename)])
    assert response.status_code == 202
    return response.json()["analysis_id"]


def test_known_evidence_is_repeatable_and_unknown_evidence_is_scoped(api: ApiContext) -> None:
    """Break caught: evidence lookup mutates bindings or damages the analysis on 404."""
    analysis_id = create_analysis(api)
    known_path = f"/api/v1/analyses/{analysis_id}/evidence/ev_kpi_revenue"

    first = api.client.get(known_path)
    second = api.client.get(known_path)
    assert first.status_code == 200
    validate_component(first.json(), "EvidenceDetail")
    assert first.json() == second.json()

    missing = api.client.get(f"/api/v1/analyses/{analysis_id}/evidence/ev_missing")
    assert_api_error(missing, 404, "EVIDENCE_NOT_FOUND")
    status = api.client.get(f"/api/v1/analyses/{analysis_id}/status")
    assert status.status_code == 200


def test_evidence_distinguishes_unknown_analysis_and_scenario_missing(api: ApiContext) -> None:
    """Break caught: evidence 404s collapse analysis and binding failures."""
    unknown = api.client.get("/api/v1/analyses/anl_stale/evidence/ev_kpi_revenue")
    assert_api_error(unknown, 404, "ANALYSIS_NOT_FOUND")

    analysis_id = create_analysis(api, "scenario-evidence-not-found.pdf")
    scenario = api.client.get(f"/api/v1/analyses/{analysis_id}/evidence/ev_kpi_revenue")
    assert_api_error(scenario, 404, "EVIDENCE_NOT_FOUND")
