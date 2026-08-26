# SHOP.CO Automation

Playwright tests generated from the Qase test cases in project `GASNTIN`, cross-checked
against the actual backend and frontend code.

Each test name carries its Qase case ID (e.g. `[GASNTIN-3]`) so a failure points straight
back to the test case, and from there to the PRD requirement it covers.

## Setup

```bash
npm install
npx playwright install
cp .env.example .env
```

## Running

The app under test (backend + frontend) lives in a separate repo, `gastinweb`, cloned
as a sibling directory. The backend needs PostgreSQL and its own configured `.env`:

```bash
cd ../gastinweb/backend && go run ./cmd/api   # listens on :8081
```

The WEB suite also needs the frontend running:

```bash
cd ../gastinweb/frontend && npm run dev       # listens on :5173
```

Then, from this repo:

```bash
npm run test:api      # API suite only
npm test              # everything
npm run report        # open the HTML report
```

`globalSetup` pings `/health` and fails with a readable message if the backend is down,
rather than letting every test die on a connection error.

## Test data

Each test seeds its own user through `POST /api/auth/register` with a random email, so
the suite runs fully parallel and needs no database credentials or fixture data.

`DATABASE_URL` is optional and enables exactly one extra assertion: that the stored
password is a bcrypt hash rather than plain text. The API never returns `password_hash`,
so there is no other way to verify it. Without the variable that single test reports as
skipped — never silently dropped.

## Relationship to Qase

These tests were generated from the Qase cases; they do not stay in sync automatically.
When a case changes in Qase, the corresponding spec has to be regenerated or edited by hand.
