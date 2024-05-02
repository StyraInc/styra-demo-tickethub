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