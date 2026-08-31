## Summary

<!-- What changed and why, in 1-3 sentences. -->

## Related Qase Case(s)

<!-- e.g. GASNTIN-26, GASNTIN-27 — or "N/A" for CI/tooling/docs-only changes. -->

## Changes

<!-- Bullet list of what changed. -->

-

## Testing / Verification

<!-- How this was verified: test run output, lint/typecheck result, manual check, etc. -->

## Checklist

- [ ] `npm run typecheck` and `npm run format:check` pass locally
- [ ] New/updated Playwright tests carry `qaseId(...)` + `tag: ['@smoke'|'@regression', '@<feature>']` matching Qase
- [ ] No `test.skip()` used
- [ ] Endpoint calls go through `api/<service>.ts`, never inline `request.<method>()` in a spec
- [ ] Reusable payloads/data live in `data/<domain>.ts`, not inline in a spec
- [ ] `api/`, `data/`, `support/`, `setup/` imports use the `@` alias, not relative paths
