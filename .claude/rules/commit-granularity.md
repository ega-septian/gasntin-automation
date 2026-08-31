# Commit Granularity: Separate Commits per Logical Change

When committing and pushing accumulated changes, split them into separate, logically-scoped commits rather than bundling everything into one — history stays easy to review, revert, and `git bisect` later.

- Each commit represents **one coherent unit of change** (one refactor, one bug fix, one feature, one policy/rule update). Never mix unrelated concerns (e.g., a structural refactor + a behavior fix + a docs/rule update) into a single commit just because they happened in the same session.
- Before committing, review `git status`/`git diff` and group files by what they actually belong to — not by "everything that changed during this conversation."
- If a single file mixes unrelated hunks (e.g., an unrelated fix alongside a comment cleanup), split it further (`git add -p` / staging by hunk) rather than committing it as one blob, or explicitly flag the mixing to the user instead of silently bundling.
- When the intended split isn't obvious, state the proposed commit breakdown to the user before committing, so grouping can be adjusted before it's written to history.
