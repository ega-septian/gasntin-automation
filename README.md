# SHOP.CO Automation

Playwright tests generated from the Qase test cases in project `GASNTIN`, cross-checked
against the actual backend and frontend code.

Each test name carries its Qase case ID (e.g. `[GASNTIN-3]`) so a failure points straight
back to the test case, and from there to the PRD requirement it covers.

## Setup

```bash
cd automation
npm install
npx playwright install
cp .env.example .env
```

## Running

The backend must be running first — it needs PostgreSQL and a configured
`backend/.env`:

```bash
cd backend && go run ./cmd/api    # listens on :8081
```

Then:

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

## Coverage

| Qase case | Covered |
|---|---|
| GASNTIN-1 | Registration: 201 + token shape, auto-login, bcrypt hash (needs `DATABASE_URL`) |
| GASNTIN-2 | Login success + token usable against `/api/auth/me` |
| GASNTIN-3 | Wrong password → generic 401 |
| GASNTIN-4 | Unregistered email → response byte-identical to wrong password |
| GASNTIN-5/6/7 | Empty email, empty password, malformed email → 400 |
| GASNTIN-8 | JWT alg/claims/24h expiry, plus tampered-token rejection |

### Not covered by automation

- `GASNTIN-5`'s "no user lookup is attempted against the database" — not observable
  from outside the process. The externally verifiable half (400 + no token) is covered.

## Relationship to Qase

These tests were generated from the Qase cases; they do not stay in sync automatically.
When a case changes in Qase, the corresponding spec has to be regenerated or edited by hand.
