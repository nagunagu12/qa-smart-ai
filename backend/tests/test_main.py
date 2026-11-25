import pytest
from fastapi.testclient import TestClient

from backend.app.main import app, parse_allowed_origins


client = TestClient(app)


def test_health_endpoint_returns_service_status():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "qa-smart-ai-api",
    }


def test_health_endpoint_allows_configured_local_frontend_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_health_endpoint_does_not_allow_unconfigured_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_allowed_origins_are_normalized_and_reject_wildcards():
    assert parse_allowed_origins(
        " http://localhost:5173/ , http://127.0.0.1:5173 "
    ) == ["http://localhost:5173", "http://127.0.0.1:5173"]

    with pytest.raises(ValueError, match="wildcard"):
        parse_allowed_origins("*")


def test_plain_http_allowed_origins_must_be_local():
    with pytest.raises(ValueError, match="HTTPS"):
        parse_allowed_origins("http://qa.example.com")
