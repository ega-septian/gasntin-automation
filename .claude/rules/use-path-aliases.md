# Import `api/`, `data/`, `support/`, `setup/` via Their `@` Alias, Never Relative

`tsconfig.json` defines `@api/*`, `@data/*`, `@support/*`, `@setup/*` mapping to `./api/*`, `./data/*`, `./support/*`, `./setup/*`. Every import of something from one of these four folders — from a spec file, a fixture, or another one of these folders itself — uses its alias:

```ts
// Good
import { registerUser } from '@api/auth.js'
import { buildProductPayload } from '@data/products.js'
import { qaseId } from '@support/qase.js'

// Bad — works, but not the convention
import { registerUser } from '../../api/auth.js'
```

- **Why**: a relative path's depth (`../../` vs `../../../`) depends on how deeply nested the importing file is (e.g. a spec in `tests/api/` vs a fixture in `tests/api/fixtures/`) — the same target ends up imported with different-looking paths depending on where it's imported from, and every path breaks if a file moves. The alias is stable regardless of the importer's location.
- Only imports of `api/`, `data/`, `support/`, `setup/` are covered — a same-directory or sibling import (e.g. a spec importing its own `./fixtures/fixtures.js`, or a page object importing another page object next to it) stays a plain relative import; there's no alias for those and adding one would be pointless indirection.
- If a new top-level helper folder is ever added alongside these four, add its alias to `tsconfig.json` at the same time — don't leave a fifth folder as the one relative-only exception.
