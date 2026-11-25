# QA Smart AI — Test Plan

**Status:** Active; AI generator sprints verified locally
**Phase:** Implementation — AI Test Case and Bug Report Generators

## 1. Purpose

Verify that each MVP workflow meets the product requirements, workspace data remains private, mock AI does not call an external provider, and the application is usable across supported screen sizes and themes.

## 2. Test scope

### Included

- Frontend forms, navigation, empty/error states, responsive layout, and theme behavior.
- FastAPI request validation, authentication, workspace authorization, domain rules, and errors.
- SQLite persistence, constraints, dashboard/report calculations, and execution history.
- Mock AI output schemas, user review/save behavior, and transcript privacy.
- CSV content correctness and spreadsheet-formula safety.
- Documented local setup and automated test commands.

### Excluded from the initial MVP

- Real-provider/model quality, provider availability, prompt-injection defense for a real external model, and AI cost/latency tests.
- Audio recording, speech recognition, browser/device farms, and integrations not in the PRD.
- Production penetration testing, formal compliance certification, and load tests beyond the stated local target.

## 3. Test levels and tools

| Level | Purpose | Proposed approach |
|---|---|---|
| Unit | Verify business rules and parsing/formatting helpers | pytest; Vitest |
| API/integration | Verify endpoints, database behavior, validation, and authorization | FastAPI test client; temporary SQLite database; HTTPX if needed by the chosen setup |
| UI/component | Verify forms, accessible states, theme, and API error presentation | React Testing Library and Vitest |
| End-to-end | Verify high-value user journeys in a real browser | Playwright, if included during implementation |
| Manual | Verify mobile layout, accessibility details, setup clarity, and product acceptance | Keyboard/screen-size checks and human review |

Exact dependency versions and test commands are selected when the application is scaffolded. Use isolated test data; never point tests at a user's real database.

## 4. Test data and environment

- Use a temporary database per test run with foreign-key enforcement enabled.
- Create at least two workspaces and users in authorization tests to check cross-workspace access.
- Use clearly fake emails and deterministic mock AI responses.
- Use transcripts containing unique marker text to detect accidental persistence or logging.
- Test boundary cases: empty input, over-limit input, invalid enums, missing records, duplicate normalized email, and empty exports.
- Do not use real credentials, real customer transcripts, or paid-provider keys in automated tests.

## 5. Acceptance test cases

### Authentication and workspace isolation

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Register with a valid email/password | Account is created; response never contains a password or hash |
| AUTH-02 | Register an email that already exists, including a case/normalization variant | Request is rejected safely; only one account exists |
| AUTH-03 | Sign in with an incorrect password or unknown email | Generic authentication error; no indication that the email exists |
| AUTH-04 | Request protected workspace data without an authenticated session | Access is denied |
| AUTH-05 | User A requests, changes, or exports User B's workspace records | Access is denied or no foreign records are disclosed; no mutation occurs |
| AUTH-06 | Sign out, then reuse the old session | Session is invalidated and protected access is denied |

### Dashboard

| ID | Scenario | Expected result |
|---|---|---|
| DASH-01 | Open an empty workspace | Empty state is clear; counts show zero without fabricated activity |
| DASH-02 | Add cases with no runs, then with pass/fail/blocked runs | Counts follow the latest-run-per-active-case rule; unrun cases are reported separately |
| DASH-03 | Add bugs with every severity/status | Open counts include Open and In Progress only; severity counts agree with the selected definition |
| DASH-04 | Read the dashboard as a different workspace user | Only that workspace's counts are shown |

### Test cases and execution history

| ID | Scenario | Expected result |
|---|---|---|
| CASE-01 | Create a case with all required fields | Case appears with a stable identifier and saved values |
| CASE-02 | Submit a missing title or invalid field | Clear validation error; invalid record is not saved |
| CASE-03 | Search, edit, and archive a case | Results and details match the change; archived case is not treated as active |
| RUN-01 | Record passed, failed, and blocked runs for a case | Every run is saved with tester/time/note and displayed in history |
| RUN-02 | Record a second run with a different result | First result remains unchanged; latest-result summary updates deterministically |
| RUN-03 | Run a missing/archived case | Clear not-found or invalid-state error; no orphan execution is created |
| RUN-04 | Archive a case with execution history | Historical execution remains readable with its test snapshot |

### Bug tracking

| ID | Scenario | Expected result |
|---|---|---|
| BUG-01 | Create a bug with each allowed severity | Values are accepted and shown with a non-color text label |
| BUG-02 | Submit an invalid severity or status | Server rejects the value; invalid data is not persisted |
| BUG-03 | Filter by severity and status | Every returned row matches both active filters |
| BUG-04 | Resolve, close, and reopen a bug | Status changes are saved; open dashboard totals update per the PRD rule |
| BUG-05 | Access a bug from another workspace | No foreign record is returned or modified |

### AI Bug Report Generator — sprint checks

| ID | Scenario | Expected result |
|---|---|---|
| BGR-01 | Submit valid project/module, environment, issue details, and optional evidence/IDs | A schema-valid, clearly labeled mock report is generated |
| BGR-02 | Submit blank required values, an invalid environment, extra fields, or over-limit content | API returns validation errors; no report is saved |
| BGR-03 | Generate with or without evidence | New report stays Draft and Not Verified; generation alone does not persist it |
| BGR-04 | Review and edit report fields, severity, priority, and status | Allowed values are editable and the saved record contains the reviewed values |
| BGR-05 | Mark a report Reproducible without evidence | UI blocks the save and API validation rejects it |
| BGR-06 | Add evidence and explicitly select Reproducible | Save succeeds with the user-selected reproducibility and evidence |
| BGR-07 | Copy, regenerate, and export a report | Clipboard reflects current edits; regenerate requests a new draft; CSV includes every report field |
| BGR-08 | Export a title beginning with a spreadsheet formula character | CSV quotes the cell and neutralizes the formula prefix |
| BGR-09 | Use an unsupported provider or a mocked configured-provider response | Unsupported configuration fails clearly; configured provider output is validated and the key is not exposed |
| BGR-10 | Save a reviewed report and list saved reports | SQLite returns the same edited fields and IDs |

### AI drafts and transcript privacy

| ID | Scenario | Expected result |
|---|---|---|
| AI-01 | Generate test cases using the mock provider | Output conforms to the draft schema, is visibly marked mock, and causes no external request |
| AI-02 | Generate a bug report using the mock provider | Required draft fields and suggested severity are present; user can edit before saving |
| AI-03 | Analyze a text transcript using the mock provider | Summary, intent, sentiment, concerns, and follow-up are returned and visibly marked mock |
| AI-04 | Submit blank or over-limit AI input | Helpful validation appears; provider is not called |
| AI-05 | Analyze transcript text containing instruction-like content | Input is treated as untrusted content; it cannot change authorization, trigger tools, or cause code/HTML execution |
| AI-06 | Analyze without selecting save, then inspect database/log output | Raw transcript marker is not persisted or emitted in application logs |
| AI-07 | Change fields in a generated draft and explicitly save | The user-approved edited values—not an unreviewed alternate—are saved |
| AI-08 | Configure an unsupported provider value | Configuration/request fails clearly; application does not silently pretend a real provider or mock succeeded |

### AI Test Case Generator — sprint checks

| ID | Scenario | Expected result |
|---|---|---|
| GEN-01 | Submit a valid feature name, description, criteria, type, and case count in mock mode | Requested number of valid drafts is returned, visibly marked as mock, with unique IDs |
| GEN-02 | Submit blank/whitespace values, unsupported type, extra fields, or counts outside 1–20 | API returns a validation error and does not report success |
| GEN-03 | Review generated fields | All eleven requested fields are present; Actual Result is empty and Status is Not Executed |
| GEN-04 | Edit draft text and priority, then save | Edited values are saved and returned from SQLite; IDs and duplicate handling are deterministic |
| GEN-05 | Attempt to save a non-empty Actual Result or a different execution Status | API rejects the request; an untested result cannot be recorded by the generator |
| GEN-06 | Copy, regenerate, and export a draft | Clipboard contains reviewed fields; regenerate issues a new request; CSV includes every required column |
| GEN-07 | Export a field beginning with `=`, `+`, `-`, or `@` | CSV quotes the cell and neutralizes the spreadsheet formula prefix |
| GEN-08 | Configure an OpenAI-compatible provider with a mocked HTTP response | Request uses the configured model and server-side authorization; no live provider call occurs in tests; output is validated |
| GEN-09 | Configure a missing key, unknown provider, insecure remote HTTP URL, provider failure, or malformed response | Clear API error is returned; the server does not silently switch to mock output or expose the key |
| GEN-10 | Open local frontend and preflight a JSON POST to the generator | Only configured local origins are allowed and required JSON headers/method are accepted |

### Reports, exports, themes, and UI

| ID | Scenario | Expected result |
|---|---|---|
| REPORT-01 | Export populated and empty report selections | Valid CSV has readable headers and correct rows, or headers for an empty selection |
| REPORT-02 | Export text beginning with `=`, `+`, `-`, or `@` | Cells are escaped safely for spreadsheet use |
| REPORT-03 | Export after applying workspace and list filters | Output matches selected scope/filter; credentials and raw transcript text are absent |
| UI-01 | First visit with light and dark operating-system preference | Initial theme follows system preference |
| UI-02 | Change theme and reload | Selected preference remains; auth secrets are not stored in local storage |
| UI-03 | Navigate core flows using keyboard only | Controls have labels, visible focus, and sensible order; actions remain usable |
| UI-04 | Use core screens at 360px and desktop width | No essential data/action is inaccessible due to horizontal overflow |
| UI-05 | Trigger loading, empty, validation, server-error, and permission-denied states | Each state is understandable and does not present failure as success |

## 6. Non-functional verification

- **Performance:** seed up to 10,000 test cases and 10,000 bugs; measure representative dashboard and common list API requests locally. Target p95 under one second as specified in the PRD, excluding startup/network delay. Record machine and dataset details.
- **Accessibility:** check keyboard-only flows, visible focus, semantic labels/headings, status announcements where needed, contrast, and non-color cues. Automated accessibility tooling supports, but does not replace, human checks.
- **Security:** check protected endpoints, cross-workspace IDs/filters/exports, generic login errors, input bounds, safe SQL usage, session invalidation, restrictive CORS configuration, safe CSV escaping, and sensitive-data logging.
- **Privacy:** confirm mock mode makes no external request and transcript text is not retained by default.
- **Reliability:** check foreign-key constraints, transaction rollback on failed writes, and preservation of execution history.

## 7. Exit criteria

- All PRD acceptance criteria have passing automated tests or a recorded manual verification.
- No open critical/high-severity defect affects authentication, workspace isolation, data loss, transcript privacy, or report correctness.
- Frontend tests, backend tests, lint, formatting, and type checks pass using documented project commands.
- Documented clean setup succeeds on a supported developer environment.
- Any known limitation or deferred issue is recorded in the README/release notes and reviewed with the user.

## 8. Defect handling

Record each defect with a concise title, reproducible steps, expected/actual behavior, environment, severity, and relevant sanitized logs. Do not place passwords, session values, real transcripts, or API keys in screenshots or defect reports.

## 9. AI generator sprint verification

- Backend regression tests: **41 passed**.
- Frontend regression tests: **12 passed**.
- TypeScript check and Vite production build: **passed**. Vite reports a non-blocking large-bundle advisory.
- Frontend `npm audit`: **0 vulnerabilities**.
- Live API health and browser mock-generation flow: **passed**. Bug-report edits and copy were checked live; save and CSV behavior are covered by frontend/API tests.
- Generated test cases keep Actual Result empty and status Not Executed. Generated bug reports start as Draft and Not Verified; reproducible status requires evidence.
- The backend test run reports one upstream Starlette/AnyIO deprecation warning.
