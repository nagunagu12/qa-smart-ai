import { describe, expect, it } from 'vitest';
import { serializeTestCasesCsv } from './csv';
import type { GeneratedTestCase } from './types';

const testCase: GeneratedTestCase = {
  test_case_id: 'TC-ABC12345',
  module_name: 'Billing',
  test_scenario: 'Formula safety',
  test_case_title: '=HYPERLINK("https://example.test")',
  preconditions: '',
  test_steps: '',
  test_data: '',
  expected_result: 'No formula should run.',
  actual_result: '',
  priority: 'Low',
  status: 'Not Executed',
};

describe('test case CSV export', () => {
  it('quotes cells and neutralizes spreadsheet formulas', () => {
    const csv = serializeTestCasesCsv([testCase]);

    expect(csv).toContain('"Test Case ID"');
    expect(csv).toContain(`"'=HYPERLINK(""https://example.test"")"`);
    expect(csv).toContain('"Not Executed"');
  });
});
