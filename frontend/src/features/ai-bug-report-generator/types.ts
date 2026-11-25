export const BUG_ENVIRONMENTS = [
  'Development',
  'QA',
  'UAT',
  'Production',
] as const;

export const BUG_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const BUG_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export const BUG_REPRODUCIBILITY = [
  'Reproducible',
  'Not Reproducible',
  'Not Verified',
] as const;
export const BUG_STATUSES = [
  'Draft',
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export type BugEnvironment = (typeof BUG_ENVIRONMENTS)[number];
export type BugSeverity = (typeof BUG_SEVERITIES)[number];
export type BugPriority = (typeof BUG_PRIORITIES)[number];
export type BugReproducibility = (typeof BUG_REPRODUCIBILITY)[number];
export type BugStatus = (typeof BUG_STATUSES)[number];

export type BugReportDraft = {
  bug_id: string;
  project_name: string;
  bug_title: string;
  module: string;
  environment: BugEnvironment;
  bug_description: string;
  preconditions: string;
  steps_to_reproduce: string;
  expected_result: string;
  actual_result: string;
  severity: BugSeverity;
  priority: BugPriority;
  reproducibility: BugReproducibility;
  status: BugStatus;
  evidence: string;
  business_impact: string;
  load_id: string | null;
  campaign_id: string | null;
};

export type BugReportGenerationRequest = {
  project_name: string;
  module_name: string;
  environment: BugEnvironment;
  bug_description: string;
  steps_to_reproduce: string;
  expected_result: string;
  actual_result: string;
  evidence: string;
  load_id: string;
  campaign_id: string;
};

export type BugReportGenerationResponse = {
  provider: string;
  is_mock: boolean;
  bug_report: BugReportDraft;
};
