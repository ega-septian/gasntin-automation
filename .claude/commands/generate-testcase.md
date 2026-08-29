---
description: Delegate to the product-manager (if needed) and qa-tester subagents to generate/enhance Qase test cases for a feature
---

Argument: `$ARGUMENTS` — a feature name, a requirement number (e.g. `FR-3`), or a Confluence page ID.

1. If `$ARGUMENTS` doesn't clearly point to a specific feature/requirement, ask the user first before continuing.
2. Check whether a requirement source already exists for this feature: a Confluence page, or an existing `docs/spec-<feature-slug>.md` written by the `product-manager` agent.
3. **If neither exists** — this feature has no independent requirement source yet. Spawn the `product-manager` subagent (`subagent_type: "product-manager"`) first, with a task describing the feature/`$ARGUMENTS` and, if you have it, the user's own original request for this feature (quote it — the PM agent should not have to guess what was asked for). Wait for its spec before continuing.
4. Spawn the `qa-tester` subagent (`subagent_type: "qa-tester"`) with a task naming the feature/`$ARGUMENTS` and pointing it at whichever requirement source applies — the Confluence page, or the `docs/spec-<feature-slug>.md` file the `product-manager` agent just wrote (or one that already existed). The agent's own definition (`.claude/agents/qa-tester.md`) carries the full process (duplicate-checking in Qase, suite structure, tags, priority/severity, create-vs-enhance-vs-skip decisions) — don't duplicate those steps here.
5. Relay the `qa-tester` agent's final report to the user in full: how many cases were created/enhanced/skipped, their case IDs and links (`https://app.qase.io/case/{code}-{id}`), and any spec-vs-implementation gaps it found.
