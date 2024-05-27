# TicketHub React Client

The TicketHub sample app client component.

## Prepare other services

1. `make policies/bundle.tar.gz`
2. `docker compose --profile node --profile react up proxy-react server-node`

## How to run

1. `make run`.
2. The server opens a listener on `0.0.0.0:3000`. Turn a browser to `http://localhost:3000` to see it in action.
