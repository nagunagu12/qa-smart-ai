import { serializeCsv } from '../../lib/csv';
import type { BugReportDraft } from './types';

const columns: Array<{ key: keyof BugReportDraft; label: string }> = [
  { key: 'bug_id', label: 'Bug ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'bug_title', label: 'Bug Title' },
  { key: 'module', label: 'Module' },
  { key: 'environment', label: 'Environment' },
  { key: 'bug_description', label: 'Bug Description' },
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'steps_to_reproduce', label: 'Steps to Reproduce' },
  { key: 'expected_result', label: 'Expected Result' },
  { key: 'actual_result', label: 'Actual Result' },
  { key: 'severity', label: 'Severity' },
  { key: 'priority', label: 'Priority' },
  { key: 'reproducibility', label: 'Reproducibility' },
  { key: 'status', label: 'Status' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'business_impact', label: 'Business Impact' },
  { key: 'load_id', label: 'Load ID' },
  { key: 'campaign_id', label: 'Campaign ID' },
];

export function serializeBugReportCsv(report: BugReportDraft): string {
  return serializeCsv(
    columns.map(({ label }) => label),
    [columns.map(({ key }) => report[key] ?? '')],
  );
}
