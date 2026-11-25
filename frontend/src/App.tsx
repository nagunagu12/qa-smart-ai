import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileBarChart,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  TestTube2,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiBaseUrl } from './lib/api';
import GeneratorPage from './features/ai-test-case-generator/GeneratorPage';
import BugReportPage from './features/ai-bug-report-generator/BugReportPage';

type Theme = 'light' | 'dark';
type HealthStatus = 'checking' | 'connected' | 'unavailable';
type NavigationItem = {
  label: string;
  icon: LucideIcon;
  description: string;
};

const navigation: NavigationItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, description: 'Your QA activity at a glance.' },
  { label: 'AI Test Case Generator', icon: WandSparkles, description: 'Create editable test-case drafts from a feature description.' },
  { label: 'AI Bug Report Generator', icon: Bug, description: 'Create editable bug-report drafts from issue details and evidence.' },
  { label: 'Test Cases', icon: TestTube2, description: 'Create, organize, and review reusable test cases.' },
  { label: 'Test Execution', icon: CheckCircle2, description: 'Record test runs and review pass, fail, and blocked outcomes.' },
  { label: 'Bug Tracker', icon: ShieldAlert, description: 'Track defects, severity, and resolution status.' },
  { label: 'Voice Agent Analyzer', icon: AudioLines, description: 'Analyze pasted voice-agent transcripts. Audio upload is not included.' },
  { label: 'Reports', icon: FileBarChart, description: 'Review QA summaries and export reports.' },
  { label: 'Settings', icon: Settings, description: 'Manage application preferences.' },
];

const executionData = [
  { day: 'Mon', passed: 28, failed: 4 },
  { day: 'Tue', passed: 34, failed: 6 },
  { day: 'Wed', passed: 25, failed: 3 },
  { day: 'Thu', passed: 39, failed: 5 },
  { day: 'Fri', passed: 31, failed: 4 },
  { day: 'Sat', passed: 17, failed: 2 },
  { day: 'Sun', passed: 18, failed: 3 },
];

const activityItems = [
  { icon: Check, title: 'Checkout flow — Chrome', detail: 'Marked as passed', time: '10 min ago', tone: 'success' },
  { icon: Bug, title: 'Payment form validation', detail: 'New high-severity bug reported', time: '42 min ago', tone: 'danger' },
  { icon: TestTube2, title: 'User profile settings', detail: 'Test case updated', time: '2 hours ago', tone: 'info' },
  { icon: CheckCircle2, title: 'Login with expired token', detail: 'Marked as passed', time: '3 hours ago', tone: 'success' },
] as const;

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('qa-smart-ai-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function HealthIndicator({ status }: { status: HealthStatus }) {
  const label = {
    checking: 'Checking API',
    connected: 'API connected',
    unavailable: 'API unavailable',
  }[status];

  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:flex"
      role="status"
      title={status === 'unavailable' ? 'Start the FastAPI server to connect.' : undefined}
    >
      <span
        className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'unavailable' ? 'bg-rose-500' : 'animate-pulse bg-amber-400'}`}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

function Sidebar({
  activePage,
  collapsed,
  mobileOpen,
  onNavigate,
  onToggleCollapsed,
  onCloseMobile,
}: {
  activePage: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (label: string) => void;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[84px]' : 'lg:w-64'}`}
      >
        <div className={`flex h-[76px] items-center border-b border-slate-100 px-5 dark:border-slate-800 ${collapsed ? 'lg:justify-center lg:px-3' : 'justify-between'}`}>
          <button
            className="flex items-center gap-3 rounded-xl text-left"
            onClick={() => onNavigate('Dashboard')}
            aria-label="QA Smart AI dashboard"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <FlaskConical size={21} strokeWidth={2.2} />
            </span>
            <span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                QA Smart <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Testing workspace
              </span>
            </span>
          </button>
          <button
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={onCloseMobile}
          >
            <X size={18} />
          </button>
        </div>

        <div className={`px-4 pb-3 pt-6 ${collapsed ? 'lg:px-3' : ''}`}>
          <div className={`mb-3 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${collapsed ? 'lg:justify-center' : ''}`}>
            <span className={collapsed ? 'lg:hidden' : ''}>Workspace</span>
            <button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:block"
              onClick={onToggleCollapsed}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => {
              const isActive = activePage === label;
              return (
                <button
                  key={label}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                  onClick={() => {
                    onNavigate(label);
                    onCloseMobile();
                  }}
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}
                    size={18}
                    strokeWidth={1.9}
                  />
                  <span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
                  {label === 'AI Test Case Generator' && (
                    <span className={`ml-auto rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 ${collapsed ? 'lg:hidden' : ''}`}>
                      AI
                    </span>
                  )}
                  {label === 'Dashboard' && isActive && (
                    <span className={`ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 ${collapsed ? 'lg:hidden' : ''}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={`mt-auto border-t border-slate-100 p-4 dark:border-slate-800 ${collapsed ? 'lg:px-3' : ''}`}>
          <div className={`rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 ${collapsed ? 'lg:flex lg:justify-center lg:bg-transparent lg:p-0' : ''}`}>
            <div className={`mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                <Sparkles size={13} />
              </span>
              Starter workspace
            </div>
            <p className={`text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>
              Dashboard numbers are sample data for this preview.
            </p>
            <button
              className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:block"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
          <div className={`mt-3 flex items-center gap-2 px-2 py-2 text-xs text-slate-400 ${collapsed ? 'lg:justify-center' : ''}`}>
            <CircleHelp size={15} />
            <span className={collapsed ? 'lg:hidden' : ''}>Help & support</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({
  activePage,
  healthStatus,
  isDark,
  onToggleTheme,
  onOpenMobile,
}: {
  activePage: string;
  healthStatus: HealthStatus;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMobile: () => void;
}) {
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open navigation menu"
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          onClick={onOpenMobile}
        >
          <Menu size={19} />
        </button>
        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <span className="truncate text-slate-500 dark:text-slate-400">{activePage}</span>
          </div>
          <h1 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white sm:mt-1 sm:text-base">
            {activePage}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-xs text-slate-400 xl:block">{today}</span>
        <HealthIndicator status={healthStatus} />
        <span className="hidden h-7 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
        <button
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-300"
          onClick={onToggleTheme}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span
          aria-label="Workspace profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white ring-2 ring-indigo-100 dark:ring-slate-800"
        >
          QA
        </span>
      </div>
    </header>
  );
}

function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  tone,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  tone: 'indigo' | 'emerald' | 'rose' | 'amber';
  trend: 'up' | 'down' | 'flat';
}) {
  const toneStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  }[tone];
  const TrendIcon = trend === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles}`}>
          <Icon size={19} strokeWidth={1.9} />
        </div>
        <span className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
          trend === 'down'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {trend !== 'flat' && <TrendIcon size={12} />}
          {change}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1.5 text-[27px] font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{description}</p>
      </div>
    </article>
  );
}

function ExecutionChart() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Test executions</h2>
          <p className="mt-1 text-xs text-slate-400">Daily results over the last 7 days</p>
        </div>
        <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
          This week <ChevronDown className="ml-1 inline" size={13} />
        </span>
      </div>
      <div
        className="mt-5 h-[245px] w-full"
        role="img"
        aria-label="Test executions over the last 7 days, showing passed and failed tests"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={executionData} margin={{ top: 8, right: 6, left: -22, bottom: 0 }} barGap={5}>
            <CartesianGrid vertical={false} stroke="#eef0f5" strokeDasharray="4 5" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dx={-3} />
            <Tooltip
              cursor={{ fill: '#f5f6fa' }}
              contentStyle={{
                border: '1px solid #e8eaf0',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, .08)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="passed" name="Passed" fill="#6574e8" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="failed" name="Failed" fill="#f1a0a5" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-sm bg-indigo-500" /> Passed
        </span>
        <span className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-sm bg-rose-300" /> Failed
        </span>
        <span className="ml-auto text-[10px] text-slate-400">Sample data</span>
      </div>
    </section>
  );
}

function ActivityFeed() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent activity</h2>
          <p className="mt-1 text-xs text-slate-400">A snapshot of recent QA work</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Sample data
        </span>
      </div>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {activityItems.map(({ icon: Icon, title, detail, time, tone }) => (
          <li key={title} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-1">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              tone === 'success'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300'
                : tone === 'danger'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300'
            }`}>
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>
              <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
            </div>
            <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">{time}</span>
          </li>
        ))}
      </ul>
      <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
        View all activity <ArrowRight size={14} />
      </span>
    </section>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (label: string) => void }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 lg:px-9 lg:pt-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Sparkles size={11} /> QA workspace
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              Sample data
            </span>
          </div>
          <h2 className="text-[23px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[27px]">
            Quality overview
          </h2>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">
            A quick look at your testing progress, recent activity, and release health.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 dark:shadow-none"
          onClick={() => onNavigate('Test Cases')}
        >
          <Plus size={15} /> New test case
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total test cases" value="248" change="+12.5%" description="Compared with last month" icon={FlaskConical} tone="indigo" trend="up" />
        <StatCard title="Passed tests" value="192" change="+8.2%" description="Latest recorded results" icon={CheckCircle2} tone="emerald" trend="up" />
        <StatCard title="Failed tests" value="18" change="−3.1%" description="Latest recorded results" icon={ShieldAlert} tone="rose" trend="down" />
        <StatCard title="Open bugs" value="7" change="2 high" description="Needs attention" icon={Bug} tone="amber" trend="flat" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)]">
        <ExecutionChart />
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <WandSparkles size={19} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">AI test assistance</h2>
              <p className="mt-1 text-xs text-slate-400">Draft test ideas from a feature description.</p>
            </div>
          </div>
          <button
            aria-label="Open AI test case generator"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
            onClick={() => onNavigate('AI Test Case Generator')}
          >
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
              <Activity size={19} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Test coverage</h2>
              <p className="mt-1 text-xs text-slate-400">Sample suite coverage is trending up this week.</p>
            </div>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">84%</span>
        </section>
      </div>

      <p className="mt-6 text-center text-[10px] text-slate-400">
        Dashboard figures and activity are sample data and are not connected to saved test records yet.
      </p>
    </div>
  );
}

function PlaceholderPage({ label, onBack }: { label: string; onBack: () => void }) {
  const item = navigation.find(({ label: itemLabel }) => itemLabel === label);
  const Icon = item?.icon ?? Settings;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-116px)] max-w-[900px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
        <Icon size={25} />
      </span>
      <span className="mt-5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
        Coming in a future sprint
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{label}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {item?.description ?? 'Workspace preferences will be available here.'}
      </p>
      <p className="mt-3 text-xs text-slate-400">
        This page is a placeholder. It does not create, change, or save QA records yet.
      </p>
      <button
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        onClick={onBack}
      >
        <LayoutDashboard size={15} /> Back to dashboard
      </button>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('qa-smart-ai-theme', theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    async function checkApiHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Health check failed with HTTP ${response.status}.`);
        }
        const result: unknown = await response.json();
        if (
          typeof result !== 'object'
          || result === null
          || !('status' in result)
          || result.status !== 'healthy'
        ) {
          throw new Error('The API returned an unexpected health response.');
        }
        if (isMounted) setHealthStatus('connected');
      } catch {
        if (isMounted) setHealthStatus('unavailable');
      }
    }

    void checkApiHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activePage={activePage}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={setActivePage}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-[margin] duration-200 ${collapsed ? 'lg:ml-[84px]' : 'lg:ml-64'}`}>
        <TopBar
          activePage={activePage}
          healthStatus={healthStatus}
          isDark={theme === 'dark'}
          onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main>
          {activePage === 'Dashboard' ? (
            <Dashboard onNavigate={setActivePage} />
          ) : activePage === 'AI Test Case Generator' ? (
            <GeneratorPage />
          ) : activePage === 'AI Bug Report Generator' ? (
            <BugReportPage />
          ) : (
            <PlaceholderPage label={activePage} onBack={() => setActivePage('Dashboard')} />
          )}
        </main>
        <footer className="border-t border-slate-200/70 px-4 py-4 text-center text-[10px] text-slate-400 dark:border-slate-800 sm:px-7 lg:px-9">
          QA Smart AI <span className="mx-1.5">·</span> Project foundation preview
        </footer>
      </div>
    </div>
  );
}
