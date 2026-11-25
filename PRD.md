# Product Requirements Document — QA Smart AI

**Status:** Draft for user approval
**Phase:** 1 — Planning only
**Last updated:** 2026-11-25
**Product name:** QA Smart AI

## 1. Product summary

QA Smart AI is a web application that helps a quality assurance (QA) team organize test cases, run tests, track bugs, and prepare reports. Its AI-assisted features turn a plain-language feature description into draft test cases, turn an issue description into a draft bug report, and summarize a customer-support voice-agent transcript.

The first release is a single-workspace MVP. AI uses predictable mock responses by default, so the application can be developed and demonstrated without an API key or model-provider costs. The design leaves a clearly defined seam for a configurable language-model (LLM) provider later.

**This is a planning document.** Application code, dependencies, and database files must not be created until the user approves this plan.

## 2. Problem and opportunity

Small QA teams often keep tests, execution results, defects, and support-call findings in separate documents or tools. This makes it difficult to see release readiness, find important defects, repeat test runs, and communicate results. A simple, secure workspace can bring these activities together without requiring a paid AI service.

## 3. Goals and success measures

### Goals

- Give a signed-in user a clear view of QA activity and release health.
- Manage reusable test cases and dated execution results.
- Record bugs with a consistent severity and workflow status.
- Provide useful, clearly labeled mock AI assistance for three input-to-draft workflows.
- Export understandable QA data without sending it to an external service.
- Support a usable desktop, tablet, and mobile experience, with light and dark themes.

### MVP success measures

- A new user can register, sign in, create test cases, record a run, and create a bug without assistance.
- The dashboard totals agree with the underlying saved test, run, and bug records.
- All three AI workflows return valid, editable drafts when the configured provider is `mock`.
- A user can export a report and confirm that it contains the records selected for export.
- MVP acceptance checks pass, and automated backend and frontend tests run locally.

## 4. Users and MVP scope

### Primary users

- **QA tester:** drafts and maintains tests, records run outcomes, and files defects.
- **QA lead:** reviews current quality status, prioritizes defects, and exports summaries.
- **Administrator / workspace owner:** creates the initial account and manages workspace access.

### In scope

- One workspace and authenticated users; records are scoped to that workspace.
- Dashboard; test-case management; test executions and pass/fail tracking; bug tracking and severity; mock test-case generation, mock bug-report generation, and text-transcript analysis; CSV report export; registration/login; responsive UI; light/dark theme.
- SQLite persistence for local development and the initial MVP.
- An explicit provider interface/configuration, with only the mock provider implemented initially.

### Not in the initial MVP

- Real LLM API calls, API-key setup in the UI, model training, or autonomous test execution.
- Audio recording, audio uploads, speech recognition, or live voice calls. The transcript analyzer accepts **text** transcripts only.
- Multiple customer workspaces, public signup moderation, granular role administration, or enterprise SSO.
- Browser/device-farm integrations, CI/CD integrations, notifications, attachments, or audit/compliance certification.
- PDF report export; CSV is the initial report format.

## 5. Product modules and acceptance criteria

All acceptance criteria below are required for MVP completion. AI-generated content is a draft and must be reviewed and saved by a user; mock output must be visibly identified as simulated.

### 5.1 QA Dashboard

- Show total test cases, latest execution pass/fail/not-run counts, open bugs, and high/critical open bugs.
- Clearly distinguish a test case from an individual execution result.
- Counts reflect persisted records and update after a create, edit, run, or status change without requiring a manual recount.
- An empty workspace shows useful next steps instead of misleading zero-data charts.
- Dashboard actions link to the relevant test or bug list.

### 5.2 AI Test Case Generator

- Accept a feature description and, optionally, a title/context.
- Return multiple structured draft tests with a title, preconditions, steps, and expected result.
- Allow the user to review and edit drafts, then explicitly save selected cases.
- Reject empty or over-limit input with a clear validation message.
- In the MVP, label output as mock/simulated and make no network call to an LLM provider.

### 5.3 AI Bug Report Generator

- Accept a plain-language issue description and optionally environment/context.
- Return an editable draft with summary, reproduction steps, expected result, actual result, and suggested severity.
- Require user review before saving; the user can change severity and fields.
- Display that the severity is a suggestion, not a confirmed diagnosis.
- In mock mode, perform no external network call.

### 5.4 Test Case Management

- Create, view, edit, search, and delete a test case.
- Store a stable identifier, title, description, preconditions, ordered steps, expected result, priority, tags, and timestamps.
- Validate required fields and explain invalid input.
- A deleted test case does not erase the history of completed executions; retain a snapshot or mark the case archived, according to the final persistence design.
- List empty, loading, and error states clearly.

### 5.5 Test Execution and Pass/Fail Tracking

- Start an execution for a saved test case and record pass, fail, or blocked, plus an optional note.
- Show the result, tester, and execution time in execution history.
- Keep each run as a separate historical record; rerunning a test does not overwrite its previous result.
- Dashboard pass/fail totals use the latest run per active test case and disclose that rule.
- Reject an execution request for a missing or deleted test case with a clear error.

### 5.6 Bug Tracking and Severity Management

- Create, view, edit, search, filter, and resolve or reopen a bug.
- Store a stable identifier, summary, description, reproduction details, expected/actual results, severity, status, and timestamps.
- Use the controlled severity values **Critical, High, Medium, Low** and statuses **Open, In Progress, Resolved, Closed**.
- Allow filtering by severity and status; visually communicate severity without relying on color alone.
- Dashboard open-bug counts exclude Resolved and Closed bugs.

### 5.7 AI Voice Agent Transcript Analyzer

- Accept pasted text from a voice-agent conversation; do not capture or upload audio.
- Return a structured mock analysis: short summary, customer intent, sentiment, unresolved concerns, and suggested follow-up.
- Treat transcript content as untrusted text, not instructions to the application or model.
- Show a privacy notice and do not save the raw transcript unless the user explicitly chooses to save the resulting analysis.
- Mark all mock analysis as simulated and allow the user to copy the result.

### 5.8 QA Reports and Export

- Show a report view with test totals and outcomes, bug totals by severity/status, and an export date.
- Allow export of selected report data as CSV using readable column names.
- Escape CSV cells correctly so user-provided content is not interpreted as a spreadsheet formula.
- Exported rows match the chosen workspace and filters; empty datasets produce a valid, understandable export.
- Do not include passwords, session credentials, or raw transcript text in reports.

### 5.9 User Login and Registration

- Allow an account to register with a valid email address and a password that meets the documented policy; reject duplicate emails.
- Allow a registered user to sign in and sign out; invalid credentials receive a generic error that does not reveal whether an email exists.
- Require authentication for all workspace data and AI/report endpoints.
- Hash passwords with a maintained password-hashing library; never store or return plaintext passwords.
- Protect authenticated browser requests against the selected session/CSRF threat model, and verify that one workspace cannot read another workspace's records.
- Provide an initial safe local-development account/bootstrap procedure; do not ship hard-coded production credentials.

### 5.10 Dark and Light Mode

- Provide an accessible theme control and support light and dark themes across all application screens.
- Respect the operating-system theme on first visit, then use the user's saved preference.
- Persist preference locally without storing authentication secrets there.
- Maintain readable contrast, visible focus, and consistent component states in both themes.

## 6. Functional requirements

- **FR-01 Identity:** register, authenticate, sign out, and authorize access to workspace resources.
- **FR-02 Dashboard:** calculate and display current workspace QA summaries using the documented latest-run rule.
- **FR-03 Test cases:** create, retrieve, update, delete/archive, search, and filter test cases.
- **FR-04 Executions:** append dated execution results; retrieve a test's execution history.
- **FR-05 Bugs:** create, retrieve, update, search, filter, and change status/severity for bugs.
- **FR-06 AI drafts:** accept validated requests and return structured drafts from the configured provider interface; require user confirmation to save.
- **FR-07 Mock default:** select deterministic mock responses by default and perform no external AI calls in that configuration.
- **FR-08 Transcript privacy:** analyze text only; do not persist submitted transcript text by default.
- **FR-09 Reports:** present current workspace QA summaries and safely export selected data as CSV.
- **FR-10 Theme:** provide accessible light/dark modes and save the user's preference.
- **FR-11 Validation and errors:** validate on both client and server; return actionable, non-sensitive errors without success-shaped fallbacks.
- **FR-12 Workspace isolation:** apply workspace ownership checks to every record query, write, and export.

## 7. Non-functional requirements

- **Security:** use HTTPS when deployed; hash passwords; validate and constrain inputs; parameterize database access; restrict cross-origin access; keep secrets in environment configuration; avoid logging passwords, tokens, or transcript text; use safe session handling and appropriate request protections.
- **Privacy:** make no third-party AI calls in mock mode; disclose what transcript analysis does; do not retain raw transcripts by default; export only the requested workspace data.
- **Reliability:** use database transactions for related writes; surface failures; preserve execution history; enforce database constraints where practical.
- **Performance:** for a local MVP dataset of up to 10,000 test cases and 10,000 bugs, common list/dashboard API requests should complete within 1 second at the 95th percentile on a typical developer machine, excluding startup and network delay.
- **Accessibility:** target WCAG 2.2 AA for key user flows; support keyboard navigation, visible focus, semantic labels, and non-color severity/status cues.
- **Responsive design:** support a 360-pixel-wide mobile viewport through desktop layouts without losing core actions or data.
- **Maintainability:** separate frontend pages/components, API routes, service/business logic, persistence models, and AI provider interface; type-check frontend code and use automated tests.
- **Compatibility:** document supported browser versions and pin dependency ranges/lockfiles when implementation begins.
- **Usability:** provide clear empty, loading, validation, and error states, and use beginner-friendly setup instructions.

## 8. Data and domain rules

- MVP entities: **Workspace**, **User**, **TestCase**, **TestExecution**, and **Bug**.
- Each test case, execution, and bug belongs to a workspace; every API operation must enforce that relationship.
- A test case has many execution records. Execution records preserve the test title/steps needed to understand historical runs if a case is later archived.
- An active test case's dashboard result is its most recent execution, if any. Cases with no run are counted as not run.
- Open bug metrics include Open and In Progress only.
- Times are stored in UTC and displayed in the user's local timezone.
- Mock AI generation returns validated structures matching the same schemas expected from a future provider.

## 9. Risks and open decisions

| Topic | MVP planning assumption | Revisit before implementation if needed |
|---|---|---|
| Workspace model | One logical workspace; users in it share records | Whether users need separate workspaces immediately |
| User roles | Basic authenticated membership; no granular roles | Whether QA lead/admin permissions are required |
| Signup | Local MVP registration; production deployment must define invitation/approval policy | How public registration is controlled |
| Sessions | Backend-managed secure authentication; finalize cookie/CSRF details in architecture and security review | Hosting topology and cross-site frontend/API deployment |
| Test deletion | Archive or retain execution snapshots so history remains readable | Whether hard deletion is needed for data-retention requests |
| Transcript retention | Analyze transiently; save analysis only after explicit user action | Retention and deletion rules for saved analyses |
| AI configuration | Mock provider only in phase 1; provider choice via server configuration later | Provider, data-processing terms, budget limits, and region |
| Export | CSV only | Whether PDF or additional formats are required |
| Deployment | Local development first | Hosting, backups, SQLite suitability, and operational ownership |

## 10. Release gates

1. User approves the planning documents.
2. Confirm any open decisions that change core data ownership, authentication, deployment, or transcript retention.
3. Implement the MVP in the small sprints in [tasks.md](./tasks.md).
4. Meet the acceptance criteria and applicable checks in [test-plan.md](./test-plan.md).
5. Review security, privacy, setup documentation, and remaining limitations before calling the MVP ready.
