# Aux packages

This is a playground for creating reusable packages for client/react.

**Do not import them from here** -- if they are deemed "ready for public consumption", you'll find them on NPM.


## `opa-react`

React helpers:
- `<AuthzProvider>` for setting up a global SDK instance
- `<Authz>` for protecting components on the UI (hide/disable)
- `useAuthz` for full control over policy evaluations

`AuthzProvider` can be set up to use either `@styra/opa` or `opa-wasm`.

## `opa-wasm`

This is an SDK for using OPA's Wasm modules from TS/JS projects.
It's a slight departure from `@open-policy-agent/npm-opa-wasm` to allow for
experimentation, and removing legacy/compatibility extras.

It exposes the same interface as `@styra/opa`, so it can be used as a drop-in
replacement.
