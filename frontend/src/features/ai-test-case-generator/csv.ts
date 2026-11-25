import type { GeneratedTestCase } from './types';
import { serializeCsv } from '../../lib/csv';

const columns: Array<{ key: keyof GeneratedTestCase; label: string }> = [
  { key: 'test_case_id', label: 'Test Case ID' },
  { key: 'module_name', label: 'Module Name' },
  { key: 'test_scenario', label: 'Test Scenario' },
  { key: 'test_case_title', label: 'Test Case Title' },
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'test_steps', label: 'Test Steps' },
  { key: 'test_data', label: 'Test Data' },
  { key: 'expected_result', label: 'Expected Result' },
  { key: 'actual_result', label: 'Actual Result' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
];

export function serializeTestCasesCsv(testCases: GeneratedTestCase[]): string {
  return serializeCsv(
    columns.map(({ label }) => label),
    testCases.map((testCase) =>
      columns.map(({ key }) => testCase[key]),
    ),
  );
}
