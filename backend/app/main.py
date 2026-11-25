import os
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.bug_report_routes import router as bug_report_router
from backend.app.test_case_routes import router as test_case_router


DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def parse_allowed_origins(value: str | None = None) -> list[str]:
    """Parse explicit browser origins, permitting plain HTTP only on localhost."""
    if value is None:
        return list(DEFAULT_ALLOWED_ORIGINS)
    if not value.strip():
        return []

    origins: list[str] = []
    for candidate in value.split(","):
        candidate = candidate.strip().rstrip("/")
        if not candidate:
            continue
        if candidate == "*" or "*" in candidate:
            raise ValueError("CORS origins cannot contain a wildcard.")

        parsed = urlsplit(candidate)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.path
            or parsed.query
            or parsed.fragment
            or parsed.username
            or parsed.password
        ):
            raise ValueError(
                "Each CORS origin must be an HTTP(S) origin without a path."
            )

        hostname = (parsed.hostname or "").lower()
        if parsed.scheme == "http" and hostname not in {
            "localhost",
            "127.0.0.1",
            "::1",
        }:
            raise ValueError("Non-local CORS origins must use HTTPS.")

        normalized = f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"
        if normalized not in origins:
            origins.append(normalized)

    return origins


allowed_origins = parse_allowed_origins(
    os.environ.get("QA_SMART_AI_ALLOWED_ORIGINS")
)

app = FastAPI(
    title="QA Smart AI API",
    version="0.1.0",
    description="Local development API for QA Smart AI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)

app.include_router(test_case_router)
app.include_router(bug_report_router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "qa-smart-ai-api",
    }
