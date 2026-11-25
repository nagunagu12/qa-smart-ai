from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


BugEnvironment = Literal["Development", "QA", "UAT", "Production"]
BugSeverity = Literal["Critical", "High", "Medium", "Low"]
BugPriority = Literal["P1", "P2", "P3", "P4"]
Reproducibility = Literal["Reproducible", "Not Reproducible", "Not Verified"]
BugStatus = Literal["Draft", "Open", "In Progress", "Resolved", "Closed"]


class BugReportGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    project_name: str = Field(min_length=1, max_length=120)
    module_name: str = Field(min_length=1, max_length=120)
    environment: BugEnvironment
    bug_description: str = Field(min_length=1, max_length=6000)
    steps_to_reproduce: str = Field(min_length=1, max_length=6000)
    expected_result: str = Field(min_length=1, max_length=4000)
    actual_result: str = Field(min_length=1, max_length=4000)
    evidence: str = Field(default="", max_length=12000)
    load_id: str | None = Field(default=None, max_length=120)
    campaign_id: str | None = Field(default=None, max_length=120)


class BugReport(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    bug_id: str = Field(min_length=1, max_length=64)
    project_name: str = Field(min_length=1, max_length=120)
    bug_title: str = Field(min_length=1, max_length=240)
    module: str = Field(min_length=1, max_length=120)
    environment: BugEnvironment
    bug_description: str = Field(min_length=1, max_length=6000)
    preconditions: str = Field(max_length=4000)
    steps_to_reproduce: str = Field(min_length=1, max_length=6000)
    expected_result: str = Field(min_length=1, max_length=4000)
    actual_result: str = Field(min_length=1, max_length=4000)
    severity: BugSeverity
    priority: BugPriority
    reproducibility: Reproducibility = "Not Verified"
    status: BugStatus = "Draft"
    evidence: str = Field(default="", max_length=12000)
    business_impact: str = Field(min_length=1, max_length=4000)
    load_id: str | None = Field(default=None, max_length=120)
    campaign_id: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def reproducible_reports_need_evidence(self):
        if self.reproducibility == "Reproducible" and not (self.evidence or "").strip():
            raise ValueError(
                "Supporting evidence is required to mark a bug as reproducible."
            )
        return self


class LLMBugReportContent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    bug_title: str = Field(min_length=1, max_length=240)
    preconditions: str = Field(max_length=4000)
    severity: BugSeverity
    priority: BugPriority
    business_impact: str = Field(min_length=1, max_length=4000)


class LLMBugReportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bug_report: LLMBugReportContent


class BugReportGenerationResponse(BaseModel):
    provider: Literal["mock", "openai-compatible"]
    is_mock: bool
    bug_report: BugReport


class SaveBugReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bug_report: BugReport


class SaveBugReportResponse(BaseModel):
    bug_id: str
    status: BugStatus
