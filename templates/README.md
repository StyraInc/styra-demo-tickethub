# TicketHub Sample App

The TicketHub sample application for Styra Run.

TicketHub contains two components: a [server](server/README.md), the server component hosting the API endpoints and business logic of the application; and a [client](client/README.md), despite its name, another server component hosting the static resources of the web application. The client also proxies requests to the server.

## How to run

Both the below client- and server components needs to be started for this sample to function properly.

### Start the Server

In this directory:

```sh
make run-server
```

### Start the Client

In this directory:

```sh
make run-client
```

### Browse

Turn a browser to `http://localhost:3000` to see the TicketHub sample app in action.
