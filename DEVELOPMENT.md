# Development Notes

## Run tests manually

Both of these test suites are run in CI for every PR, in a matrix setting that
uses all of the available backend implementations.

### API

The individual backend services' APIs are tested using [hurl](https://hurl.dev).
Tests are defined in `tests/api/basic.hurl`, and best run using docker-compose:

```sh
docker compose run integration-tests
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
