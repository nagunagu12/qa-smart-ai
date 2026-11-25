from dataclasses import dataclass
import os
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException


@dataclass(frozen=True)
class AIProviderConfig:
    provider: str
    api_key: str = ""
    base_url: str = ""
    model: str = ""


def get_ai_provider_config() -> AIProviderConfig:
    provider = os.environ.get("AI_PROVIDER", "mock").strip().lower()
    if provider == "mock":
        return AIProviderConfig(provider=provider)
    if provider != "openai-compatible":
        raise HTTPException(
            status_code=503,
            detail="Unsupported AI_PROVIDER. Choose 'mock' or 'openai-compatible'.",
        )

    api_key = os.environ.get("LLM_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="LLM_API_KEY must be configured for the openai-compatible provider.",
        )

    base_url = os.environ.get(
        "LLM_BASE_URL", "https://api.openai.com/v1"
    ).strip().rstrip("/")
    model = os.environ.get("LLM_MODEL", "").strip()
    if not model:
        raise HTTPException(
            status_code=503,
            detail="LLM_MODEL must be configured for the openai-compatible provider.",
        )

    try:
        parsed = urlsplit(base_url)
        hostname = (parsed.hostname or "").lower()
        valid_base_url = (
            parsed.scheme in {"http", "https"}
            and bool(parsed.netloc)
            and not parsed.query
            and not parsed.fragment
            and not parsed.username
            and not parsed.password
            and not (
                parsed.scheme == "http"
                and hostname not in {"localhost", "127.0.0.1", "::1"}
            )
        )
    except ValueError:
        valid_base_url = False
    if not valid_base_url:
        raise HTTPException(
            status_code=503,
            detail=(
                "LLM_BASE_URL must be an HTTPS URL, or an HTTP URL on localhost."
            ),
        )
    return AIProviderConfig(
        provider=provider,
        api_key=api_key,
        base_url=base_url,
        model=model,
    )


async def request_openai_compatible_completion(
    config: AIProviderConfig,
    system_message: str,
    user_message: str,
) -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{config.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {config.api_key}"},
                json={
                    "model": config.model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message},
                    ],
                },
            )
            response.raise_for_status()
            envelope = response.json()
            content = envelope["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise ValueError("The provider returned an unsupported response.")
            return content
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="The configured AI provider timed out. Try again later.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The configured AI provider returned an error "
                f"(HTTP {exc.response.status_code})."
            ),
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the configured AI provider.",
        ) from exc
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="The configured AI provider returned an invalid response.",
        ) from exc
