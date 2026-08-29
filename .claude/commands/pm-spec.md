---
description: Delegate to the product-manager subagent to write an independent acceptance-criteria spec for a feature
---

Argument: `$ARGUMENTS` — a feature name or a short description of what to spec out.

1. If `$ARGUMENTS` doesn't clearly point to a specific feature, ask the user first before continuing.
2. Spawn the `product-manager` subagent (`subagent_type: "product-manager"`) with a task naming the feature and, if you have it, the user's own original request(s) for it (quote them — the agent should not have to guess what was asked for). Its own definition (`.claude/agents/product-manager.md`) carries the full process (acceptance criteria format, provenance notes, when to ask the user, where to save the spec) — don't duplicate those steps here.
3. Relay the agent's spec to the user in full, and mention where it was saved (`docs/spec-<feature-slug>.md`) so it can be reused later by `/generate-testcase`.
