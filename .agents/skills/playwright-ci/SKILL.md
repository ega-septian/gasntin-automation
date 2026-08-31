---
name: playwright-ci
description: Production-ready CI/CD configurations for Playwright on GitHub Actions — parallel sharding, reporting, multi-project config, and global setup/teardown.
---

# Playwright CI/CD

> Ship reliable tests in every pipeline — CI-specific patterns for speed, stability, and actionable reports.

**5 guides** covering GitHub Actions CI/CD setup, parallel execution, reporting, and infrastructure patterns.

> Pruned for this project's actual CI (GitHub Actions only, no GitLab/CircleCI/Azure/Jenkins, no Docker containerization of the app itself, no code coverage collection) — 4 guides not applicable here were removed. See `git log` on this file if you ever need one back.

## Golden Rules

1. **`retries: 2` in CI only** — surface flakiness in pipelines, not locally
2. **`traces: 'on-first-retry'`** — capture rich debugging artifacts without slowing every run
3. **Shard across runners** — `--shard=N/M` splits tests evenly; scale horizontally, not vertically
4. **Cache browser binaries** — `~/.cache/ms-playwright` keyed on Playwright version
5. **Upload artifacts on failure** — traces, screenshots, and HTML reports as CI artifacts
6. **Use the official Docker image** — `mcr.microsoft.com/playwright:v*` has all OS deps pre-installed
7. **Global setup for auth** — run login once in `globalSetup`, reuse `storageState` across workers
8. **Fail fast, debug later** — keep CI runs short; use trace viewer and HTML reports to investigate

## Guide Index

### CI Providers

| Provider | Guide |
|---|---|
| GitHub Actions | [ci-github-actions.md](ci-github-actions.md) |

### Execution & Scaling

| Topic | Guide |
|---|---|
| Parallel execution & sharding | [parallel-and-sharding.md](parallel-and-sharding.md) |
| Multi-project config | [projects-and-dependencies.md](projects-and-dependencies.md) |

### Reporting & Setup

| Topic | Guide |
|---|---|
| Reports & artifacts | [reporting-and-artifacts.md](reporting-and-artifacts.md) |
| Global setup/teardown | [global-setup-teardown.md](global-setup-teardown.md) |
