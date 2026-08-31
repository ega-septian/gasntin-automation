# Automation Rule: One Qase Test Case = One Playwright Test

If Qase already has **1 test case** with several steps & expected results, its automation must be written as **a single, complete Playwright `test()`** — execute those steps in their original order and assert each step's expected result inside the same function.

**Never** split 1 Qase case into multiple separate Playwright `test()`s that each cover part of the steps and are tagged with the same `qaseId(...)` (a duplicate ID across different tests). Reason: Qase aggregates all results sharing the same `case_id` within one run into **a single status** (proven via the run API's `stats.total`, which stayed `1` even with 3 separate result submissions for the same `case_id`). If one step fails while the others pass, the Qase Run dashboard can't show which step failed — it just shows one ambiguous status for that case.

If a step needs a precondition that isn't always available in the environment (e.g. `DATABASE_URL` for a direct DB query), **don't** solve it with `test.skip()` — see `.claude/rules/test-skip-forbidden.md`. Make sure that precondition is available from the start via a fail-fast global setup.

The one allowed exception to "1 case = 1 test":
- **Data-driven tests** (a loop over an array of payloads, e.g. several input-validation scenarios) — 1 `test()` per iteration is allowed **only if** each iteration genuinely represents a **different** Qase case in the suite (each with its own unique `qaseId`), not a split of the same case.

If, while reading the requirement/steps, they feel **logically independent** of each other (not just steps of the same scenario) — that's a signal to split the case in Qase itself first (create a new case via the API), discussed with the user first. Don't silently split it at the automation level with the same `qaseId`.
