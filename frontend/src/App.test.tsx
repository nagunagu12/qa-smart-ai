import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('QA Smart AI dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy', service: 'qa-smart-ai-api' }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows clearly labeled sample metrics and execution reporting', async () => {
    render(<App />);

    expect(screen.getAllByText('Sample data').length).toBeGreaterThan(0);
    expect(screen.getByText('Total test cases')).toBeInTheDocument();
    expect(screen.getByText('Passed tests')).toBeInTheDocument();
    expect(screen.getByText('Failed tests')).toBeInTheDocument();
    expect(screen.getByText('Open bugs')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /test executions over the last 7 days/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('API connected')).toBeInTheDocument();
    });
  });

  it('provides a collapsible sidebar and opens both AI generators while keeping later pages as placeholders', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Collapse sidebar' })[0]);
    expect(screen.getAllByRole('button', { name: 'Expand sidebar' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'AI Test Case Generator' }));
    expect(screen.getByRole('heading', { name: 'Generate AI test cases' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'AI Bug Report Generator' }));
    expect(screen.getByRole('heading', { name: 'Generate AI bug reports' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Test Cases' }));
    expect(screen.getByText('Coming in a future sprint')).toBeInTheDocument();
  });

  it('switches between light and dark themes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });
});
