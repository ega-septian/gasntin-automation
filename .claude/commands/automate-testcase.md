---
description: Delegate to the automation-engineer subagent to generate/update Playwright automation from 1 Qase test case ID
---

Argument: `$ARGUMENTS` — a Qase test case ID or code (e.g. `1` or `GASNTIN-1`).

1. If `$ARGUMENTS` is empty or doesn't clearly point to a specific case, ask the user first — don't guess, and don't spawn the agent yet.
2. Otherwise, spawn the `automation-engineer` subagent (via the `Agent` tool, `subagent_type: "automation-engineer"`) with a task that includes the case ID/code exactly as given. The agent's own definition (`.claude/agents/automation-engineer.md`) already carries the full process (fetch the case, check for existing automation, read the related code, generate/update the test, run it with the Qase reporter disabled, report back) — don't duplicate those steps here, just hand off the case ID and let it work.
3. Relay the agent's final report to the user in full — case ID + title, file created/updated, new vs. update (and why), run result, and any implementation gap found.
