---
description: Generate or update Playwright automation from 1 Qase test case ID, confirming before overwriting existing automation
---

You act as a **QA Automation Engineer** for the SHOP.CO project. Argument: `$ARGUMENTS` — a Qase test case ID or code (e.g. `1` or `GASNTIN-1`). Follow the full automation rules in `CLAUDE.md` sections **"Automation Rule: One Qase Test Case = One Playwright Test"** and **"`test.skip()` Is Forbidden in Automation"**. Run the following steps in order, don't skip any.

## 1. Normalize & validate the input

- Extract the plain case number from `$ARGUMENTS` (strip the `GASNTIN-` prefix if present). `qaseId()` in `support/qase.ts` only accepts a plain number, not the `GASNTIN-N` format.
- If `$ARGUMENTS` is empty or doesn't clearly point to a specific case, ask the user first. Don't guess.

## 2. Fetch the case from Qase

- `GET https://api.qase.io/v1/case/GASNTIN/{id}` — token & project code from the root `.env` (`QASE_API_TOKEN`, `QASE_PROJECT_CODE`), never print the token's contents to chat/log.
- If the case isn't found (404), report it to the user and stop.
- Record: title, description, preconditions/postconditions, all `steps` (action + expected_result, in order by `position`), and `tags`.
- Also fetch its suite (`GET /suite/GASNTIN/{suite_id}`) to know the suite name and whether it's a child of the `API` root suite (id 2) or `WEB` (id 3) — this determines the automation's layer.

## 3. Check whether this case has already been automated

- Grep all of `automation/tests/**/*.spec.ts` for a `qaseId(...)` usage with the same number as this case ID (including a comma-separated form like `qaseId('1,2')` if present).
- **If existing automation is found**: show the user the relevant file & test, compare the current Qase steps/expected results against the assertions already in the code (still in sync, or has it drifted). **You must confirm with the user** whether to update it (regenerate to match the latest case) or leave it as-is — never overwrite an existing test without explicit confirmation.
  - User picks **update** → continue to steps 4-6, but **edit the existing test**, don't create a duplicate test/file.
  - User picks **no** → report the case ID + the existing test's file location, then stop. Nothing is changed.
- **If nothing is found at all** → continue to steps 4-6, create a new test.

## 4. Read the related codebase

- **API** layer case: read the related backend handler in `backend/` to make sure the endpoint, status code, and response shape assumed by the Qase step are accurate against the actual implementation.
- **WEB** layer case: read the related Vue component in `frontend/src/` to make sure the button/label/placeholder text that will be used as a locator (`getByRole`, `getByText`, etc.) matches exactly what's actually rendered in the UI.
- If the requirement in the Qase case doesn't match the actual code (feature doesn't exist yet / different behavior), report it to the user and confirm how to treat it before continuing — never invent automation for something that doesn't exist in the code.

## 5. Decide the file location

- Look for a spec file that already represents this suite/feature (e.g. suite "Login" → `tests/api/login.spec.ts`). If a matching file exists, add the new test to the same `test.describe` there — don't create a new file for the same suite.
- If no file exists for this suite yet, create one following the existing naming pattern: `tests/api/<suite-slug>.spec.ts` for API, `tests/web/<suite-slug>.spec.ts` for WEB.
- If the case's layer is **WEB** and the `web` Playwright project doesn't exist yet in `playwright.config.ts` (currently only the `api` project exists) — **never silently add a new project to the config**. Report to the user that WEB automation hasn't been scaffolded yet, and ask whether to set it up now or defer it.

## 6. Generate/update the test

Follow all of these rules without exception:

- **1 Qase case = 1 Playwright `test()`.** All steps are executed in order and asserted inside ONE single test function. Never split it into multiple tests with the same `qaseId`.
- The test title **must match the Qase case title exactly (verbatim)**, **without** the `[GASNTIN-N]` prefix — see `CLAUDE.md` section "Test Title Must Match Qase Exactly; Step Comments Are Summarized".
- Mark it with `qaseId(<id>)` from `support/qase.ts` as the second argument to `test()`.
- **`test.skip()` is forbidden** for a missing precondition. If this case needs a new precondition not yet handled by `setup/global-setup.ts` (e.g. access to a service outside the backend API & database), **report it to the user first** — don't add your own skip logic, and never silently extend global setup without saying so.
- Reuse existing helpers before creating new ones:
  - `api/auth.ts` → `registerUser`, `loginUser`, `authHeaders`
  - `data/users.ts` → `uniqueEmail`, `VALID_PASSWORD`
  - `support/jwt.ts`, `support/db.ts`, `support/qase.ts`
  - If the case needs a new API domain action that doesn't exist yet (e.g. cart, checkout), create a new `api/<domain>.ts` file — don't pile it onto another domain's existing file.
- Map each Qase step to a `// Step N: <short summary>` comment above the assertion that proves that step's expected result — the summary may be paraphrased, don't copy-paste a literal payload/JSON example from the Qase `action` (see `CLAUDE.md` section "Test Title Must Match Qase Exactly; Step Comments Are Summarized"). The step order & intent must still match Qase.
- Code titles & comments are written in English, following the existing automation files' convention.

## 7. Run & verify

- Run the newly created/updated test: `npx playwright test --project=<api|web> -g "<test title>"`.
- If the test fails because a step's assumption was wrong (not because of an app bug), fix the test — don't weaken its assertions or skip it just to force it to pass.
- Don't automatically run it with the Qase reporter active (`QASE_API_TOKEN` set) unless the user explicitly asks for it to be synced — so generating a new test doesn't silently create a new Run in Qase every time it's invoked.

## 8. Report the results

Summarize for the user: case ID + title, the file created/updated, whether this is a new test or an update to an existing one (and why, if an update), the run result (pass/fail), and any requirement-vs-implementation gap found.
