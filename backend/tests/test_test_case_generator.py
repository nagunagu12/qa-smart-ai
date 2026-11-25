import json

import pytest
import httpx
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    monkeypatch.setenv(
        "QA_SMART_AI_DATABASE_PATH",
        str(tmp_path / "test-cases.sqlite3"),
    )
    with TestClient(app) as test_client:
        yield test_client


def valid_request(**overrides):
    payload = {
        "feature_name": "Password reset",
        "feature_description": "A user can request a password reset by email.",
        "acceptance_criteria": "A reset email is sent to the registered address.",
        "testing_type": "Positive",
        "number_of_cases": 2,
    }
    return {**payload, **overrides}


def test_generation_returns_requested_mock_cases_with_unexecuted_state(client):
    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(),
    )

    assert response.status_code == 200
    result = response.json()
    assert result["provider"] == "mock"
    assert result["is_mock"] is True
    assert len(result["test_cases"]) == 2
    assert len({case["test_case_id"] for case in result["test_cases"]}) == 2
    for case in result["test_cases"]:
        assert case["module_name"] == "Password reset"
        assert case["actual_result"] == ""
        assert case["status"] == "Not Executed"


def test_generation_accepts_maximum_sized_feature_details(client):
    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(
            feature_description="D" * 6000,
            acceptance_criteria="A" * 6000,
            number_of_cases=1,
        ),
    )

    assert response.status_code == 200
    assert len(response.json()["test_cases"]) == 1


@pytest.mark.parametrize(
    "overrides",
    [
        {"feature_name": "   "},
        {"feature_description": ""},
        {"acceptance_criteria": ""},
        {"testing_type": "Security"},
        {"number_of_cases": 0},
        {"number_of_cases": 21},
    ],
)
def test_generation_rejects_invalid_input(client, overrides):
    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(**overrides),
    )

    assert response.status_code == 422


def test_edited_cases_are_saved_to_sqlite_and_can_be_listed(client):
    generated = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    ).json()["test_cases"][0]
    generated["test_case_title"] = "Edited reset email test"
    generated["test_steps"] = "1. Request a reset.\n2. Check the email."

    saved_response = client.post(
        "/api/v1/test-cases/bulk",
        json={"test_cases": [generated]},
    )
    listed_response = client.get("/api/v1/test-cases")

    assert saved_response.status_code == 200
    assert saved_response.json()["saved_count"] == 1
    assert listed_response.status_code == 200
    saved_case = listed_response.json()[0]
    assert saved_case["test_case_id"] == generated["test_case_id"]
    assert saved_case["test_case_title"] == "Edited reset email test"
    assert saved_case["test_steps"] == "1. Request a reset.\n2. Check the email."
    assert saved_case["actual_result"] == ""
    assert saved_case["status"] == "Not Executed"


@pytest.mark.parametrize(
    "field,value",
    [("actual_result", "Passed"), ("status", "Passed")],
)
def test_save_rejects_execution_results_before_testing(client, field, value):
    generated = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    ).json()["test_cases"][0]
    generated[field] = value

    response = client.post(
        "/api/v1/test-cases/bulk",
        json={"test_cases": [generated]},
    )

    assert response.status_code == 422


def test_configured_provider_requires_environment_api_key(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai-compatible")
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    )

    assert response.status_code == 503
    assert "LLM_API_KEY" in response.json()["detail"]


def test_configured_provider_uses_server_side_key_and_validates_llm_response(
    client, monkeypatch
):
    monkeypatch.setenv("AI_PROVIDER", "openai-compatible")
    monkeypatch.setenv("LLM_API_KEY", "test-only-secret")
    monkeypatch.setenv("LLM_BASE_URL", "https://llm.example.test/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")
    llm_content = {
        "test_cases": [
            {
                "module_name": "Password reset",
                "test_scenario": "Positive reset flow",
                "test_case_title": "Reset email is sent",
                "preconditions": "A registered account exists.",
                "test_steps": "1. Request a reset.",
                "test_data": "qa@example.test",
                "expected_result": "A reset email is sent.",
                "priority": "Medium",
            }
        ]
    }

    def handle_provider_request(request):
        assert request.url == "https://llm.example.test/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer test-only-secret"
        assert b"test-only-secret" not in request.content
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": json.dumps(llm_content)}}
                ]
            },
        )

    real_async_client = httpx.AsyncClient

    def mock_async_client(*, timeout):
        return real_async_client(
            transport=httpx.MockTransport(handle_provider_request),
            timeout=timeout,
        )

    monkeypatch.setattr(
        "backend.app.ai_provider.httpx.AsyncClient",
        mock_async_client,
    )
    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    )

    assert response.status_code == 200
    result = response.json()
    assert result["provider"] == "openai-compatible"
    assert result["is_mock"] is False
    assert result["test_cases"][0]["actual_result"] == ""
    assert result["test_cases"][0]["status"] == "Not Executed"
    assert "test-only-secret" not in response.text


def test_configured_provider_rejects_plain_http_remote_urls(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai-compatible")
    monkeypatch.setenv("LLM_API_KEY", "test-only-secret")
    monkeypatch.setenv("LLM_BASE_URL", "http://llm.example.test/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")

    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    )

    assert response.status_code == 503
    assert "HTTPS URL" in response.json()["detail"]


def test_unknown_ai_provider_fails_clearly(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "unknown-provider")

    response = client.post(
        "/api/v1/ai/test-cases/generate",
        json=valid_request(number_of_cases=1),
    )

    assert response.status_code == 503
    assert "AI_PROVIDER" in response.json()["detail"]


def test_local_frontend_can_preflight_generation_post(client):
    response = client.options(
        "/api/v1/ai/test-cases/generate",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
