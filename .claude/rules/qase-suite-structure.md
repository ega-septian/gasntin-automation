# Qase Suite Structure (project `GASNTIN`)

```
API   (top-level, id 2)
└── <Feature Name>   e.g. Registration, Login, Session & Page Protection, Logout, Security & Non-Functional
WEB   (top-level, id 3)
└── <Feature Name>   only created if the UI actually exists in the frontend
```

- New suites for a feature are created as children of `API` or `WEB` (using `parent_id`), never as a new top-level suite.
- Tag every test case with a feature tag matching its suite's `<Feature Name>` **exactly** (e.g. `Checkout`, `Login`) — always present, not just when there's no PRD to trace to. This is a third, independent filter dimension alongside layer (`API`/`WEB`) and level (`smoke`/`regression`, see `.claude/rules/smoke-and-regression-tagging.md`): it lets you filter "everything Checkout-related" across both layers without knowing suite IDs. Exact-match matters — `checkout-flow` or `Order` instead of `Checkout` silently breaks that filter and drifts from the suite it's supposed to mirror.
- Also tag the related requirement ID (e.g. `FR-1`, `NFR-2`) when a PRD exists, plus a type tag (`Positive`/`Negative`). If there's no PRD/Confluence page to trace to (e.g. the feature was built directly from conversation, no formal requirement doc exists), the feature tag is what stands in for traceability — say so when reporting back, and don't invent a fake `FR-x` ID.
- Mirror the feature tag into Playwright too, same mechanism as smoke/regression: lowercase, `@`-prefixed, combined in the same `tag` array — `tag: ['@smoke', '@checkout']`. `npx playwright test --grep @checkout` then runs every Checkout test regardless of API/WEB layer or file.
