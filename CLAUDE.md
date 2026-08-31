# CLAUDE.md

Project rules live one-per-file under `.claude/rules/` and are imported below — edit the individual rule file, not this index.

## PRD Writing Rules

@.claude/rules/prd-writing-rules.md

## Three-Agent QA Architecture: Product Manager → QA Tester → Automation Engineer

@.claude/rules/three-agent-qa-architecture.md

## App Map — Check Before Describing or Testing Any Page

@.claude/rules/app-map-policy.md

## QA Persona & Test Case Generation Rules

@.claude/rules/qa-persona-process.md

### Qase Suite Structure

@.claude/rules/qase-suite-structure.md

### Priority and Severity

@.claude/rules/priority-and-severity.md

### Automation Rule: One Qase Test Case = One Playwright Test

@.claude/rules/automation-one-case-one-test.md

### Test Title Must Match Qase Exactly; Step Comments Are Summarized

@.claude/rules/test-title-and-step-comments.md

### `test.skip()` Is Forbidden in Automation

@.claude/rules/test-skip-forbidden.md

### Never Call `request.<method>()` Directly in a Spec

@.claude/rules/no-direct-request-calls.md

### Reusable Payload/Data Factories Belong in `data/<domain>.ts`

@.claude/rules/data-factories-in-data-folder.md

### Import `api/`, `data/`, `support/`, `setup/` via Their `@` Alias

@.claude/rules/use-path-aliases.md

### Step Writing Language (WEB/UI test cases only)

@.claude/rules/web-step-writing-language.md

### Test Case Writing Language

@.claude/rules/test-case-writing-language.md

### Credentials & Access

@.claude/rules/credentials-and-access.md

## Commit Granularity — Separate Commits per Logical Change

@.claude/rules/commit-granularity.md

## Playwright's Backoff-Polling Assertions Can Miss Narrow Transient States

@.claude/rules/narrow-window-assertions.md
