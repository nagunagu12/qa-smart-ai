import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Clipboard, Download, RefreshCw, Save, WandSparkles } from 'lucide-react';
import { apiBaseUrl, responseError } from '../../lib/api';
import { serializeBugReportCsv } from './csv';
import {
  BUG_ENVIRONMENTS,
  BUG_PRIORITIES,
  BUG_REPRODUCIBILITY,
  BUG_SEVERITIES,
  BUG_STATUSES,
  type BugReportDraft,
  type BugReportGenerationRequest,
  type BugReportGenerationResponse,
} from './types';

const reportTextFields: Array<{
  key: 'project_name' | 'bug_title' | 'module' | 'bug_description' | 'preconditions' | 'steps_to_reproduce' | 'expected_result' | 'actual_result' | 'evidence' | 'business_impact' | 'load_id' | 'campaign_id';
  label: string;
  multiline?: boolean;
}> = [
  { key: 'project_name', label: 'Project name' },
  { key: 'bug_title', label: 'Bug title' },
  { key: 'module', label: 'Module' },
  { key: 'bug_description', label: 'Bug description', multiline: true },
  { key: 'preconditions', label: 'Preconditions', multiline: true },
  { key: 'steps_to_reproduce', label: 'Steps to reproduce', multiline: true },
  { key: 'expected_result', label: 'Expected result', multiline: true },
  { key: 'actual_result', label: 'Actual result', multiline: true },
  { key: 'evidence', label: 'Evidence', multiline: true },
  { key: 'business_impact', label: 'Business impact', multiline: true },
  { key: 'load_id', label: 'Load ID' },
  { key: 'campaign_id', label: 'Campaign ID' },
];

function FormLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {children}
    </label>
  );
}

function copyText(report: BugReportDraft): string {
  return [
    `Bug ID: ${report.bug_id}`,
    `Project: ${report.project_name}`,
    `Title: ${report.bug_title}`,
    `Module: ${report.module}`,
    `Environment: ${report.environment}`,
    `Description: ${report.bug_description}`,
    `Preconditions: ${report.preconditions}`,
    `Steps to reproduce: ${report.steps_to_reproduce}`,
    `Expected result: ${report.expected_result}`,
    `Actual result: ${report.actual_result}`,
    `Severity: ${report.severity}`,
    `Priority: ${report.priority}`,
    `Reproducibility: ${report.reproducibility}`,
    `Status: ${report.status}`,
    `Evidence: ${report.evidence}`,
    `Business impact: ${report.business_impact}`,
    `Load ID: ${report.load_id ?? ''}`,
    `Campaign ID: ${report.campaign_id ?? ''}`,
  ].join('\n');
}

export default function BugReportPage() {
  const [form, setForm] = useState<BugReportGenerationRequest>({
    project_name: '',
    module_name: '',
    environment: 'QA',
    bug_description: '',
    steps_to_reproduce: '',
    expected_result: '',
    actual_result: '',
    evidence: '',
    load_id: '',
    campaign_id: '',
  });
  const [report, setReport] = useState<BugReportDraft | null>(null);
  const [isMock, setIsMock] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm<K extends keyof BugReportGenerationRequest>(
    key: K,
    value: BugReportGenerationRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    setError('');
    setNotice('');
    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/ai/bug-reports/generate`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const result = await response.json() as BugReportGenerationResponse;
      if (!result.bug_report || result.bug_report.status !== 'Draft') {
        throw new Error('The API returned an unexpected bug-report draft.');
      }
      setReport(result.bug_report);
      setIsMock(result.is_mock);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate a bug report. Check the API connection and try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function updateReport<K extends keyof BugReportDraft>(
    key: K,
    value: BugReportDraft[K],
  ) {
    setReport((current) => current ? { ...current, [key]: value } : current);
    setNotice('');
  }

  async function saveBugReport() {
    if (!report) return;
    setError('');
    setNotice('');
    if (report.reproducibility === 'Reproducible' && !report.evidence?.trim()) {
      setError('Add supporting evidence before marking this report reproducible.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/bugs`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ bug_report: report }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const saved = await response.json() as { bug_id: string; status: string };
      setNotice(`Bug report saved as ${saved.status}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this bug report. Check the API connection and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copyBugReport() {
    if (!report) return;
    setError('');
    setNotice('');
    try {
      await navigator.clipboard.writeText(copyText(report));
      setNotice('Bug report copied to the clipboard.');
    } catch {
      setError('Could not access the clipboard. Check your browser permissions and try again.');
    }
  }

  function exportCsv() {
    if (!report) return;
    const objectUrl = URL.createObjectURL(
      new Blob([serializeBugReportCsv(report)], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${report.bug_id.toLowerCase()}-bug-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10';
  const reportFieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-indigo-400/10';

  return (
    <section className="px-4 py-6 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
              AI-assisted QA
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Generate AI bug reports
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Describe the issue and review the editable report before saving it to your local bug list.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Mock AI by default
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <form
            className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            onSubmit={(event) => {
              event.preventDefault();
              void generate();
            }}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Issue details</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Include what happened and how another tester can check it.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <FormLabel htmlFor="bug-project">Project name</FormLabel>
                <input
                  autoComplete="off"
                  className={inputClass}
                  id="bug-project"
                  maxLength={120}
                  onChange={(event) => updateForm('project_name', event.target.value)}
                  placeholder="For example, Checkout Portal"
                  required
                  value={form.project_name}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel htmlFor="bug-module">Module name</FormLabel>
                  <input
                    className={inputClass}
                    id="bug-module"
                    maxLength={120}
                    onChange={(event) => updateForm('module_name', event.target.value)}
                    placeholder="Payments"
                    required
                    value={form.module_name}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="bug-environment">Environment</FormLabel>
                  <select
                    className={inputClass}
                    id="bug-environment"
                    onChange={(event) => updateForm('environment', event.target.value as BugReportGenerationRequest['environment'])}
                    value={form.environment}
                  >
                    {BUG_ENVIRONMENTS.map((environment) => (
                      <option key={environment} value={environment}>{environment}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <FormLabel htmlFor="bug-description">Bug description</FormLabel>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  id="bug-description"
                  maxLength={6000}
                  onChange={(event) => updateForm('bug_description', event.target.value)}
                  placeholder="What went wrong?"
                  required
                  value={form.bug_description}
                />
              </div>
              <div>
                <FormLabel htmlFor="bug-steps">Steps to reproduce</FormLabel>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  id="bug-steps"
                  maxLength={6000}
                  onChange={(event) => updateForm('steps_to_reproduce', event.target.value)}
                  placeholder="1. Open the page&#10;2. Select Submit"
                  required
                  value={form.steps_to_reproduce}
                />
              </div>
              <div>
                <FormLabel htmlFor="bug-expected">Expected result</FormLabel>
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  id="bug-expected"
                  maxLength={4000}
                  onChange={(event) => updateForm('expected_result', event.target.value)}
                  placeholder="What should happen?"
                  required
                  value={form.expected_result}
                />
              </div>
              <div>
                <FormLabel htmlFor="bug-actual">Actual result</FormLabel>
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  id="bug-actual"
                  maxLength={4000}
                  onChange={(event) => updateForm('actual_result', event.target.value)}
                  placeholder="What happened instead?"
                  required
                  value={form.actual_result}
                />
              </div>
              <div>
                <FormLabel htmlFor="bug-evidence">Transcript or evidence</FormLabel>
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  id="bug-evidence"
                  maxLength={12000}
                  onChange={(event) => updateForm('evidence', event.target.value)}
                  placeholder="Optional logs, transcript excerpt, or evidence notes"
                  value={form.evidence}
                />
                <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                  Evidence is saved only when you choose Save. With a real AI provider, all issue details and evidence are sent to that provider when generating.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel htmlFor="bug-load-id">Load ID (optional)</FormLabel>
                  <input
                    className={inputClass}
                    id="bug-load-id"
                    maxLength={120}
                    onChange={(event) => updateForm('load_id', event.target.value)}
                    value={form.load_id}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="bug-campaign-id">Campaign ID (optional)</FormLabel>
                  <input
                    className={inputClass}
                    id="bug-campaign-id"
                    maxLength={120}
                    onChange={(event) => updateForm('campaign_id', event.target.value)}
                    value={form.campaign_id}
                  />
                </div>
              </div>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isGenerating}
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <WandSparkles size={16} />
                    Generate Bug Report
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bug report draft</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {report ? 'Review and edit each suggested field before saving.' : 'Your generated report will appear here.'}
                </p>
              </div>
              {report && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    disabled={isGenerating || isSaving}
                    onClick={() => void generate()}
                    type="button"
                  >
                    <RefreshCw size={14} /> Regenerate
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    onClick={() => void copyBugReport()}
                    type="button"
                  >
                    <Clipboard size={14} /> Copy Bug Report
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    onClick={exportCsv}
                    type="button"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSaving || isGenerating}
                    onClick={() => void saveBugReport()}
                    type="button"
                  >
                    <Save size={14} /> {isSaving ? 'Saving...' : 'Save Bug Report'}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200" role="alert">
                {error}
              </div>
            )}
            {notice && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" role="status">
                <Check size={16} /> {notice}
              </div>
            )}

            {!report ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                  <WandSparkles size={22} />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Ready when you are</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Add issue details to generate a structured, editable bug report draft.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    {isMock ? 'Mock-generated report' : 'Generated by configured AI provider'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {report.bug_id}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Severity and priority are suggestions. Review before filing.
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reportTextFields.map(({ key, label, multiline }) => {
                    const value = report[key] ?? '';
                    const ariaLabel = `${label} ${report.bug_id}`;
                    return (
                      <div key={key} className={multiline ? 'sm:col-span-2' : ''}>
                        <FormLabel htmlFor={`report-${key}`}>{label}</FormLabel>
                        {multiline ? (
                          <textarea
                            aria-label={ariaLabel}
                            className={`${reportFieldClass} min-h-20 resize-y`}
                            id={`report-${key}`}
                            maxLength={key === 'evidence' ? 12000 : 6000}
                            onChange={(event) => updateReport(key, event.target.value)}
                            value={value}
                          />
                        ) : (
                          <input
                            aria-label={ariaLabel}
                            className={reportFieldClass}
                            id={`report-${key}`}
                            maxLength={key === 'bug_title' ? 240 : 120}
                            onChange={(event) => updateReport(key, event.target.value)}
                            value={value}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div>
                    <FormLabel htmlFor="report-environment">Environment</FormLabel>
                    <select
                      aria-label={`Environment ${report.bug_id}`}
                      className={reportFieldClass}
                      id="report-environment"
                      onChange={(event) => updateReport('environment', event.target.value as BugReportDraft['environment'])}
                      value={report.environment}
                    >
                      {BUG_ENVIRONMENTS.map((environment) => (
                        <option key={environment} value={environment}>{environment}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FormLabel htmlFor="report-severity">Severity</FormLabel>
                    <select
                      aria-label={`Severity ${report.bug_id}`}
                      className={reportFieldClass}
                      id="report-severity"
                      onChange={(event) => updateReport('severity', event.target.value as BugReportDraft['severity'])}
                      value={report.severity}
                    >
                      {BUG_SEVERITIES.map((severity) => (
                        <option key={severity} value={severity}>{severity}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FormLabel htmlFor="report-priority">Priority</FormLabel>
                    <select
                      aria-label={`Priority ${report.bug_id}`}
                      className={reportFieldClass}
                      id="report-priority"
                      onChange={(event) => updateReport('priority', event.target.value as BugReportDraft['priority'])}
                      value={report.priority}
                    >
                      {BUG_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FormLabel htmlFor="report-reproducibility">Reproducibility</FormLabel>
                    <select
                      aria-label={`Reproducibility ${report.bug_id}`}
                      className={reportFieldClass}
                      id="report-reproducibility"
                      onChange={(event) => updateReport('reproducibility', event.target.value as BugReportDraft['reproducibility'])}
                      value={report.reproducibility}
                    >
                      {BUG_REPRODUCIBILITY.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      A report can only be saved as Reproducible when evidence is provided.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <FormLabel htmlFor="report-status">Status</FormLabel>
                    <select
                      aria-label={`Status ${report.bug_id}`}
                      className={reportFieldClass}
                      id="report-status"
                      onChange={(event) => updateReport('status', event.target.value as BugReportDraft['status'])}
                      value={report.status}
                    >
                      {BUG_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      New reports start as Draft. Change the status only after reviewing the report.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
