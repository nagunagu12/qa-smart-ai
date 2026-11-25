# QA Smart AI

A QA dashboard with AI-assisted test-case and bug-report drafting, built with React, Vite, Tailwind CSS, FastAPI, and SQLite. Dashboard metrics and activity remain illustrative sample data.

## Current status

The frontend dependency security update and dashboard verification are complete. Vite and Vitest were upgraded, the refreshed lockfile audits clean, the frontend tests and production build pass, and the Vite development server is running at **http://127.0.0.1:5173/**. The dashboard design was not changed.

The backend virtual environment has been created and its pinned dependencies installed. FastAPI is available at **http://127.0.0.1:8000/**, and `/health` returns `healthy`. The dashboard header confirms **API connected**. The AI Test Case Generator and AI Bug Report Generator are implemented and verified: backend tests (41) and frontend tests (12) pass, the production build succeeds, and `npm audit` reports zero vulnerabilities. The bug-report flow was also checked in the browser using mock generation, editing, and copy. Other sidebar pages remain placeholders.

The dashboard numbers and activity feed are explicitly marked as sample data. There is no login yet, so keep the API bound to loopback and do not expose it to a network.

## Technology

- Frontend: React, Vite, TypeScript, Tailwind CSS 4.
- Backend: FastAPI and Uvicorn.
- Initial AI: mock provider by default; no paid AI API or keys are used unless you explicitly configure one.
- Local development CORS defaults to the two Vite localhost origins, without credentials. Additional origins must be explicitly configured; non-local origins require HTTPS.

## Dependency security review — frontend complete

The installed tool versions are Node.js `v24.22.1` and npm `11.19.1`. The initial audit found four vulnerable packages. Vite was updated to `7.3.8`; Vitest was updated to `5.1.1` after checking that it supports Node 24 and Vite 7. This direct Vitest major update was installed explicitly—`npm audit fix --force` was not used. Its updated dependency tree resolves the `tinypool` and `@vitest/mocker` advisories.

| Package | Initial severity | Resolution |
|---|---|---|
| `vite` | High | Updated to `7.3.8` |
| `vitest` | Critical | Updated to `5.1.1` |
| `tinypool` | Critical | Resolved by the Vitest update |
| `@vitest/mocker` | Moderate | Resolved by the Vitest update |

The follow-up `npm audit` reports **zero vulnerabilities**. Three frontend tests pass, and TypeScript plus the production build succeed.

npm warned that `@tailwindcss/oxide@4.1.14` and `esbuild@0.28.2` have postinstall scripts not yet covered by `allowScripts`. I inspected both scripts: Oxide checks for its platform binary and only downloads one if absent; esbuild checks the platform binary version and integrity, and downloads only if the optional binary is missing. I did not approve or bypass these scripts. Their Windows platform packages were present, and the successful production build confirms the installed native binaries work. No script-policy setting was changed.

The production build reports a non-blocking JavaScript bundle-size advisory (about 612 kB before gzip). The dashboard was left unchanged.

## AI Test Case Generator

Open **AI Test Case Generator** in the sidebar. Enter a feature name, description/user story, acceptance criteria, testing type, and number of drafts (1–20). The default mock provider creates clearly labeled examples without making network calls. You can edit draft fields, regenerate, copy them, save them into local SQLite, or export them as CSV. CSV cells are quoted and spreadsheet-formula prefixes are neutralized.

Generated/saved cases begin with an empty **Actual Result** and **Not Executed** status. Those fields are protected until a future test-execution sprint.

The local API provides:

- `POST /api/v1/ai/test-cases/generate` — validates requirements and returns generated drafts.
- `POST /api/v1/test-cases/bulk` — saves the edited drafts into SQLite.
- `GET /api/v1/test-cases` — lists saved drafts.

## AI Bug Report Generator

Open **AI Bug Report Generator** in the sidebar. Enter a project and module, choose an environment, and describe the bug, reproduction steps, expected result, and actual result. Transcript/evidence, Load ID, and Campaign ID are optional. The generated report is clearly marked as mock when mock mode is active, and stays **Draft** and **Not Verified** until you review it. You can edit the report, change suggested severity/priority, copy it, regenerate, save it explicitly, and export it as a formula-safe CSV.

A report cannot be marked **Reproducible** unless evidence is included. Generated reports do not get saved automatically. Severity and priority are suggestions, not a confirmed diagnosis.

The local API provides:

- `POST /api/v1/ai/bug-reports/generate` — validates the issue details and creates a report draft.
- `POST /api/v1/bugs` — saves the reviewed bug report to SQLite.
- `GET /api/v1/bugs` — lists saved bug reports.

Real AI is optional. To configure an OpenAI-compatible service, set environment variables in the same PowerShell window used to start the backend. Do not put a real key in source control or send it to the frontend:

```powershell
$env:AI_PROVIDER = "openai-compatible"
$env:LLM_API_KEY = "<your provider key>"
$env:LLM_BASE_URL = "https://api.openai.com/v1"
$env:LLM_MODEL = "<provider model name>"
```

`AI_PROVIDER` defaults to `mock`. Real-provider mode requires `LLM_API_KEY` and `LLM_MODEL`; `LLM_BASE_URL` defaults to `https://api.openai.com/v1`. Remote endpoints must use HTTPS; plain HTTP is accepted only for localhost. When enabled, feature descriptions, acceptance criteria, bug details, and submitted evidence are sent to the configured provider and may incur provider costs. To return to mock mode, use a fresh terminal without those variables or set `$env:AI_PROVIDER = "mock"`.

SQLite is stored at `backend\qa_smart_ai.db` by default (ignored by Git). Set `QA_SMART_AI_DATABASE_PATH` to use a different local database file, especially for tests.

## Run locally on Windows

Open two PowerShell terminals in the project root.

### 1. Prepare and start the backend

Run once to create the isolated Python environment and install its packages:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Then start the API in the first terminal:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The health endpoint should be available at `http://127.0.0.1:8000/health`.

### 2. Install and start the frontend

In the second terminal:

```powershell
Set-Location frontend
npm install
npm run dev -- --host 127.0.0.1
```

Vite normally prints the local address `http://127.0.0.1:5173`. Open the URL printed in your terminal. The header should say **API connected** when the backend is also running.

`frontend\.env.example` documents the optional `VITE_API_BASE_URL` setting. `.env.example` documents the backend's local CORS origins. Do not put passwords or API keys in either example file.

## Run tests and build

From the project root, run backend tests:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend\tests
```

From the `frontend` directory, run frontend tests and a production build:

```powershell
npm test
npm run build
```

Run the frontend dependency audit from `frontend` with `npm audit`.

## Planning documents

- [PRD.md](./PRD.md) — product requirements and module acceptance criteria.
- [architecture.md](./architecture.md) — technical boundaries, security, and data design.
- [tasks.md](./tasks.md) — sprint breakdown and current implementation/verification progress.
- [test-plan.md](./test-plan.md) — acceptance, security, privacy, and quality checks.

## Current sprint verification

The AI Test Case Generator and AI Bug Report Generator sprints are verified locally. The current regression run reports **41 backend tests passed** and **12 frontend tests passed**. TypeScript and production build: **passed**. `npm audit`: **zero vulnerabilities**. FastAPI health check and live mock generation: **passed**. Known non-blocking warnings are the existing Starlette/AnyIO deprecation notice and Vite's large JavaScript chunk advisory. See [tasks.md](./tasks.md) and [test-plan.md](./test-plan.md) for details.
