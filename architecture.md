# QA Smart AI — Architecture

**Status:** Proposed; requires approval
**Phase:** 1 — Planning only

## 1. Architectural overview

Use a small, layered web application:

1. **Frontend:** React with Vite and Tailwind CSS. It displays the user interface and calls the JSON API.
2. **Backend:** Python with FastAPI. It authenticates users, validates requests, enforces workspace access, applies business rules, and returns JSON.
3. **Database:** SQLite for the initial local MVP. Python's standard-library `sqlite3` is available; an ORM or database migration tool may be selected when implementation begins.
4. **AI boundary:** a backend provider interface. The initial `mock` implementation generates schema-valid, clearly labeled example content without an external network request.

```text
Browser
  React + Vite + Tailwind
        | HTTPS in deployment; JSON API
        v
  FastAPI routes -> auth and domain services -> AI provider interface
                                   |                    |
                                   v                    +-> Mock provider (MVP)
                              SQLite database               Future configured provider
```

The Vite development server is not the production API. Production deployment must serve the compiled frontend and the FastAPI service through a documented, secure hosting arrangement.

## 2. Proposed project layout

```text
qa-smart-ai/
  frontend/
    src/
      app/              Routes, application shell, protected pages
      components/       Shared accessible UI components
      features/         Dashboard, tests, executions, bugs, AI, reports
      lib/              API client, auth state, theme, shared types
    package.json
    vite.config.*
  backend/
    app/
      api/              FastAPI routers and request/response schemas
      core/             Settings, authentication, errors
      db/               Connection/session and migrations
      models/           Persistence models
      repositories/     Workspace-scoped database operations
      services/         QA, reporting, and AI orchestration
      ai/               Provider interface and mock provider
      main.py
    tests/
    pyproject.toml or requirements.txt
  docs/
    (optional later; phase-1 planning files remain in the project root)
  PRD.md
  architecture.md
  tasks.md
  test-plan.md
  README.md
```

This is a proposed layout, not a set of folders to create during planning.

## 3. Frontend responsibilities

- Provide routed views for sign-in/registration, dashboard, test cases, execution history, bugs, AI draft tools, and reports.
- Use shared components for navigation, forms, status/severity labels, tables, confirmation prompts, and feedback messages.
- Keep API access in a small client layer; do not place database access, LLM credentials, or authorization decisions in the browser.
- Validate forms for usability, while treating the backend as the authority for validation and authorization.
- Render keyboard-accessible controls and status cues that do not depend on color.
- Apply light/dark theme centrally, initially respecting system preference and subsequently respecting the user's local preference.
- Show AI output as editable draft content, with an explicit save action.
- Never store passwords, access tokens, or raw transcripts in local storage.

## 4. Backend responsibilities and boundaries

- **API routes:** define versioned JSON endpoints, map validated input/output schemas, and authenticate protected requests.
- **Core/auth:** load configuration from environment variables, implement password hashing and session/token checks, and keep secret material out of source control.
- **Services:** implement dashboard aggregation, execution history rules, bug status rules, report selection, and AI orchestration.
- **Repositories:** perform parameterized, workspace-scoped persistence operations.
- **AI provider interface:** define typed operations for test-case drafts, bug-report drafts, and transcript analysis. The mock provider satisfies the same interface as a potential later provider.
- **Error handling:** return consistent, actionable HTTP errors; log enough for diagnosis without logging credentials or submitted transcript text.
- **CORS:** allow only configured frontend origins; do not use wildcard origins with credentials.

Suggested API groups (exact URLs can be finalized during implementation):

| Area | Example operations |
|---|---|
| Authentication | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` |
| Dashboard | `GET /api/v1/dashboard/summary` |
| Test cases | `GET/POST /api/v1/test-cases`, `GET/PATCH/DELETE /api/v1/test-cases/{id}` |
| Executions | `POST /api/v1/test-cases/{id}/executions`, `GET /api/v1/test-cases/{id}/executions` |
| Bugs | `GET/POST /api/v1/bugs`, `GET/PATCH /api/v1/bugs/{id}` |
| AI drafts | `POST /api/v1/ai/test-cases`, `POST /api/v1/ai/bug-report`, `POST /api/v1/ai/transcript-analysis` |
| Reports | `GET /api/v1/reports/summary`, `GET /api/v1/reports/export.csv` |

All resource endpoints must scope reads, writes, counts, and exports to the authenticated user's workspace. Never rely on an ID being hard to guess as authorization.

## 5. Data model proposal

| Entity | Important fields and relationships |
|---|---|
| `Workspace` | ID, name, created timestamp |
| `User` | ID, workspace ID, normalized unique email, password hash, created timestamp |
| `TestCase` | ID, workspace ID, title, description, preconditions, ordered steps, expected result, priority, tags, archive state, timestamps |
| `TestExecution` | ID, workspace ID, test-case ID, result (`passed`, `failed`, `blocked`), optional note, tester ID, execution timestamp, historical test snapshot |
| `Bug` | ID, workspace ID, summary, description, reproduction steps, expected/actual result, severity, status, created/updated timestamps |

Use foreign keys and indexes for workspace ownership, normalized email, test-case-to-execution history, and common status/severity filters. Enable SQLite foreign-key enforcement on every connection. Store timestamps consistently in UTC.

The MVP stores only AI content the user explicitly saves as ordinary product records; transient transcript input is not written to the database. If saved analysis history is later added, define separate retention/deletion behavior before implementation.

### Deletion and history

Prefer archiving a test case over hard deletion once it has execution history. Preserve enough snapshot information for past runs to stay understandable. Finalize the specific implementation behavior before adding delete endpoints.

## 6. Authentication and security design

- Hash passwords using a maintained password-hashing implementation; choose concrete packages and safe parameters during implementation.
- Use backend-managed secure sessions or another documented authentication method; do not persist bearer credentials in browser local storage.
- If cookie-based authentication is chosen, set `HttpOnly`, `Secure` in deployed HTTPS environments, and an appropriate `SameSite` policy; implement CSRF defenses for state-changing requests.
- Normalize email addresses and return generic login errors that do not confirm account existence.
- Put secret keys, production database paths, and future provider API keys in environment configuration. Check in placeholders only; never commit live secrets.
- Validate lengths, formats, enums, and payload sizes on the server. Use parameterized SQL/ORM operations.
- Protect every record query and mutation with a workspace constraint; derive ownership from the authenticated identity rather than a trusted client-supplied workspace ID.
- Set CORS to explicitly configured origins. Add request rate limiting for authentication and, if introduced, paid AI operations.
- Do not log passwords, cookie/session values, API keys, or raw transcript contents. Return safe error details to the client.
- Treat transcript and user-generated text as untrusted data. Do not execute it, render it as unsanitized HTML, or treat it as system instructions.
- Keep mock AI in-process and deterministic; do not call an external service in mock mode.

## 7. AI provider and mock behavior

Configuration is read by the backend, for example `AI_PROVIDER=mock`. The initial supported value is `mock`; it must be the safe default. Unknown provider values or invalid provider configuration must produce a clear startup/request error, not silently return fake success.

The provider interface returns typed draft schemas:

- Test case: title, preconditions, ordered steps, expected result.
- Bug report: summary, reproduction steps, expected result, actual result, suggested severity.
- Transcript analysis: summary, intent, sentiment, unresolved concerns, suggested follow-up.

The mock provider should produce predictable, clearly labeled output suitable for UI development and tests. The UI must not imply that mock output is a genuine analysis. Future provider integration requires explicit user approval, configured credentials, timeout/error handling, privacy disclosure, and tests confirming that mock mode still makes no external calls.

## 8. Reporting and metric rules

- Dashboard and report calculations must be implemented in a shared backend service to prevent different screens from using inconsistent definitions.
- “Latest execution” means the most recent timestamp per active test case; ties must be resolved deterministically.
- A test case without an execution is “not run.”
- “Open bugs” means Open or In Progress.
- High-priority open-defect summaries include Critical and High severity only.
- CSV output uses explicit columns and stable date formatting. Escape cells that begin with spreadsheet formula characters such as `=`, `+`, `-`, or `@`.
- Exclude credentials and raw transcript text from exports.

## 9. Local development and deployment assumptions

- Local development uses a Vite frontend server and a FastAPI/Uvicorn backend with a local SQLite database.
- Keep local database files and environment files out of version control; provide an example environment file with non-secret placeholders.
- SQLite is suitable for the single-workspace local MVP. Reassess database choice, backup strategy, concurrency, and hosting before a multi-instance or production deployment.
- Deployment must use HTTPS, a production-grade server setup, restricted origins, persistent database storage, backups, and secret management.
- No production hosting target, public-registration policy, or AI provider is selected in this planning phase.

## 10. Proposed technology and quality tools

| Area | Proposed choice |
|---|---|
| UI | React, Vite, Tailwind CSS, TypeScript |
| API | Python, FastAPI, Pydantic, Uvicorn |
| Persistence | SQLite; use either `sqlite3` directly or a small ORM/migration layer after reviewing team familiarity |
| Backend tests | pytest and FastAPI's test client; add HTTPX if required by the selected FastAPI test setup |
| Frontend tests | Vitest and React Testing Library; browser-level tests can use Playwright if available and justified |
| Formatting/lint | Standard Python formatter/linter and ESLint/TypeScript checks, selected and pinned when scaffolding begins |

These are proposed implementation dependencies, not installed or added during phase 1.
