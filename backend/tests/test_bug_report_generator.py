import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    monkeypatch.setenv(
        "QA_SMART_AI_DATABASE_PATH",
        str(tmp_path / "bug-reports.sqlite3"),
    )
    with TestClient(app) as test_client:
        yield test_client


def valid_request(**overrides):
    payload = {
        "project_name": "Checkout Portal",
        "module_name": "Payments",
        "environment": "QA",
        "bug_description": "Submitting a valid card leaves the spinner running.",
        "steps_to_reproduce": "1. Add a valid card.\n2. Submit the payment.",
        "expected_result": "The payment completes and a confirmation appears.",
        "actual_result": "The spinner never stops and no confirmation appears.",
        "evidence": "Payment trace ID: TRACE-123",
        "load_id": "LOAD-21",
        "campaign_id": "CAMPAIGN-7",
    }
    return {**payload, **overrides}


def test_generation_returns_labeled_mock_draft_and_never_assumes_reproducible(client):
    response = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(),
    )

    assert response.status_code == 200
    result = response.json()
    report = result["bug_report"]
    assert result["provider"] == "mock"
    assert result["is_mock"] is True
    assert report["bug_id"].startswith("BUG-")
    assert report["project_name"] == "Checkout Portal"
    assert report["module"] == "Payments"
    assert report["environment"] == "QA"
    assert report["bug_description"] == valid_request()["bug_description"]
    assert report["steps_to_reproduce"] == valid_request()["steps_to_reproduce"]
    assert report["expected_result"] == valid_request()["expected_result"]
    assert report["actual_result"] == valid_request()["actual_result"]
    assert report["evidence"] == "Payment trace ID: TRACE-123"
    assert report["load_id"] == "LOAD-21"
    assert report["campaign_id"] == "CAMPAIGN-7"
    assert report["severity"] in {"Critical", "High", "Medium", "Low"}
    assert report["priority"] in {"P1", "P2", "P3", "P4"}
    assert report["reproducibility"] == "Not Verified"
    assert report["status"] == "Draft"
    assert client.get("/api/v1/bugs").json() == []


@pytest.mark.parametrize(
    "overrides",
    [
        {"project_name": " "},
        {"module_name": ""},
        {"environment": "Staging"},
        {"bug_description": ""},
        {"steps_to_reproduce": " "},
        {"expected_result": ""},
        {"actual_result": ""},
        {"bug_description": "x" * 6001},
        {"load_id": "x" * 121},
        {"extra_field": "not allowed"},
    ],
)
def test_generation_rejects_invalid_input(client, overrides):
    response = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(**overrides),
    )

    assert response.status_code == 422


def test_edited_bug_report_is_saved_and_listed_from_sqlite(client):
    report = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(),
    ).json()["bug_report"]
    report["bug_title"] = "Payment confirmation is missing"
    report["severity"] = "High"
    report["priority"] = "P1"
    report["status"] = "Open"

    saved_response = client.post(
        "/api/v1/bugs",
        json={"bug_report": report},
    )
    listed_response = client.get("/api/v1/bugs")

    assert saved_response.status_code == 200
    assert saved_response.json()["bug_id"] == report["bug_id"]
    assert saved_response.json()["status"] == "Open"
    assert listed_response.status_code == 200
    saved_report = listed_response.json()[0]
    assert saved_report["bug_title"] == "Payment confirmation is missing"
    assert saved_report["severity"] == "High"
    assert saved_report["priority"] == "P1"
    assert saved_report["reproducibility"] == "Not Verified"
    assert saved_report["evidence"] == "Payment trace ID: TRACE-123"


@pytest.mark.parametrize(
    "field,value",
    [
        ("severity", "Urgent"),
        ("priority", "P0"),
        ("reproducibility", "Always"),
        ("status", "Passed"),
        ("environment", "Staging"),
    ],
)
def test_save_rejects_unsupported_bug_report_values(client, field, value):
    report = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(),
    ).json()["bug_report"]
    report[field] = value

    response = client.post("/api/v1/bugs", json={"bug_report": report})

    assert response.status_code == 422


def test_reproducible_status_requires_evidence_and_explicit_review(client):
    report = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(evidence=""),
    ).json()["bug_report"]
    report["reproducibility"] = "Reproducible"
    report["status"] = "Open"

    response = client.post("/api/v1/bugs", json={"bug_report": report})

    assert response.status_code == 422
    assert "evidence" in response.json()["detail"][0]["msg"].lower()


def test_unknown_ai_provider_fails_clearly(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "unknown-provider")

    response = client.post(
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(),
    )

    assert response.status_code == 503
    assert "AI_PROVIDER" in response.json()["detail"]


def test_bug_report_uses_configured_provider_without_exposing_key(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai-compatible")
    monkeypatch.setenv("LLM_API_KEY", "test-only-secret")
    monkeypatch.setenv("LLM_BASE_URL", "https://llm.example.test/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")
    provider_payload = {
        "bug_report": {
            "bug_title": "Payment request remains pending",
            "preconditions": "A valid payment account is available.",
            "severity": "High",
            "priority": "P1",
            "business_impact": "Customers may be unable to complete purchases.",
        }
    }

    def handle_provider_request(request):
        assert request.url == "https://llm.example.test/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer test-only-secret"
        assert b"test-only-secret" not in request.content
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": json.dumps(provider_payload)}}
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
        "/api/v1/ai/bug-reports/generate",
        json=valid_request(evidence=""),
    )

    assert response.status_code == 200
    result = response.json()
    assert result["provider"] == "openai-compatible"
    assert result["is_mock"] is False
    assert result["bug_report"]["bug_title"] == "Payment request remains pending"
    assert result["bug_report"]["reproducibility"] == "Not Verified"
    assert result["bug_report"]["status"] == "Draft"
    assert "test-only-secret" not in response.text
