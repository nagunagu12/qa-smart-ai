import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BugReportPage from './BugReportPage';
import type { BugReportDraft } from './types';

const sampleReport: BugReportDraft = {
  bug_id: 'BUG-ABC12345',
  project_name: 'Checkout Portal',
  bug_title: 'Payment confirmation is missing',
  module: 'Payments',
  environment: 'QA',
  bug_description: 'Submitting a valid card leaves the spinner running.',
  preconditions: 'A valid payment account is available.',
  steps_to_reproduce: '1. Add a valid card.\n2. Submit the payment.',
  expected_result: 'The payment completes and a confirmation appears.',
  actual_result: 'The spinner never stops and no confirmation appears.',
  severity: 'Medium',
  priority: 'P2',
  reproducibility: 'Not Verified',
  status: 'Draft',
  evidence: 'Payment trace ID: TRACE-123',
  business_impact: 'A QA review is needed to confirm the customer impact.',
  load_id: 'LOAD-21',
  campaign_id: 'CAMPAIGN-7',
};

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  };
}

async function fillRequiredForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Project name'), 'Checkout Portal');
  await user.type(screen.getByLabelText('Module name'), 'Payments');
  await user.selectOptions(screen.getByLabelText('Environment'), 'QA');
  await user.type(
    screen.getByLabelText('Bug description'),
    'Submitting a valid card leaves the spinner running.',
  );
  await user.type(
    screen.getByLabelText('Steps to reproduce'),
    '1. Add a valid card.\n2. Submit the payment.',
  );
  await user.type(
    screen.getByLabelText('Expected result'),
    'The payment completes and a confirmation appears.',
  );
  await user.type(
    screen.getByLabelText('Actual result'),
    'The spinner never stops and no confirmation appears.',
  );
}

describe('AI Bug Report Generator', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const clipboardWrite = vi.fn();

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    clipboardWrite.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('generates a labeled mock draft with safe review defaults', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        provider: 'mock',
        is_mock: true,
        bug_report: sampleReport,
      }),
    );
    render(<BugReportPage />);

    await fillRequiredForm(user);
    await user.type(screen.getByLabelText('Transcript or evidence'), 'TRACE-123');
    await user.click(screen.getByRole('button', { name: 'Generate Bug Report' }));

    expect(await screen.findByText('Mock-generated report')).toBeInTheDocument();
    expect(screen.getByLabelText('Bug title BUG-ABC12345')).toHaveValue(
      'Payment confirmation is missing',
    );
    expect(screen.getByLabelText('Reproducibility BUG-ABC12345')).toHaveValue(
      'Not Verified',
    );
    expect(screen.getByLabelText('Status BUG-ABC12345')).toHaveValue('Draft');
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('allows editing, saving, copying, regenerating, and exporting reports', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ provider: 'mock', is_mock: true, bug_report: sampleReport }),
      )
      .mockResolvedValueOnce(jsonResponse({ bug_id: sampleReport.bug_id, status: 'Open' }))
      .mockResolvedValueOnce(
        jsonResponse({
          provider: 'mock',
          is_mock: true,
          bug_report: { ...sampleReport, bug_title: 'Regenerated payment draft' },
        }),
      );
    const createObjectUrl = vi.fn(() => 'blob:bug-report');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<BugReportPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate Bug Report' }));
    const titleInput = await screen.findByLabelText('Bug title BUG-ABC12345');
    await user.clear(titleInput);
    await user.type(titleInput, 'Reviewed payment issue');
    await user.selectOptions(
      screen.getByLabelText('Severity BUG-ABC12345'),
      'High',
    );
    await user.selectOptions(
      screen.getByLabelText('Priority BUG-ABC12345'),
      'P1',
    );
    await user.selectOptions(screen.getByLabelText('Status BUG-ABC12345'), 'Open');
    await user.click(screen.getByRole('button', { name: 'Save Bug Report' }));

    expect(await screen.findByText('Bug report saved as Open.')).toBeInTheDocument();
    const saveRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
      bug_report: BugReportDraft;
    };
    expect(saveRequest.bug_report.bug_title).toBe('Reviewed payment issue');
    expect(saveRequest.bug_report.severity).toBe('High');
    expect(saveRequest.bug_report.priority).toBe('P1');
    expect(saveRequest.bug_report.status).toBe('Open');
    expect(saveRequest.bug_report.reproducibility).toBe('Not Verified');

    await user.click(screen.getByRole('button', { name: 'Copy Bug Report' }));
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(
        expect.stringContaining('Reviewed payment issue'),
      );
    });
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(await screen.findByDisplayValue('Regenerated payment draft')).toBeInTheDocument();
  }, 15000);

  it('requires evidence before a user can mark a report reproducible', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          provider: 'mock',
          is_mock: true,
          bug_report: { ...sampleReport, evidence: '' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ bug_id: sampleReport.bug_id, status: 'Draft' }),
      );
    render(<BugReportPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate Bug Report' }));
    await screen.findByLabelText('Reproducibility BUG-ABC12345');
    await user.selectOptions(
      screen.getByLabelText('Reproducibility BUG-ABC12345'),
      'Reproducible',
    );
    await user.click(screen.getByRole('button', { name: 'Save Bug Report' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Add supporting evidence before marking this report reproducible.',
    );
    expect(fetchMock).toHaveBeenCalledOnce();

    await user.type(
      screen.getByLabelText('Evidence BUG-ABC12345'),
      'Reproduction recording',
    );
    await user.click(screen.getByRole('button', { name: 'Save Bug Report' }));
    expect(await screen.findByText('Bug report saved as Draft.')).toBeInTheDocument();
    const saveRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
      bug_report: BugReportDraft;
    };
    expect(saveRequest.bug_report.reproducibility).toBe('Reproducible');
    expect(saveRequest.bug_report.evidence).toContain('Reproduction recording');
  }, 15000);

  it('shows API validation errors clearly', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { detail: [{ msg: 'Input should be at least 1 character' }] },
        false,
        422,
      ),
    );
    render(<BugReportPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate Bug Report' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Input should be at least 1 character',
    );
  });
});
