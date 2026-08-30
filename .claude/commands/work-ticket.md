---
description: Pick up a Jira ticket, move it to In Progress, delegate the fix to backend-engineer or frontend-engineer based on its [FE]/[BE] title tag, push the fix, and move it to In Review
---

Argument: `$ARGUMENTS` — a Jira issue key (e.g. `KAN-1`).

Jira: cloudId `septianega-18.atlassian.net`, project `KAN`. Transition IDs on this board: `21` = In Progress, `31` = In Review (confirm with `getTransitionsForJiraIssue` if this project's workflow ever changes).

Subagents (`backend-engineer`, `frontend-engineer`) cannot reach Jira or Chrome tools themselves (confirmed platform limitation, documented in their own files) — every Jira read/write and any live-browser check happens here, in the orchestrator, never inside the subagent.

1. If `$ARGUMENTS` doesn't clearly name one ticket, ask the user first.
2. Fetch the ticket (`getJiraIssue`) — title, description, current status.
   - If it's not currently "To Do", stop and confirm with the user before proceeding — don't silently redo a ticket that's already In Progress/In Review/Done under someone else's work.
3. Transition it to **In Progress** (transition id `21`).
4. Read the title's `[FE]` or `[BE]` prefix to pick the subagent (`frontend-engineer` for `[FE]`, `backend-engineer` for `[BE]`). If neither prefix is present, ask the user which applies rather than guessing.
5. Spawn that subagent with the ticket's key, title, and full description verbatim as its task, plus a reminder that the codebase to fix is `../gastinweb` (relative to this repo) — its own file already carries the rest of its process.
6. When it reports back:
   - Review the actual diff yourself (`git -C ../gastinweb diff`) — don't just trust the subagent's summary.
   - Independently confirm the build is clean (`go build ./...` for backend, `npm run build` for frontend) before proceeding — re-verify, don't re-trust.
   - If the subagent reported it couldn't complete the fix, or you find its diff doesn't actually address the ticket, **stop here**: leave the ticket in In Progress, report the problem to the user, and don't transition further or fabricate success.
7. If verified: in `../gastinweb`, create a new branch off up-to-date `main` named `fix/<TICKET-KEY>-<short-slug>`, commit the change (message references the ticket key and summarizes the fix), and push it. Note the branch's compare/new-PR URL from git's push output (or construct it: `https://github.com/ega-septian/web-testing/compare/main...<branch>`) — don't attempt to create the PR itself via API unless you've confirmed you have working credentials to do so; handing the user the link to open it themselves is the safe default.
8. Add a Jira comment on the ticket (`addCommentToJiraIssue`) summarizing the fix and linking the branch/PR URL.
9. Transition the ticket to **In Review** (transition id `31`).
10. Report back to the user: ticket key + title, what was actually wrong and what changed, branch/PR link, and the ticket's new Jira status.
