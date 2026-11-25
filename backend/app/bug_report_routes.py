from fastapi import APIRouter

from backend.app.bug_report_schemas import (
    BugReport,
    BugReportGenerationRequest,
    BugReportGenerationResponse,
    SaveBugReportRequest,
    SaveBugReportResponse,
)
from backend.app.bug_report_service import generate_bug_report
from backend.app.bug_report_store import list_bug_reports, save_bug_report


router = APIRouter()


@router.post(
    "/api/v1/ai/bug-reports/generate",
    response_model=BugReportGenerationResponse,
    tags=["bug reports"],
)
async def generate_bug_report_endpoint(
    request: BugReportGenerationRequest,
) -> BugReportGenerationResponse:
    provider, report = await generate_bug_report(request)
    return BugReportGenerationResponse(
        provider=provider,
        is_mock=provider == "mock",
        bug_report=report,
    )


@router.post(
    "/api/v1/bugs",
    response_model=SaveBugReportResponse,
    tags=["bugs"],
)
def save_bug_report_endpoint(
    request: SaveBugReportRequest,
) -> SaveBugReportResponse:
    report = save_bug_report(request.bug_report)
    return SaveBugReportResponse(
        bug_id=report["bug_id"],
        status=report["status"],
    )


@router.get(
    "/api/v1/bugs",
    response_model=list[BugReport],
    tags=["bugs"],
)
def list_bug_reports_endpoint() -> list[BugReport]:
    return [BugReport.model_validate(report) for report in list_bug_reports()]
