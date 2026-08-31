# Reusable Payload/Data Factories Belong in `data/<domain>.ts`, Never Inline in a Spec

A function that builds a valid-shaped request payload or test-data object with sane defaults (e.g. `buildRegisterPayload`, `buildLoginPayload` in `data/users.ts`) is a **data factory** — distinct from the endpoint-wrapper functions covered by `.claude/rules/no-direct-request-calls.md`. Data factories must live in `data/<domain>.ts`, grouped by domain the same way `api/<service>.ts` is, and be imported by every spec that needs them — never defined locally inside a `.spec.ts` file.

- **Why**: a factory defined inside one spec file is invisible to every other spec. The next spec that needs the same shape either duplicates the function (drifts out of sync over time) or imports it from another spec file (spec files importing from spec files is a smell — specs should only import from `api/`, `data/`, `support/`, and page objects).
- A new domain that doesn't have a `data/<domain>.ts` file yet → create one, don't pile it onto another domain's file or leave it inline.
- If a factory's fields depend on a type defined in `api/<domain>.ts` (e.g. `CreateProductPayload`), import that type into `data/<domain>.ts` — the dependency direction is `data/` → `api/` (for types), never the reverse.
- This applies retroactively too: if you notice an existing spec has grown its own local factory function instead of using (or creating) one in `data/`, that's a bug to fix, not a pattern to copy into the next spec.
