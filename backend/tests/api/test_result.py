from __future__ import annotations

from conftest import ApiContext, assert_api_error, multipart_file, validate_component


def create_analysis(api: ApiContext, filename: str = "report.pdf") -> str:
    response = api.client.post("/api/v1/analyses", files=[multipart_file(filename)])
    assert response.status_code == 202
    return response.json()["analysis_id"]


def test_result_is_not_ready_immediately_before_and_ready_at_completion(api: ApiContext) -> None:
    """Break caught: the result completion boundary differs from status timing."""
    analysis_id = create_analysis(api)
    path = f"/api/v1/analyses/{analysis_id}/result"

    api.clock.value = 105.399999
    assert_api_error(api.client.get(path), 409, "RESULT_NOT_READY")

    api.clock.value = 105.4
    completed = api.client.get(path)
    assert completed.status_code == 200
    validate_component(completed.json(), "AnalysisResult")
    assert completed.json()["summary"]["analysis_id"] == analysis_id
    assert completed.json()["summary"]["extraction_summary"] == {
        "targeted_fields": 19,
        "extracted_fields": 17,
        "manual_review_count": 3,
    }


def test_result_unknown_failed_and_forced_not_ready_errors(api: ApiContext) -> None:
    """Break caught: result error scenarios expose happy fixture data."""
    assert_api_error(api.client.get("/api/v1/analyses/anl_stale/result"), 404, "ANALYSIS_NOT_FOUND")

    for filename in ("scenario-result-not-ready.pdf", "scenario-processing-failed.pdf"):
        analysis_id = create_analysis(api, filename)
        api.clock.value = 105.4
        response = api.client.get(f"/api/v1/analyses/{analysis_id}/result")
        assert_api_error(response, 409, "RESULT_NOT_READY")
