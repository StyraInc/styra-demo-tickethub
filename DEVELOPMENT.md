# Development Notes

## Resetting the database

You must have the `psql` CLI installed locally and have the docker-compose running.

```sh
SERVER=node make reset-database
```

## Run tests manually

Both of these test suites are run in CI for every PR, in a matrix setting that
uses all of the available backend implementations.

### API

The individual backend services' APIs are tested using [hurl](https://hurl.dev).
Tests are defined in `tests/api/`, and best run using docker-compose:

```sh
docker compose run integration-tests
```

The tests are split into `basic`, `filters` and `masks` tests.
Only the `node` and `csharp` server implementation currently support filtering and masking.
To run the tests with the filtering and masking tests, run:

```sh
HURL_SKIP_FILTERING=false HURL_SKIP_MASKING=false docker compose run integration-tests
```

### E2E

The end-to-end tests use [playwright](https://playwright.dev), and expect to find a running client/react instance, connected
to the backend services, on http://127.0.0.1:3000.
The tests are defined in `tests/e2e/tests/tickets.spec.ts`.

You can run them manually via
```sh
npm ci
npx playwright test
```
in the tests/e2e/ directory.

Please note that the test cases expect a certain number of tickets in the lists.
When creating new tickets, those assertions are often broken in local setups.

To **debug the UI tests** use
```sh
npx playwright test --ui
```
