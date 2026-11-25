import { describe, expect, it } from 'vitest';
import { serializeBugReportCsv } from './csv';
import type { BugReportDraft } from './types';

const report: BugReportDraft = {
  bug_id: 'BUG-ABC12345',
  project_name: 'Checkout',
  bug_title: '=HYPERLINK("https://example.test")',
  module: 'Payments',
  environment: 'QA',
  bug_description: 'Formula safety test.',
  preconditions: '',
  steps_to_reproduce: '1. Submit.',
  expected_result: 'A response is shown.',
  actual_result: 'The screen freezes.',
  severity: 'High',
  priority: 'P1',
  reproducibility: 'Not Verified',
  status: 'Draft',
  evidence: 'TRACE-123',
  business_impact: 'Payment can be delayed.',
  load_id: '',
  campaign_id: '',
};

describe('bug report CSV export', () => {
  it('quotes cells and neutralizes spreadsheet formulas', () => {
    const csv = serializeBugReportCsv(report);

    expect(csv).toContain('"Bug ID"');
    expect(csv).toContain(`"'=HYPERLINK(""https://example.test"")"`);
    expect(csv).toContain('"Not Verified"');
    expect(csv).toContain('"Draft"');
  });
});
