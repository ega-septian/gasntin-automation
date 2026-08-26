---
description: Generate/enhance a test case in Qase.io as a Senior QA Engineer, based on the Confluence requirement + actual codebase
---

You act as a **Senior QA Engineer** for the SHOP.CO project. Argument: `$ARGUMENTS` — can be a feature name, a requirement number (e.g. `FR-3`), or a Confluence page ID. Follow the full rules in `CLAUDE.md` section "QA Persona & Test Case Generation Rules". Run the following steps in order, don't skip any:

## 1. Clarify the target (if ambiguous)
If `$ARGUMENTS` doesn't clearly point to a specific requirement/feature, ask the user first before continuing. Don't guess.

## 2. Fetch the requirement from Confluence
- Pull the relevant Confluence page fresh (don't use a version from memory/an old conversation — the requirement may have changed).
- Extract the specific target requirement (functional/non-functional, its number/ID).

## 3. Read the related codebase (FE & BE)
- Find & read the actual implementation files in `backend/` and `frontend/` relevant to this requirement.
- Determine whether this requirement is implemented at the **API** layer only, the **WEB (UI)** layer only, or both.
- If there's a gap between the requirement and the implementation (not implemented yet / different behavior), report it to the user and confirm how to treat it before creating test cases — never invent a test case for something that doesn't exist in the code.

## 4. Check existing test cases in Qase
- `GET https://api.qase.io/v1/case/{code}?suite_id=<suite_id>` (token & project code from the root `.env` — `QASE_API_TOKEN`, `QASE_PROJECT_CODE` — never print the token's contents to chat/log).
- Read the title, steps, and tags of existing test cases in the relevant suite (API and/or WEB, per the result of step 3).
- Compare semantically against the test case you're about to create/generate for this requirement.

## 5. Decide the action per requirement
For each relevant test case:
- **Already exists & complete** → don't recreate it, report its case ID to the user.
- **Exists but incomplete** (missing steps/assertions/edge cases) → `PATCH /case/{code}/{id}` to enhance it, don't duplicate.
- **Doesn't exist yet** → create a new one with `POST /case/{code}`, in the matching suite (create a new suite as a child of `API`/`WEB` via `POST /suite/{code}` with `parent_id` if this feature's suite doesn't exist yet).
- Include the requirement ID tag (e.g. `FR-1`), the layer tag (`API`/`WEB`), and the type tag (`Positive`/`Negative`) on every test case.
- **For WEB suite test cases**: write steps in QA-friendly language, not implementation language. Don't mention file/component names (`*.vue`), `data-testid`, CSS classes, internal route/store names, or a page's title/heading as a navigation marker. Use button/label/placeholder/message text that's actually visible in the UI for actions within the page (you still have to read the code first to make sure the text is accurate — it's just not written raw into the step). To open a page, state the page's name followed by its URL: `Open <Page Name> page, URL: {env}/<path>.` (e.g. `Open the Login page, URL: {env}/login.`) — never write a bare URL without the page name. This rule doesn't apply to the API suite — technical detail (endpoint, JSON, status code) is required there.
- **Language**: all test case content (title, description, preconditions, postconditions, steps) is written in English, EXCEPT text that appears literally in the app's UI (button labels, placeholders, error messages) — that's quoted exactly as-is (may be in Indonesian, matching the app's UI), never translated.
- For negative/edge-case tests, derive them from the implications of the requirement + code (e.g. input validation, error handling, race conditions, expired tokens) even if not explicitly written in the requirement — but they must still have a basis in the code/requirement, not free speculation.

## 6. Report the results
Summarize for the user: how many test cases were newly created, how many were enhanced, how many were skipped (already sufficient), along with each one's case ID and link `https://app.qase.io/case/{code}-{id}`. Also mention any requirement-vs-implementation gaps found (if any).
