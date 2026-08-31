# Every PR Uses the Standard Template — Never a Freeform Description

`.github/pull_request_template.md` is the repo's standing PR template. GitHub auto-populates it into every new PR's description box; when opening a PR (via `gh pr create` or the web UI), fill in its sections rather than replacing it with a freeform body.

- **Summary** — what changed and why, 1-3 sentences.
- **Related Qase Case(s)** — the case ID(s) this PR automates/updates (e.g. `GASNTIN-26`), or `N/A` for CI/tooling/docs-only changes.
- **Changes** — bullet list of what changed.
- **Testing / Verification** — how it was verified: test run output, `typecheck`/`format:check` result, manual check, etc.
- **Checklist** — the project's own automation rules (tags, no `test.skip()`, `api/`/`data/` conventions, `@` aliases), checked off per PR so a reviewer (human or the automated Code Review workflow) doesn't have to re-derive them from the diff alone.

The body stays a clean, professional description of the change itself — never a narration of the chat/session that produced it (no "the user asked me to...", no session play-by-play). This matches how commit messages are already written in this repo.

If a PR's content doesn't fit a section (e.g. no related Qase case), leave the heading and write `N/A` — don't delete sections just because they're empty for that PR. If the template itself needs a new section going forward, edit `.github/pull_request_template.md` and this rule file together, the same way an added test convention gets a matching Checklist line.
