# Test Case Writing Language

- All test case content (title, description, preconditions, postconditions, steps) in Qase is written in **English** — unlike the PRD rule, which follows the source language.
- **Except**: text that appears literally in the app's UI (button labels, placeholders, error messages, link text) is still quoted **exactly as-is** even if the app is in Indonesian (e.g. the `"Masuk"` button, the error message `"email atau password salah"`). The surrounding narrative/instructions stay in English — never translate text that QA has to match on screen, since that would make the test case invalid at execution time.
