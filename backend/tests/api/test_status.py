from __future__ import annotations

import concurrent.futures

from conftest import ApiContext, assert_api_error, multipart_file, validate_component


def create_analysis(api: ApiContext, filename: str = "report.pdf") -> str:
    response = api.client.post("/api/v1/analyses", files=[multipart_file(filename)])
    assert response.status_code == 202
    return response.json()["analysis_id"]


def test_status_is_elapsed_time_derived_and_concurrent_gets_are_identical(api: ApiContext) -> None:
    """Break caught: HTTP polling mutates lifecycle progression."""
    analysis_id = create_analysis(api)
    api.clock.value = 101.8
    path = f"/api/v1/analyses/{analysis_id}/status"

    first = api.client.get(path)
    repeated = [api.client.get(path).json() for _ in range(10)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        concurrent_results = list(executor.map(lambda _: api.client.get(path).json(), range(20)))

    assert first.status_code == 200
    validate_component(first.json(), "AnalysisStatusResponse")
    assert first.json()["status"] == "normalizing"
    assert len(first.json()["stages"]) == 6
    assert repeated == [first.json()] * 10
    assert concurrent_results == [first.json()] * 20


def test_processing_failure_has_visible_progress_then_terminal_error(api: ApiContext) -> None:
    """Break caught: the HTTP failure scenario skips progress or uses a 500 response."""
    analysis_id = create_analysis(api, "scenario-processing-failed.pdf")
    path = f"/api/v1/analyses/{analysis_id}/status"

    api.clock.value = 101.8
    progress = api.client.get(path)
    assert progress.status_code == 200
    assert progress.json()["status"] == "normalizing"
    assert progress.json()["error"] is None

    api.clock.value = 102.7
    failed = api.client.get(path)
    assert failed.status_code == 200
    validate_component(failed.json(), "AnalysisStatusResponse")
    assert failed.json()["status"] == "failed"
    assert failed.json()["error"]["code"] == "PROCESSING_FAILED"


def test_unknown_and_scenario_not_found_status_use_analysis_404(api: ApiContext) -> None:
    """Break caught: unknown/stale analysis status uses a framework 404 envelope."""
    unknown = api.client.get("/api/v1/analyses/anl_stale/status")
    assert_api_error(unknown, 404, "ANALYSIS_NOT_FOUND")

    analysis_id = create_analysis(api, "scenario-analysis-not-found.pdf")
    scenario = api.client.get(f"/api/v1/analyses/{analysis_id}/status")
    assert_api_error(scenario, 404, "ANALYSIS_NOT_FOUND")
