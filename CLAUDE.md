# CLAUDE.md

## PRD Writing Rules

Whenever creating or updating a PRD document in this project, use the following template (following the team's Confluence format, e.g. page ID 360465 "PRD - SauceDemo Login"). The main body of the document (from the header down to the `Total requirements:` line) must follow this structure exactly, with no extra sections in between, so it can be copy-pasted straight into Confluence without reformatting:

```markdown
# Product Requirements Document (PRD)

## <Feature Name>

|  |  |
| --- | --- |
| **Document** | PRD-<CODE>-v1.0 |
| **Status** | <Draft / Approved for Development / etc.> |
| **Target Application** | <application name/url> |
| **Feature** | <feature name> |
| **Date** | <date> |

---

## 1. Background

<background/problem paragraph>

## 2. Objectives

* <objective 1>
* <objective 2>

## 3. Scope

**In scope:** <short list>

**Out of scope:** <short list>

---

## 4. Functional Requirements

* <requirement, full sentence "The system must ...", testable>

## 5. Non-Functional Requirements

* <requirement, full sentence>

---

_Total requirements: X functional + Y non-functional. <optional closing note>_
```

Additional rules:

- **Language** follows the language of the request/source document (Indonesian or English) — don't mix.
- Every requirement (functional & non-functional) is written as a **complete, testable sentence**, not a short feature bullet, following the pattern "The system must ...".
- Don't insert other sections (user stories, technical specs, acceptance criteria, risks, etc.) inside the template's main body. If that info is relevant and worth documenting, put it in a separate **Appendix** below the final `---` line, with a heading that clearly states it's "outside the template's main body / not meant to be copied into Confluence".
- Save new PRD files at `docs/PRD-<feature-name>.md`.
- If there's an original PRD on Confluence being used as the reference, mention its page ID/title in the closing note or Appendix, not in the main body.

## QA Persona & Test Case Generation Rules

Whenever asked to create/generate test cases for this project (SHOP.CO), act as a **Senior QA Engineer**: thorough, skeptical of assumptions, and always verify requirement claims against the actual code (not just trusting the PRD text).

Follow this process every time, without skipping steps:

1. **Analyze the requirement from Confluence + the codebase (FE & BE)**
   - Pull the relevant requirement from the Confluence page (never generate from memory/assumption — fetch it fresh, since the document can change).
   - Read the related implementation code in `frontend/` and `backend/` for that requirement (handler, model, Vue component, store, router guard, etc.).
   - If there's a mismatch between the Confluence requirement and the actual code (feature doesn't exist yet, different behavior), record it as a finding and ask the user how the test case should be handled (API-only test, mark as a known gap, etc.) — never silently invent a test case for something that doesn't exist in the code.
   - Distinguish **API** test cases (directly against backend endpoints) from **WEB** ones (through the UI/browser) — place them in the matching suite (see suite structure below). If a requirement is only implemented on one layer so far (e.g. registration has an API but no UI yet), only create test cases for the layer that actually exists — don't create WEB test cases for UI that doesn't exist.

2. **Check for similar/duplicate existing test cases in Qase before creating new ones**
   - Before creating a new test case, list the existing test cases in the relevant suite via the Qase API (`GET /case/{code}?suite_id=...`) and read their title/steps/tags.
   - Compare semantically (not exact string match) against the test case you're about to create.
   - Honest note on the limitation: this comparison is done by reading and reasoning about the test case content, not an automated similarity/embedding algorithm — accurate enough at a scale of tens-to-hundreds of test cases, but doesn't scale to thousands.

3. **Decide: create new, enhance existing, or skip (already sufficient)**
   - If you find a test case that's **similar but incomplete** (e.g. missing steps, missing assertions, doesn't cover an edge case from the requirement) → **enhance** that test case (`PATCH /case/{code}/{id}`), don't create a duplicate.
   - If you find a test case that's **already identical/already covers the requirement** → report to the user that it already exists, don't recreate it.
   - If nothing relevant exists yet → create a new test case.
   - Always report the decision made and why (case ID enhanced/skipped/newly created) back to the user.

### Qase Suite Structure (project `GASNTIN`)

```
API   (top-level, id 2)
└── <Feature Name>   e.g. Registration, Login, Session & Page Protection, Logout, Security & Non-Functional
WEB   (top-level, id 3)
└── <Feature Name>   only created if the UI actually exists in the frontend
```

- New suites for a feature are created as children of `API` or `WEB` (using `parent_id`), never as a new top-level suite.
- Tag every test case with the related requirement ID (e.g. `FR-1`, `NFR-2`) for clear traceability to the PRD, plus a layer tag (`API`/`WEB`) and a type tag (`Positive`/`Negative`).

### Automation Rule: One Qase Test Case = One Playwright Test

If Qase already has **1 test case** with several steps & expected results, its automation must be written as **a single, complete Playwright `test()`** — execute those steps in their original order and assert each step's expected result inside the same function.

**Never** split 1 Qase case into multiple separate Playwright `test()`s that each cover part of the steps and are tagged with the same `qaseId(...)` (a duplicate ID across different tests). Reason: Qase aggregates all results sharing the same `case_id` within one run into **a single status** (proven via the run API's `stats.total`, which stayed `1` even with 3 separate result submissions for the same `case_id`). If one step fails while the others pass, the Qase Run dashboard can't show which step failed — it just shows one ambiguous status for that case.

If a step needs a precondition that isn't always available in the environment (e.g. `DATABASE_URL` for a direct DB query), **don't** solve it with `test.skip()` — see the "`test.skip()` Is Forbidden" rule below. Make sure that precondition is available from the start via a fail-fast global setup.

The one allowed exception to "1 case = 1 test":
- **Data-driven tests** (a loop over an array of payloads, e.g. several input-validation scenarios) — 1 `test()` per iteration is allowed **only if** each iteration genuinely represents a **different** Qase case in the suite (each with its own unique `qaseId`), not a split of the same case.

If, while reading the requirement/steps, they feel **logically independent** of each other (not just steps of the same scenario) — that's a signal to split the case in Qase itself first (create a new case via the API), discussed with the user first. Don't silently split it at the automation level with the same `qaseId`.

### Test Title Must Match Qase Exactly; Step Comments Are Summarized

- **The Playwright `test()` title must match the Qase case `title` exactly (verbatim)** — not summarized, not reworded, not padded with extras like "returns 200" or "is rejected with 400". If the Qase case title changes, the test title must be updated to match exactly again.
- **Every Qase step must be mapped to a `// Step N: <short summary>` comment** right above the code that executes/asserts that step — one short sentence summarizing that step's intent.
- The summary **may be paraphrased**; it doesn't need to quote the Qase `action` verbatim. **Never** copy-paste a literal payload/JSON example from the `action` into the comment (e.g. `{"email": "<registered_email>", "password": "<correct_password>"}`) — that makes the comment noisy and easy to go stale if the example data changes in Qase without the step's intent changing. What must stay accurate: the step number must match Qase's order, and the step's meaning/intent must not change from the original.
- If a step's expected_result contains a claim that **can't be verified** by the available automation (e.g. "no database lookup is attempted" in a black-box API test with no query-log access), assert only the verifiable part and report the uncovered part to the user — never silently skip the assertion or invent a way to verify it.
- The goal: the title stays 100% traceable to Qase without needing to open Qase to know which case is meant, while step comments stay readable and don't get long-winded/noisy.

### `test.skip()` Is Forbidden in Automation (API and WEB alike)

Automation — both the **API** and **WEB** suites — **must never** use `test.skip()` or any conditional-skip mechanism to bypass a test/case because an environment precondition isn't met (e.g. `DATABASE_URL` is empty, credentials are missing, a feature flag is off, etc.).

- A suite's required preconditions must be guaranteed available **from the start** via a fail-fast *global setup* with a clear message (the same pattern as the `GET /health` check in `setup/global-setup.ts`) — if that precondition is missing, **the entire suite must stop with an error explaining what's missing and how to fix it**, instead of some tests being reported as "skipped".
- Reason: a "skipped" test is easy to overlook (treated as neutrally as "just hasn't run yet"), whereas if the cause is a missing required precondition, that must show up as a clear setup failure, not a gray status in the report.
- This also applies to the **WEB** suite going forward: preconditions like test accounts, seed data, or a specific environment must be prepared/validated in setup, not used as a reason for a per-test `test.skip()`.

### Never Call `request.<method>()` Directly in a Spec — Always Through `api/<service>.ts`

Test specs (`tests/**/*.spec.ts`, API or WEB) **must never** call `request.get/post/put/patch/delete(...)` (or the equivalent HTTP-client method on the WEB layer) directly with the endpoint path written in the spec file. Every endpoint must be wrapped in a named function in `api/<service>.ts`, grouped by service/domain (e.g. `api/auth.ts`, later `api/cart.ts`) — the spec just calls that function.

- A function for an endpoint that **is itself the subject of the test** (e.g. an endpoint whose response is directly asserted) should just send the request and return the raw response (`APIResponse`), **without** asserting/throwing inside it — so the spec stays free to write its own assertions (status code, body, etc.) against that response.
- **Precondition** functions (e.g. `registerUser`, `loginUser` in `api/auth.ts`) may assert + throw internally (fail fast if setup fails), but must be built **on top of** that same raw request function — never duplicate the literal endpoint path in two places.
- A new endpoint for a domain that doesn't have a file in `api/` yet → create a new `api/<domain>.ts` file, don't pile it onto another domain's file.
- The goal: one source of truth per endpoint (path + method). If the endpoint URL changes, update it in one place, not via a grep-replace across every spec.

### Step Writing Language (WEB/UI test cases only)

**WEB** suite test cases are read and executed manually by QA who doesn't (need to) read the code. Their steps **must** be written in visually/functionally descriptive language, not implementation language:

- **Never** mention code file/component names (e.g. `LoginView.vue`, `DashboardView.vue`).
- **Never** mention technical identifiers: `data-testid`, CSS classes, Vue Router route names, variable/store names (e.g. `auth.isAuthenticated`), JSON field names.
- **Must** use user-visible references: the exact button text (e.g. the "Masuk" button), field labels, placeholders, the message/error text shown, visual element descriptions (e.g. "the eye icon at the right of the password field").
- **Never** use a page's title/heading as the marker for "open page X" (e.g. don't write `Open the Login page (titled "MASUK KE AKUN KAMU")`). **Also never** write a bare URL without the page's name (e.g. don't just write `Open {env}/login.`). Required format for navigation/open-page instructions: state the **page name** (in QA-friendly language, not the literal title/heading) followed by the **URL** with an environment placeholder, format `{env}/<path>` — pattern: `Open <Page Name> page, URL: {env}/<path>.` Example: `Open the Login page, URL: {env}/login.` / `Open the Dashboard page, URL: {env}/dashboard.` Visual-text references (button/label/placeholder) are still used for actions *within* the page (clicking, filling a field), not for opening the page itself.
- Reading the frontend code is **still required** to make sure the text/labels used in a step match the UI exactly (so QA doesn't hunt for the wrong element during manual execution) — this restriction is about *how steps are worded*, not about *where the analysis comes from*. Reading the code still happens; the result just isn't written verbatim into the test case.

This rule does **not** apply to the **API** suite — API test cases naturally need technical detail (endpoint, method, JSON body, status code, header) because that's literally what's being tested.

### Test Case Writing Language

- All test case content (title, description, preconditions, postconditions, steps) in Qase is written in **English** — unlike the PRD rule, which follows the source language.
- **Except**: text that appears literally in the app's UI (button labels, placeholders, error messages, link text) is still quoted **exactly as-is** even if the app is in Indonesian (e.g. the `"Masuk"` button, the error message `"email atau password salah"`). The surrounding narrative/instructions stay in English — never translate text that QA has to match on screen, since that would make the test case invalid at execution time.

### Credentials & Access

- The Qase API token and project code live in the root `.env` (`QASE_API_TOKEN`, `QASE_PROJECT_CODE`) — already gitignored, never commit it or print its contents in chat.
- Project code: `GASNTIN`. API base URL: `https://api.qase.io/v1`.
