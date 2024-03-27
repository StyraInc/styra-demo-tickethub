import StatusCodes from "http-status-codes";
import { Router } from "express";
import { Authorizer } from "./authz.js";
import { tickets as ticketsDb } from "./db.js";

// all routes in this router is prefixed with /api, see ./server.js:42
export const router = Router();
const { OK } = StatusCodes;

// setup authz
const authz = new Authorizer(process.env.OPA_URL || "http://127.0.0.1:8181/");
const path = "tickets/allow";

// resolve ticket
router.post("/tickets/:id/resolve", async (req, res) => {
  await authz.authorized(path, { action: "resolve" }, req);

  const ticket = ticketsDb[req.auth.tenant][req.params.id];
  ticket.resolved = req.body.resolved ? true : false;
  ticket.last_updated = now();
  return res.status(OK).json(asTicket(req.params.id, ticket));
});

// create ticket
router.post("/tickets", async (req, res) => {
  await authz.authorized(path, { action: "create" }, req);

  const id = ticketsDb[req.auth.tenant].length;
  const ticket = req.body;
  ticket.last_updated = now();
  ticketsDb[req.auth.tenant].push(ticket);
  return res.status(OK).json(asTicket(id, ticket));
});

// list all tickets
router.get("/tickets", async (req, res) => {
  await authz.authorized(path, { action: "list" }, req);

  const tickets = ticketsDb[req.auth.tenant].map((t, index) =>
    asTicket(index, t),
  );
  return res.status(OK).json({ tickets });
});

// get ticket
router.get("/tickets/:id", async (req, res) => {
  await authz.authorized(path, { action: "get", id: req.params.id }, req);

  const ticket = ticketsDb[req.auth.tenant][req.params.id];
  return res.status(OK).json(asTicket(req.params.id, ticket));
});

function now() {
  return new Date().toISOString().split(".")[0] + "Z";
}

function asTicket(id, attrs) {
  return { id, ...attrs };
}
