# QA Smart AI — Sprint Tasks

**Status:** Foundation, dashboard, AI Test Case Generator, and AI Bug Report Generator verified locally.
**Sprint length:** One week is a planning assumption; adjust to the user's availability.

## Current development progress — foundation and dashboard

**Status:** Frontend and backend foundation checks are complete.

- [x] Add frontend and backend project configuration and a `.gitignore`.
- [x] Write FastAPI health-check and local-only-by-default CORS implementation.
- [x] Write responsive dashboard, sample metrics/chart/activity, collapsible navigation, module placeholders, and theme toggle.
- [x] Write focused frontend and backend tests before implementing the matching features.
- [x] Document local setup, test, and startup commands in `README.md`.
- [x] Create the Python virtual environment and install Python dependencies.
- [x] Install frontend dependencies and generate/update `frontend/package-lock.json`.
- [x] Run frontend tests (3 passed), backend tests (5 passed), and the production build.
- [x] Start the frontend and verify that the browser URL returns HTTP 200.
- [x] Start the backend, verify `/health`, and confirm the dashboard reports **API connected**.

**Verification note:** Frontend and backend checks completed locally. Backend tests emit one upstream Starlette/AnyIO deprecation warning; all tests pass.

### Dependency security follow-up

- [x] Record Node.js `24.22.1` and npm `11.19.1`; inspect the frontend manifest and lockfile.
- [x] Run an initial `npm audit` and identify `vite` (high), `vitest` (critical), `tinypool` (critical), and `@vitest/mocker` (moderate).
- [x] Inspect npm's script setting and native package metadata; `ignore-scripts` is false and Windows platform packages are present.
- [x] Update Vite to `7.3.8` and Vitest to secure version `5.1.1` with targeted installs; refresh the lockfile without force.
- [x] Review npm lifecycle-script warnings without bypassing protections. Scripts remain unapproved; the successful build verifies the existing native binaries work.
- [x] Run a second audit (zero vulnerabilities), frontend tests (3 passed), and production build.
- [x] Start the frontend and verify `http://127.0.0.1:5173/` returns HTTP 200.

**Result:** Dependency advisories are resolved. npm lifecycle scripts remain governed by npm's existing approval policy; no script approval or bypass was used. The production build has a non-blocking large-bundle advisory. See the security review in `README.md`.

## Completed sprint — AI Test Case Generator

**Status:** Implemented and verified locally.

- [x] Re-read the approved PRD, architecture, tasks, test plan, and README before starting this sprint.
- [x] Add backend tests for mock generation, request validation, SQLite save/list, protected execution defaults, provider configuration, and local CORS preflight.
- [x] Add frontend tests for generation/loading, required default fields, edit/save, copy, regenerate, CSV export, and API error presentation.
- [x] Add backend request/response validation and a mock-default generation service.
- [x] Add opt-in OpenAI-compatible provider configuration using server-side environment variables and HTTPS validation.
- [x] Add SQLite persistence and list/save API endpoints for reviewed drafts.
- [x] Add the responsive generator page and route it from the existing sidebar without changing dashboard design.
- [x] Keep Actual Result empty and execution status Not Executed; protect these values from user/provider changes.
- [x] Add editable case fields, clipboard copy, CSV export, and spreadsheet-formula escaping.
- [x] Run backend tests (21 passed) and frontend tests (7 passed); fix failures.
- [x] Verify TypeScript/production build; run `npm audit` (zero vulnerabilities).
- [x] Start both services; verify API health and generate two mock cases in the browser. UI and API tests cover edit/save/copy/regenerate/CSV behavior.
- [x] Record verified results and local URLs here and in `README.md`.

**Result:** Verified on local development services. Frontend: `http://127.0.0.1:5173/`; API health: `http://127.0.0.1:8000/health`. One existing Starlette/AnyIO deprecation warning and the Vite large-bundle advisory remain non-blocking.

**Scope note:** Execution tracking, other modules, authentication, and dashboard data integration remain out of scope for this sprint.

## Current development progress — AI Bug Report Generator

**Status:** Implementation and regression verification complete.

- [x] Re-read the PRD, architecture, tasks, test plan, README, and existing generator/API implementation.
- [x] Add backend tests for valid/invalid issue details, safe draft defaults, severity/priority, saving/listing, evidence requirements, and configured-provider behavior.
- [x] Add frontend tests for form validation, generated report edits, review status, save/copy/regenerate/CSV, and API error states.
- [x] Reuse shared OpenAI-compatible provider configuration and error handling; keep mock mode as the default.
- [x] Add validated generation, save, and list endpoints backed by SQLite.
- [x] Add editable report fields, including severity, priority, reproducibility, status, evidence, and optional IDs.
- [x] Keep generated reports in Draft and Not Verified; require evidence before an explicitly reviewed report can be saved as Reproducible.
- [x] Keep the existing test-case generator working while sharing API configuration and CSV safety helpers.
- [x] Run full backend regression tests (41 passed) and frontend tests (12 passed).
- [x] Verify TypeScript/production build and `npm audit` (zero vulnerabilities).
- [x] Start the updated services and verify the live browser mock-generation, editing, and copy flow; save and CSV behavior are covered by automated UI/API tests.
- [x] Update README, tasks, and test-plan with behavior and verified results.

**Result:** Frontend: `http://127.0.0.1:5173/`; API health: `http://127.0.0.1:8000/health`. One existing Starlette/AnyIO deprecation warning and the Vite large-bundle advisory remain non-blocking.

## Working agreements

- Deliver one small, demonstrable increment per sprint.
- Keep mock AI selected by default and test that it makes no external calls. Only use a real provider when the user explicitly configures it.
- Add focused tests with each behavior; keep workspace authorization and transcript privacy in scope from the first implementation.
- Finish the acceptance checks for a sprint before marking it complete.
- Do not make paid/live AI calls unless the user explicitly configures the provider; do not add audio upload or unapproved features.

## Sprint 0 — Approval and project setup

**Sprint outcome:** Approved scope, runnable frontend/backend skeleton, and safe local configuration.

- [x] Review and approve `PRD.md`, `architecture.md`, `tasks.md`, and `test-plan.md`.
- [ ] Resolve MVP decisions that affect data ownership, signup, authentication/session behavior, and test deletion/history.
- [x] Scaffold the React/Vite/Tailwind/TypeScript frontend and FastAPI backend.
- [ ] Add dependency manifests, lockfiles where supported, formatting/lint/test commands, and ignore rules.
- [x] Add documented environment-variable loading and a placeholder example configuration; create no live secrets.
- [x] Add a FastAPI health endpoint and a minimal frontend shell; verify both start locally.
- [ ] Add a database connection/bootstrap path with SQLite foreign-key enforcement and a migration/version strategy.
- [ ] Write setup instructions and verify them from a clean checkout.

**Exit check:** frontend and API start using documented commands; health check works; configuration contains no committed secret; automated checks run.

## Sprint 1 — Authentication and workspace foundations

**Sprint outcome:** A user can register, sign in, and reach a protected workspace.

- [ ] Define workspace/user persistence and unique normalized email handling.
- [ ] Implement registration, login, logout, and current-user endpoints.
- [ ] Choose and implement secure password hashing and backend-managed session protection.
- [ ] Add frontend registration/login forms, protected navigation, and sign-out.
- [ ] Add generic authentication errors, server-side input validation, and safe error handling.
- [ ] Test unauthenticated access denial and workspace ownership boundaries.

**Exit check:** authentication acceptance criteria pass; passwords and session secrets are never exposed in API responses or browser storage.

## Sprint 2 — Test cases and execution history

**Sprint outcome:** A tester can create tests and record multiple pass/fail/blocked runs.

- [ ] Implement test-case schema, workspace-scoped persistence, and validation.
- [ ] Add test-case list, detail, create, edit, search, and archive/delete behavior.
- [ ] Define and implement immutable execution history and historical case snapshot behavior.
- [ ] Add execution recording and chronological execution history.
- [ ] Build usable test-case and execution screens with loading, empty, validation, and failure states.
- [ ] Add backend and frontend tests for test CRUD, history preservation, and workspace isolation.

**Exit check:** a user can create a case, run it twice with different outcomes, and still see both runs in order.

## Sprint 3 — Bug tracking and dashboard

**Sprint outcome:** A QA lead can track defects and see consistent workspace health counts.

- [ ] Implement bug persistence, controlled severity/status values, and workspace-scoped API.
- [ ] Add create, list, search, filter, edit, resolve, and reopen workflows.
- [ ] Implement shared dashboard aggregation using the documented latest-execution and open-bug rules.
- [ ] Build dashboard cards, empty states, list navigation, and responsive bug screens.
- [ ] Add tests for severity/status filters, latest-run calculations, not-run tests, and dashboard isolation.

**Exit check:** manually reconcile dashboard numbers against saved records; bug filters and status changes behave as specified.

## Sprint 4 — Mock AI and transcript analysis

**Sprint outcome:** All three AI-assisted workflows create safe, editable mock drafts.

- [ ] Define typed schemas and the backend AI provider interface.
- [ ] Implement deterministic mock test-case generation and draft review/save flow.
- [ ] Implement deterministic mock bug-report generation with editable suggested severity.
- [ ] Implement text-only transcript analysis with a privacy notice and no default transcript persistence.
- [ ] Add clear mock/simulated labels and ensure the server never makes an external call in mock mode.
- [ ] Add tests for schema validation, empty/oversized input, draft edits, explicit save, and transcript non-retention.

**Exit check:** every AI module returns valid drafts in mock mode; no raw transcript is saved; saved drafts require a user action.

## Sprint 5 — Reports, theme, and accessibility

**Sprint outcome:** Users can export useful QA summaries and use the app in either theme.

- [ ] Build report view with shared backend summary metrics.
- [ ] Implement workspace-scoped CSV export and spreadsheet-formula-safe cell escaping.
- [ ] Add theme control, operating-system preference, local preference persistence, and both theme styles.
- [ ] Review keyboard access, semantic forms, focus states, non-color status cues, and mobile layout.
- [ ] Test empty exports, filtered exports, sensitive-field exclusion, theme persistence, and core keyboard paths.

**Exit check:** exported CSV matches selected workspace/filters; no credentials or raw transcripts appear in output; both themes meet core usability checks.

## Sprint 6 — End-to-end verification and release readiness

**Sprint outcome:** The MVP is ready for user review with verified setup, test results, and known limitations.

- [ ] Run the complete test plan and fix issues introduced by the MVP.
- [ ] Exercise the full registration-to-report user journey on desktop and a mobile viewport.
- [ ] Review authorization, validation, CSV safety, transcript retention, logging, CORS, and secret handling.
- [ ] Check dependency lockfiles and ensure local database/environment files are ignored.
- [ ] Update README with final commands, configuration, troubleshooting, and MVP limitations.
- [ ] Demo acceptance criteria and obtain user confirmation before any real LLM integration or deployment.

**Exit check:** critical and high-priority checks pass; any deferred defects and production gaps are written down.

## Dependencies and order

- Sprint 0 is a prerequisite for each implementation sprint.
- Sprint 1 must precede all workspace-protected feature work.
- Sprint 2 is a prerequisite for dashboard execution metrics in Sprint 3.
- Sprint 4 can begin after Sprint 0; its draft-saving flows that write cases/bugs depend on the corresponding Sprint 2/3 models and should integrate after those models exist.
- Sprint 5 report totals depend on Sprint 3 aggregation; accessibility and theme foundations may be implemented earlier if useful.
- Sprint 6 depends on all features selected for the approved MVP.

## Out of backlog until separately approved

- Paid/third-party LLM calls, voice/audio capture, CI integrations, SSO, multi-workspace tenancy, PDF exports, and production deployment.
