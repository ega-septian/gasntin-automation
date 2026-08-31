# Every Test Case Must Set Priority and Severity — Never Leave the Default

When creating a case via `POST /case/{code}`, always include `priority` and `severity` explicitly in the payload — never leave them unset. An unset field silently defaults to `0` (priority) / `4` (severity), which reads as "nobody decided" rather than an intentional call, and is easy to miss since the API doesn't warn about it.

- **Priority** — how important it is that this gets covered/run: `1` = High (core/primary flow; breaking it blocks the main feature), `2` = Medium (secondary flow, validation/edge case, supporting data), `3` = Low (cosmetic, a redundant alternate path, a convenience feature).
- **Severity** — how bad it is if the tested behavior turns out broken: `1` = Blocker (breaks the whole app/site, not just one feature — rare), `2` = Critical (the core feature is entirely unusable), `3` = Major (degraded or wrong but the feature still basically works), `4` = Minor (cosmetic, non-blocking), `5` = Trivial (decorative/marketing content, no functional impact).
- Match the scale already established in the existing suites (e.g. the Login cases, case IDs 2-16) rather than inventing a new one — skim a few existing cases first if unsure how a similar case was rated.
- Decide **per case**, based on that case's actual content — don't copy the same pair onto every case in a batch. If a whole batch ends up sharing the exact same priority/severity, that's a signal it was defaulted/copy-pasted rather than actually judged; re-check before submitting.
