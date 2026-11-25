import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Clipboard, Download, RefreshCw, Save, WandSparkles } from 'lucide-react';
import { apiBaseUrl, responseError } from '../../lib/api';
import { serializeTestCasesCsv } from './csv';
import {
  TESTING_TYPES,
  type GeneratedTestCase,
  type GenerationRequest,
  type GenerationResponse,
  type TestPriority,
} from './types';

const priorities: TestPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const caseFields: Array<{
  key: 'module_name' | 'test_scenario' | 'test_case_title' | 'preconditions' | 'test_steps' | 'test_data' | 'expected_result';
  label: string;
  multiline?: boolean;
}> = [
  { key: 'module_name', label: 'Module Name' },
  { key: 'test_scenario', label: 'Test Scenario', multiline: true },
  { key: 'test_case_title', label: 'Test Case Title', multiline: true },
  { key: 'preconditions', label: 'Preconditions', multiline: true },
  { key: 'test_steps', label: 'Test Steps', multiline: true },
  { key: 'test_data', label: 'Test Data', multiline: true },
  { key: 'expected_result', label: 'Expected Result', multiline: true },
];

function copyText(testCases: GeneratedTestCase[]): string {
  return testCases
    .map((testCase) =>
      [
        `${testCase.test_case_id} — ${testCase.test_case_title}`,
        `Module: ${testCase.module_name}`,
        `Scenario: ${testCase.test_scenario}`,
        `Preconditions: ${testCase.preconditions}`,
        `Steps: ${testCase.test_steps}`,
        `Test data: ${testCase.test_data}`,
        `Expected: ${testCase.expected_result}`,
        `Actual: ${testCase.actual_result}`,
        `Priority: ${testCase.priority}`,
        `Status: ${testCase.status}`,
      ].join('\n'),
    )
    .join('\n\n');
}

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

export default function GeneratorPage() {
  const [form, setForm] = useState<GenerationRequest>({
    feature_name: '',
    feature_description: '',
    acceptance_criteria: '',
    testing_type: 'Functional',
    number_of_cases: 4,
  });
  const [testCases, setTestCases] = useState<GeneratedTestCase[]>([]);
  const [isMock, setIsMock] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm<K extends keyof GenerationRequest>(
    key: K,
    value: GenerationRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    setError('');
    setNotice('');
    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/ai/test-cases/generate`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const result = await response.json() as GenerationResponse;
      if (!Array.isArray(result.test_cases)) {
        throw new Error('The API returned an unexpected test-case response.');
      }
      setTestCases(result.test_cases);
      setIsMock(result.is_mock);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate test cases. Check the API connection and try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function updateTestCase<K extends keyof GeneratedTestCase>(
    id: string,
    key: K,
    value: GeneratedTestCase[K],
  ) {
    setTestCases((current) =>
      current.map((testCase) =>
        testCase.test_case_id === id
          ? { ...testCase, [key]: value }
          : testCase,
      ),
    );
    setNotice('');
  }

  async function saveTestCases() {
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/test-cases/bulk`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_cases: testCases }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as { saved_count: number };
      setNotice(`Saved ${result.saved_count} test case${result.saved_count === 1 ? '' : 's'}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save test cases. Check the API connection and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copyTestCases() {
    setError('');
    setNotice('');
    try {
      await navigator.clipboard.writeText(copyText(testCases));
      setNotice('Test cases copied to the clipboard.');
    } catch {
      setError('Could not access the clipboard. Check your browser permissions and try again.');
    }
  }

  function exportCsv() {
    const csv = serializeTestCasesCsv(testCases);
    const objectUrl = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'qa-smart-ai-test-cases.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10';
  const tableInputClass = 'min-h-10 w-full min-w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-indigo-400/10';

  return (
    <section className="px-4 py-6 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
              AI-assisted QA
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Generate AI test cases
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Describe a feature and its acceptance criteria. Review and edit every draft before saving or exporting.
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Feature details</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              The more detail you provide, the more useful the test drafts will be.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <FormLabel htmlFor="feature-name">Feature name</FormLabel>
                <input
                  autoComplete="off"
                  className={inputClass}
                  id="feature-name"
                  maxLength={120}
                  onChange={(event) => updateForm('feature_name', event.target.value)}
                  placeholder="For example, Password reset"
                  required
                  value={form.feature_name}
                />
              </div>
              <div>
                <FormLabel htmlFor="feature-description">Feature description or user story</FormLabel>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  id="feature-description"
                  maxLength={6000}
                  onChange={(event) => updateForm('feature_description', event.target.value)}
                  placeholder="Describe what a user can do..."
                  required
                  value={form.feature_description}
                />
              </div>
              <div>
                <FormLabel htmlFor="acceptance-criteria">Acceptance criteria</FormLabel>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  id="acceptance-criteria"
                  maxLength={6000}
                  onChange={(event) => updateForm('acceptance_criteria', event.target.value)}
                  placeholder="List the expected behavior..."
                  required
                  value={form.acceptance_criteria}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel htmlFor="testing-type">Testing type</FormLabel>
                  <select
                    className={inputClass}
                    id="testing-type"
                    onChange={(event) => updateForm('testing_type', event.target.value as GenerationRequest['testing_type'])}
                    value={form.testing_type}
                  >
                    {TESTING_TYPES.map((testingType) => (
                      <option key={testingType} value={testingType}>{testingType}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FormLabel htmlFor="number-of-cases">Number of test cases</FormLabel>
                  <select
                    className={inputClass}
                    id="number-of-cases"
                    onChange={(event) => updateForm('number_of_cases', Number(event.target.value))}
                    value={form.number_of_cases}
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
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
                    Generate test cases
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
              Generated cases are drafts. Verify them before using them in a test run.
            </p>
          </form>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generated test cases</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {testCases.length
                    ? `${testCases.length} draft${testCases.length === 1 ? '' : 's'} — editable below`
                    : 'Your generated drafts will appear here.'}
                </p>
              </div>
              {testCases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    onClick={() => void generate()}
                    disabled={isGenerating || isSaving}
                    type="button"
                  >
                    <RefreshCw size={14} /> Regenerate
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    onClick={() => void copyTestCases()}
                    type="button"
                  >
                    <Clipboard size={14} /> Copy test cases
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
                    onClick={() => void saveTestCases()}
                    disabled={isSaving || isGenerating}
                    type="button"
                  >
                    <Save size={14} /> {isSaving ? 'Saving...' : 'Save test cases'}
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

            {testCases.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                  <WandSparkles size={22} />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Ready when you are</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Add feature details and choose Generate test cases to create editable drafts.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {isMock ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                      Mock-generated examples
                    </span>
                  ) : (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 dark:bg-indigo-400/10">
                      Generated by configured AI provider
                    </span>
                  )}
                  <span className="text-[11px] font-normal text-slate-400">Actual Result is blank until testing is performed.</span>
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-[1550px] border-collapse text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/70">
                      <tr>
                        <th className="sticky left-0 z-10 min-w-32 bg-slate-50 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800">Test Case ID</th>
                        {caseFields.map(({ key, label }) => (
                          <th key={key} className="min-w-48 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</th>
                        ))}
                        <th className="min-w-36 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actual Result</th>
                        <th className="min-w-32 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Priority</th>
                        <th className="min-w-32 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {testCases.map((testCase) => (
                        <tr key={testCase.test_case_id} className="align-top">
                          <td className="sticky left-0 z-10 bg-white px-3 py-3 text-xs font-bold text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">
                            {testCase.test_case_id}
                          </td>
                          {caseFields.map(({ key, label, multiline }) => {
                            const value = testCase[key];
                            const ariaLabel = `${label} ${testCase.test_case_id}`;
                            return (
                              <td key={key} className="px-2 py-2">
                                {multiline ? (
                                  <textarea
                                    aria-label={ariaLabel}
                                    className={`${tableInputClass} min-h-20 resize-y`}
                                    onChange={(event) => updateTestCase(testCase.test_case_id, key, event.target.value)}
                                    value={value}
                                  />
                                ) : (
                                  <input
                                    aria-label={ariaLabel}
                                    className={tableInputClass}
                                    onChange={(event) => updateTestCase(testCase.test_case_id, key, event.target.value)}
                                    value={value}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2">
                            <textarea
                              aria-label={`Actual Result ${testCase.test_case_id}`}
                              className={`${tableInputClass} min-h-20 resize-none bg-slate-50 text-slate-400 dark:bg-slate-800/50`}
                              disabled
                              value={testCase.actual_result}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              aria-label={`Priority ${testCase.test_case_id}`}
                              className={tableInputClass}
                              onChange={(event) => updateTestCase(testCase.test_case_id, 'priority', event.target.value as TestPriority)}
                              value={testCase.priority}
                            >
                              {priorities.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {testCase.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                  Scroll horizontally to review all columns. Test Case ID, Actual Result, and execution status are protected.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
