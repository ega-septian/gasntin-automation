# Playwright's Backoff-Polling Assertions Can Miss Narrow Transient States

**Symptom**: a UI state is real and briefly present, but a normal Playwright web-first assertion (`expect(locator).toBeEnabled()`, `.toHaveText()`, etc.) still times out and reports "element(s) not found" or a stale value — **every single run**, not intermittently. Bumping the timeout doesn't help.

**Root cause**: Playwright's default assertion polling backs off — it checks fast at first, then widens the gap between checks up to roughly 1 second. If the state you're waiting for exists for less time than that gap (e.g., a deliberate ~300ms UI pause before navigating away), the poll can land on either side of the window every time and simply never sample it. This is deterministic, not flaky — the mocked/real timings are consistent run to run, so it fails 100% of the time in a way that looks exactly like a real app bug. (Discovered on WEB Login case 11: `toBeEnabled()`/`toHaveText('Masuk')` failed 100% of the time for a real ~270ms re-enabled window before the app's own deliberate navigation delay — root-caused by comparing a direct-DOM-poll probe against the assertion, plus a Playwright trace, before concluding the app itself was correct.)

**Before assuming it's an app bug**, confirm the window is actually real and measure it:
1. Add a temporary probe: a `page.evaluate` loop on a short fixed interval (20-50ms) for a couple of seconds after the triggering action, logging state + timestamp. If this catches the state and the assertion still doesn't, it's a polling-interval mismatch, not a timing/app bug.
2. Cross-check against a Playwright trace from a failed run: unzip `trace.zip`, the `*-trace.trace` and `*-trace.network` files are JSONL with wall-clock/monotonic timestamps — correlate the window's start/end against network request timings to confirm its actual width and whether it matches the intended delay.

**Fix**: replace the backoff-polled assertion with a fixed, tight-interval wait for that specific check — `page.waitForFunction(fn, { polling: 50, timeout })` (or `expect.poll(fn, { intervals: [50], timeout })`) instead of:
- increasing the assertion's `timeout` (gives more total polls across a longer wait, not a narrower gap between them — doesn't help), or
- padding the app's own delay to make the window easier to catch (adds real, unjustified latency for every real user just to accommodate a test's polling strategy).
