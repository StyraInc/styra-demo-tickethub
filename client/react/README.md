# TicketHub React Client

The TicketHub sample app client component.

## Prepare other services

1. `make policies/bundle.tar.gz`
2. `make client/react/public/opa.wasm`
2. `docker compose --profile node --profile react up proxy-react server-node`

## How to run (HTTP)

1. `make run`.
2. The server opens a listener on `0.0.0.0:3000`. Turn a browser to `http://localhost:3000` to see it in action.

All policy evaluations will then use the [`@styra/opa`](https://www.npmjs.com/package/@styra/opa) SDK instance, and make one backend
call per eval, via [`@styra/opa-react`](https://www.npmjs.com/package/@styra/opa-react).

## How to run (Wasm)

1. Change `.env` to say `REACT_APP_USE_WASM=/opa.wasm` (uncomment it)
2. `make run`.
3. The server opens a listener on `0.0.0.0:3000`. Turn a browser to `http://localhost:3000` to see it in action.

### How does it work:

Whenever the user changes, the App will fetch new "user data" from the exposed
OPA instance's `data.userdata`. It sends user/tenant along to get the specific
user's own data. The policy (wasm) doesn't need to change, it will just use a
different data set.

All policy evaluations will then use the WasmSDK instance.
