import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneratorPage from './GeneratorPage';
import type { GeneratedTestCase } from './types';

const sampleCase: GeneratedTestCase = {
  test_case_id: 'TC-ABC12345',
  module_name: 'Password reset',
  test_scenario: 'Positive flow for password reset',
  test_case_title: 'Reset email reaches a registered user',
  preconditions: 'A registered account exists.',
  test_steps: '1. Enter a registered email.\n2. Submit the request.',
  test_data: 'qa@example.test',
  expected_result: 'A reset email is sent.',
  actual_result: '',
  priority: 'Medium',
  status: 'Not Executed',
};

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  };
}

async function fillRequiredForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Feature name'), 'Password reset');
  await user.type(
    screen.getByLabelText('Feature description or user story'),
    'A user can request a password reset by email.',
  );
  await user.type(
    screen.getByLabelText('Acceptance criteria'),
    'A reset email is sent to the registered address.',
  );
  await user.selectOptions(screen.getByLabelText('Testing type'), 'Positive');
  await user.selectOptions(screen.getByLabelText('Number of test cases'), '1');
}

describe('AI Test Case Generator', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const clipboardWrite = vi.fn();

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    clipboardWrite.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('generates mock cases with the required unexecuted defaults', async () => {
    const user = userEvent.setup();
    let resolveResponse!: (response: ReturnType<typeof jsonResponse>) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    render(<GeneratorPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate test cases' }));
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    resolveResponse(
      jsonResponse({ provider: 'mock', is_mock: true, test_cases: [sampleCase] }),
    );

    expect(await screen.findByText('Mock-generated examples')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Case Title TC-ABC12345')).toHaveValue(
      'Reset email reaches a registered user',
    );
    expect(screen.getByLabelText('Actual Result TC-ABC12345')).toHaveValue('');
    expect(screen.getByText('Not Executed')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/ai/test-cases/generate'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('allows editing, saving, copying, and exporting cases', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ provider: 'mock', is_mock: true, test_cases: [sampleCase] }),
      )
      .mockResolvedValueOnce(jsonResponse({ saved_count: 1 }))
      .mockResolvedValueOnce(
        jsonResponse({
          provider: 'mock',
          is_mock: true,
          test_cases: [{ ...sampleCase, test_case_title: 'Regenerated reset flow' }],
        }),
      );
    const createObjectUrl = vi.fn(() => 'blob:test-cases');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<GeneratorPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate test cases' }));
    const titleInput = await screen.findByLabelText('Test Case Title TC-ABC12345');
    await user.clear(titleInput);
    await user.type(titleInput, 'Reviewed reset email test');
    await user.click(screen.getByRole('button', { name: 'Save test cases' }));

    expect(await screen.findByText('Saved 1 test case.')).toBeInTheDocument();
    const saveRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
      test_cases: GeneratedTestCase[];
    };
    expect(saveRequest.test_cases[0].test_case_title).toBe('Reviewed reset email test');
    expect(saveRequest.test_cases[0].actual_result).toBe('');
    expect(saveRequest.test_cases[0].status).toBe('Not Executed');

    await user.click(screen.getByRole('button', { name: 'Copy test cases' }));
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(
        expect.stringContaining('Reviewed reset email test'),
      );
    });
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(await screen.findByDisplayValue('Regenerated reset flow')).toBeInTheDocument();
  });

  it('shows API validation errors instead of pretending generation succeeded', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { detail: [{ msg: 'Input should be at least 1 character' }] },
        false,
        422,
      ),
    );
    render(<GeneratorPage />);

    await fillRequiredForm(user);
    await user.click(screen.getByRole('button', { name: 'Generate test cases' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Input should be at least 1 character',
    );
  });
});
