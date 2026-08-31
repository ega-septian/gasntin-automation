# App Map — Check Before Describing or Testing Any Page

`.claude/app-map.md` is a factual inventory of every page/route that actually exists in the app (URL, whether it requires login, which view component). `product-manager` and `qa-tester` must check it before writing a spec/case that references opening or navigating to any page — it exists specifically to prevent a failure mode already seen in this project: several early WEB Login test cases described and automated a "Dashboard" page that was never real, invented rather than sourced, and it took a full audit to catch.

This file is **structural fact, not business logic** — checking it is not "reading implementation code to decide correctness" (still forbidden for `product-manager`, still verify-only for `qa-tester`); it's the same kind of reference a sitemap gives a new QA hire. It records what pages exist and their login requirement, never what a page *should* do — expected behavior still always comes from a PRD or `product-manager` spec.

If a route is added, removed, or renamed, update `.claude/app-map.md` in the same change (whoever does that work — `frontend-engineer` or the orchestrator — is responsible for it, the same way a migration file update accompanies a schema change).
