export const TESTING_TYPES = [
  'Functional',
  'Positive',
  'Negative',
  'Boundary',
  'UI',
  'API',
  'Regression',
  'UAT',
] as const;

export type TestingType = (typeof TESTING_TYPES)[number];
export type TestPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type GeneratedTestCase = {
  test_case_id: string;
  module_name: string;
  test_scenario: string;
  test_case_title: string;
  preconditions: string;
  test_steps: string;
  test_data: string;
  expected_result: string;
  actual_result: '';
  priority: TestPriority;
  status: 'Not Executed';
};

export type GenerationRequest = {
  feature_name: string;
  feature_description: string;
  acceptance_criteria: string;
  testing_type: TestingType;
  number_of_cases: number;
};

export type GenerationResponse = {
  provider: string;
  is_mock: boolean;
  test_cases: GeneratedTestCase[];
};
