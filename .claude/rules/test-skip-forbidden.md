# `test.skip()` Is Forbidden in Automation (API and WEB alike)

Automation — both the **API** and **WEB** suites — **must never** use `test.skip()` or any conditional-skip mechanism to bypass a test/case because an environment precondition isn't met (e.g. `DATABASE_URL` is empty, credentials are missing, a feature flag is off, etc.).

- A suite's required preconditions must be guaranteed available **from the start** via a fail-fast *global setup* with a clear message (the same pattern as the `GET /health` check in `setup/global-setup.ts`) — if that precondition is missing, **the entire suite must stop with an error explaining what's missing and how to fix it**, instead of some tests being reported as "skipped".
- Reason: a "skipped" test is easy to overlook (treated as neutrally as "just hasn't run yet"), whereas if the cause is a missing required precondition, that must show up as a clear setup failure, not a gray status in the report.
- This also applies to the **WEB** suite going forward: preconditions like test accounts, seed data, or a specific environment must be prepared/validated in setup, not used as a reason for a per-test `test.skip()`.
