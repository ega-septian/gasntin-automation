# Every Test Case Gets Exactly One of `smoke` / `regression` — In Both Qase and Playwright

Every Qase test case must carry **exactly one** of the `smoke` or `regression` tags, alongside its other tags (layer, requirement ID, positive/negative) — never both, never neither. Same discipline as priority/severity (`.claude/rules/priority-and-severity.md`): an untagged case reads as "nobody decided," not as a deliberate default.

- **`smoke`**: the single core happy-path case proving a major feature's primary flow works end-to-end. Deliberately small and stable — a handful of cases across the whole suite, not "anything reasonably important." Adding a case here should be rare and deliberate.
- **`regression`**: everything else — secondary flows, validation/edge cases, negative cases, UI details. This is the default; when in doubt, tag `regression`.

## Setting the tag in Qase

`PATCH /case/{code}/{id}`'s `tags` field **replaces the entire tag list** — it does not append. Always fetch the case's current `tags` first, add `smoke`/`regression` to that array, and PATCH the full list back. Sending only the new tag silently wipes every other tag (layer, requirement ID, etc.) off the case.

## Setting the tag in Playwright

Combine Playwright's native `tag` option with `qaseId(...)` in the same options object — both are plain properties of the same `TestDetails` argument:

```ts
test('Successful login with valid email & password', { ...qaseId(2), tag: '@smoke' }, async ({ request }) => {
  ...
})
```

When the case also carries a feature tag (see `.claude/rules/qase-suite-structure.md`), `tag` becomes an array combining both:

```ts
test(
  "POST /orders succeeds when a requested item's quantity exactly equals its current available stock",
  { ...qaseId(53), tag: ['@smoke', '@checkout'] },
  async ({ request }) => { ... }
)
```

- The tag is always `@smoke` or `@regression` (Playwright's own convention prefixes tags with `@`) — matching the Qase tag it corresponds to (`smoke`/`regression`, no `@` there, since Qase tags are plain strings).
- This lets CI (or a local run) filter by test level independently of Qase: `npx playwright test --grep @smoke`.
- A case with no automation yet only needs the Qase-side tag; there's no `test()` to attach `tag` to until `automation-engineer` builds one — at which point the tag is added then, matching whatever the case is already tagged in Qase.
- When `/automate-testcase` builds a new test from a Qase case, it must read the case's `smoke`/`regression` tag from Qase and carry it over into the `test()` call — never invent a level on its own, and never leave it off.
