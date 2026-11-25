from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


TestingType = Literal[
    "Functional",
    "Positive",
    "Negative",
    "Boundary",
    "UI",
    "API",
    "Regression",
    "UAT",
]
Priority = Literal["Critical", "High", "Medium", "Low"]
ExecutionStatus = Literal["Not Executed"]


class TestCaseGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    feature_name: str = Field(min_length=1, max_length=120)
    feature_description: str = Field(min_length=1, max_length=6000)
    acceptance_criteria: str = Field(min_length=1, max_length=6000)
    testing_type: TestingType
    number_of_cases: int = Field(ge=1, le=20)


class TestCaseFields(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    module_name: str = Field(min_length=1, max_length=120)
    test_scenario: str = Field(min_length=1, max_length=500)
    test_case_title: str = Field(min_length=1, max_length=300)
    preconditions: str = Field(max_length=4000)
    test_steps: str = Field(min_length=1, max_length=6000)
    test_data: str = Field(max_length=4000)
    expected_result: str = Field(min_length=1, max_length=6000)
    priority: Priority


class GeneratedTestCase(TestCaseFields):
    test_case_id: str = Field(min_length=1, max_length=64)
    actual_result: str = Field(default="", max_length=4000)
    status: ExecutionStatus = "Not Executed"

    @field_validator("actual_result")
    @classmethod
    def actual_result_stays_empty_until_execution(cls, value: str) -> str:
        if value:
            raise ValueError("Actual result must remain empty until testing is performed.")
        return value


class TestCaseGenerationResponse(BaseModel):
    provider: Literal["mock", "openai-compatible"]
    is_mock: bool
    test_cases: list[GeneratedTestCase]


class SaveTestCasesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_cases: list[GeneratedTestCase] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def test_case_ids_are_unique(self):
        ids = [test_case.test_case_id for test_case in self.test_cases]
        if len(ids) != len(set(ids)):
            raise ValueError("Test case IDs must be unique within a save request.")
        return self


class SaveTestCasesResponse(BaseModel):
    saved_count: int


class LLMTestCaseContent(TestCaseFields):
    pass


class LLMGenerationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_cases: list[LLMTestCaseContent]
