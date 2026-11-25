from fastapi import APIRouter

from backend.app.test_case_schemas import (
    GeneratedTestCase,
    SaveTestCasesRequest,
    SaveTestCasesResponse,
    TestCaseGenerationRequest,
    TestCaseGenerationResponse,
)
from backend.app.test_case_service import generate_test_cases
from backend.app.test_case_store import list_test_cases, save_test_cases


router = APIRouter()


@router.post(
    "/api/v1/ai/test-cases/generate",
    response_model=TestCaseGenerationResponse,
    tags=["test cases"],
)
async def generate_test_cases_endpoint(
    request: TestCaseGenerationRequest,
) -> TestCaseGenerationResponse:
    provider, test_cases = await generate_test_cases(request)
    return TestCaseGenerationResponse(
        provider=provider,
        is_mock=provider == "mock",
        test_cases=test_cases,
    )


@router.post(
    "/api/v1/test-cases/bulk",
    response_model=SaveTestCasesResponse,
    tags=["test cases"],
)
def save_test_cases_endpoint(
    request: SaveTestCasesRequest,
) -> SaveTestCasesResponse:
    saved_test_cases = save_test_cases(request.test_cases)
    return SaveTestCasesResponse(saved_count=len(saved_test_cases))


@router.get(
    "/api/v1/test-cases",
    response_model=list[GeneratedTestCase],
    tags=["test cases"],
)
def list_test_cases_endpoint() -> list[GeneratedTestCase]:
    return [GeneratedTestCase.model_validate(case) for case in list_test_cases()]
