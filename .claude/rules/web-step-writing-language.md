# Step Writing Language (WEB/UI test cases only)

**WEB** suite test cases are read and executed manually by QA who doesn't (need to) read the code. Their steps **must** be written in visually/functionally descriptive language, not implementation language:

- **Never** mention code file/component names (e.g. `LoginView.vue`, `DashboardView.vue`).
- **Never** mention technical identifiers: `data-testid`, CSS classes, Vue Router route names, variable/store names (e.g. `auth.isAuthenticated`), JSON field names.
- **Must** use user-visible references: the exact button text (e.g. the "Masuk" button), field labels, placeholders, the message/error text shown, visual element descriptions (e.g. "the eye icon at the right of the password field").
- **Never** use a page's title/heading as the marker for "open page X" (e.g. don't write `Open the Login page (titled "MASUK KE AKUN KAMU")`). **Also never** write a bare URL without the page's name (e.g. don't just write `Open {env}/login.`). Required format for navigation/open-page instructions: state the **page name** (in QA-friendly language, not the literal title/heading) followed by the **URL** with an environment placeholder, format `{env}/<path>` — pattern: `Open <Page Name> page, URL: {env}/<path>.` Example: `Open the Login page, URL: {env}/login.` / `Open the Dashboard page, URL: {env}/dashboard.` Visual-text references (button/label/placeholder) are still used for actions *within* the page (clicking, filling a field), not for opening the page itself.
- Reading the frontend code is **still required** to make sure the text/labels used in a step match the UI exactly (so QA doesn't hunt for the wrong element during manual execution) — this restriction is about *how steps are worded*, not about *where the analysis comes from*. Reading the code still happens; the result just isn't written verbatim into the test case.

This rule does **not** apply to the **API** suite — API test cases naturally need technical detail (endpoint, method, JSON body, status code, header) because that's literally what's being tested.
