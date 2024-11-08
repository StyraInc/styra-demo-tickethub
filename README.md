# TicketHub Sample App

The TicketHub sample application to show off using the Styra OPA SDKs:

* [SDK Documentation](https://docs.styra.com/sdk)
* [Java SDK repository](https://github.com/StyraInc/opa-java)
* [Typescript / Javascript SDK repository](https://github.com/StyraInc/opa-typescript)
* [C# SDK repository](https://github.com/StyraInc/opa-csharp)

## Running the Tickethub app

To run the Tickethub app you need to select which server and client implementations to use when running `docker compose up`

```
docker compose --profile <SERVER_IMPLEMENTATION> --profile <CLIENT_IMPLEMENTATION> up
```

The list of `<SERVER_IMPLEMENTATION>` is:
- `node`
- `csharp`
- `aspnetcore`
- `java`
- `springboot`

The list of `<CLIENT_IMPLEMENTATION>` is:
- `html`
- `react`

So for example, running the `node` server with `react` would result in:

```
docker compose --profile node --profile react up
```

Then open the browser at `http://localhost:3000`

> [!WARNING]
> Using docker compose requires `networking_mode: host`.
> This is disabled by default on MacOS and Windows for Docker Desktop.
> See the [Docker Desktop documentation](https://docs.docker.com/network/drivers/host/) for information on how to enable this mode.

## Reason Support

Some TicketHub servers and clients support displaying reason information to the user. This can be helpful for informing the user why their request failed. Reason information is accessed via `data.tickets.reason`. For purposes of this demo app, the `reason_admin` value is assigned to `reason`, though in a more production-ready application `reason_user` would be more appropriate. TicketHub backends which support reasons should provide a `reason` field in their JSON response body during HTTP 403 forbidden responses.

For an example of how this works, consider the following curl commands:

```plain
$ curl -LSs 'http://localhost:4000/api/tickets/1/resolve' -H 'Cookie: user=acmecorp / bob' -H 'content-type: application/json'  --data-raw '{"resolved":true}' | jq
{
  "reason": "resolver role is required to resolve",
  "message": "access denied by policy"
}
$ curl -LSs 'http://localhost:4000/api/tickets/1/resolve' -H 'Cookie: user=acmecorp / alice' -H 'content-type: application/json'  --data-raw '{"resolved":true}' | jq
{
  "description": "Dooms day device needs to be refactored",
  "id": 1,
  "customer": "Globex",
  "resolved": true,
  "last_updated": "2024-10-08T16:45:57.557846723Z"
}
```

Reason support for clients:
* ✅ HTML
* ✅ React (for resolving tickets)

Reason support for servers:
* ✅ Java
* ❌ Spring Boot
* ❌ C#
* ❌ ASP.NET
* ✅ Node
