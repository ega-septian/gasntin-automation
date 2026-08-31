# Never Call `request.<method>()` Directly in a Spec — Always Through `api/<service>.ts`

Test specs (`tests/**/*.spec.ts`, API or WEB) **must never** call `request.get/post/put/patch/delete(...)` (or the equivalent HTTP-client method on the WEB layer) directly with the endpoint path written in the spec file. Every endpoint must be wrapped in a named function in `api/<service>.ts`, grouped by service/domain (e.g. `api/auth.ts`, later `api/cart.ts`) — the spec just calls that function.

- A function for an endpoint that **is itself the subject of the test** (e.g. an endpoint whose response is directly asserted) should just send the request and return the raw response (`APIResponse`), **without** asserting/throwing inside it — so the spec stays free to write its own assertions (status code, body, etc.) against that response.
- **Precondition** functions (e.g. `registerUser`, `loginUser` in `api/auth.ts`) may assert + throw internally (fail fast if setup fails), but must be built **on top of** that same raw request function — never duplicate the literal endpoint path in two places.
- A new endpoint for a domain that doesn't have a file in `api/` yet → create a new `api/<domain>.ts` file, don't pile it onto another domain's file.
- The goal: one source of truth per endpoint (path + method). If the endpoint URL changes, update it in one place, not via a grep-replace across every spec.
