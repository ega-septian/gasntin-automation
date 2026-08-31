# PRD Writing Rules

Whenever creating or updating a PRD document in this project, use the following template (following the team's Confluence format, e.g. page ID 360465 "PRD - SauceDemo Login"). The main body of the document (from the header down to the `Total requirements:` line) must follow this structure exactly, with no extra sections in between, so it can be copy-pasted straight into Confluence without reformatting:

```markdown
# Product Requirements Document (PRD)

## <Feature Name>

|  |  |
| --- | --- |
| **Document** | PRD-<CODE>-v1.0 |
| **Status** | <Draft / Approved for Development / etc.> |
| **Target Application** | <application name/url> |
| **Feature** | <feature name> |
| **Date** | <date> |

---

## 1. Background

<background/problem paragraph>

## 2. Objectives

* <objective 1>
* <objective 2>

## 3. Scope

**In scope:** <short list>

**Out of scope:** <short list>

---

## 4. Functional Requirements

* <requirement, full sentence "The system must ...", testable>

## 5. Non-Functional Requirements

* <requirement, full sentence>

---

_Total requirements: X functional + Y non-functional. <optional closing note>_
```

Additional rules:

- **Language** follows the language of the request/source document (Indonesian or English) — don't mix.
- Every requirement (functional & non-functional) is written as a **complete, testable sentence**, not a short feature bullet, following the pattern "The system must ...".
- Don't insert other sections (user stories, technical specs, acceptance criteria, risks, etc.) inside the template's main body. If that info is relevant and worth documenting, put it in a separate **Appendix** below the final `---` line, with a heading that clearly states it's "outside the template's main body / not meant to be copied into Confluence".
- Save new PRD files at `docs/PRD-<feature-name>.md`.
- If there's an original PRD on Confluence being used as the reference, mention its page ID/title in the closing note or Appendix, not in the main body.
