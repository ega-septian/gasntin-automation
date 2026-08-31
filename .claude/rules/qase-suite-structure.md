# Qase Suite Structure (project `GASNTIN`)

```
API   (top-level, id 2)
└── <Feature Name>   e.g. Registration, Login, Session & Page Protection, Logout, Security & Non-Functional
WEB   (top-level, id 3)
└── <Feature Name>   only created if the UI actually exists in the frontend
```

- New suites for a feature are created as children of `API` or `WEB` (using `parent_id`), never as a new top-level suite.
- Tag every test case with the related requirement ID (e.g. `FR-1`, `NFR-2`) for clear traceability to the PRD, plus a layer tag (`API`/`WEB`) and a type tag (`Positive`/`Negative`). If there's no PRD/Confluence page to trace to (e.g. the feature was built directly from conversation, no formal requirement doc exists), tag with a descriptive feature-name tag instead (e.g. `Homepage`) and say so when reporting back — don't invent a fake `FR-x` ID.
