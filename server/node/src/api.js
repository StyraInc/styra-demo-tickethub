import StatusCodes from "http-status-codes";
import { Router } from "express";
import { param } from "express-validator";
import { Authorizer } from "./authz.js";
import { PrismaClient } from "@prisma/client";
import {
  ObjectQueryParser,
  createInterpreter,
  Condition,
  //InterpretationContext, // NB(sr): that's an interface
} from "@ucast/core";

// all routes in this router is prefixed with /api, see ./server.js:42
export const router = Router();
const { OK, FORBIDDEN } = StatusCodes;

const prisma = new PrismaClient({
  log: ['query'],
});
const includeCustomers = { include: { customers: true } };

// setup authz
const authz = new Authorizer(process.env.OPA_URL || "http://127.0.0.1:8181/");
const path = "tickets/response";

// resolve ticket
router.post(
  "/tickets/:id/resolve",
  [param("id").isInt().toInt()],
  async (req, res) => {
    const {
      params: { id },
    } = req;
    const { allow, reason, conditions } = await authz.authorized(path, { action: "resolve" }, req);
    if (!allow)
      return res.status(FORBIDDEN).json({reason});

    const ticket = await prisma.tickets.update({
      where: { id },
      data: {
        resolved: req.body.resolved ? true : false,
        last_updated: now(),
      },
      ...includeCustomers,
    });
    return res.status(OK).json(toTicket(ticket));
  },
);

// create ticket
router.post("/tickets", async (req, res) => {
  await authz.authorized(path, { action: "create" }, req);

  const {
    auth: {
      tenant: { id: tenantId },
    },
    body: { customer, ...ticketData },
  } = req;

  const ticket = await prisma.tickets.create({
    data: {
      ...ticketData,
      customers: {
        connectOrCreate: {
          where: {
            tenant_name: {
              tenant: tenantId,
              name: customer,
            },
          },
          create: {
            name: customer,
            tenants: {
              connect: { id: tenantId },
            },
          },
        },
      },
      tenants: {
        connect: { id: tenantId },
      },
    },
    ...includeCustomers,
  });

  return res.status(OK).json(toTicket(ticket));
});

// list all tickets
router.get("/tickets", async (req, res) => {
  const { allow, reason, conditions } = await authz.authorized(path, { action: "list" }, req);
  if (!allow)
    return res.status(FORBIDDEN).json({reason});
  console.log({allow, conditions});

  // find the relevant conditions: tickets.*
  const parser = new ObjectQueryParser({ eq: {type: "field" }});
  const parsed = parser.parse(conditions);
  // console.log({parsed});
  const eq = (node, value, _ctx) => {
    //console.log({node, value});
    const [tbl, field] = node.field.split(".");
    return {[tbl]: {[field]: node.value}};
    };
  const interpret = createInterpreter({ eq });
  const interpreted = interpret(parsed, 'test');
  console.log(interpreted);

  const tickets = (
    await prisma.tickets.findMany({
      where: { tenant: req.auth.tenant.id, ...interpreted.tickets },
      include: { customers: true },
    })
  ).map((ticket) => toTicket(ticket));
  return res.status(OK).json({ tickets });
});

// get ticket
router.get("/tickets/:id", [param("id").isInt().toInt()], async (req, res) => {
  const {
    params: { id },
  } = req;
  await authz.authorized(path, { action: "get", id }, req);

  const ticket = await prisma.tickets.findUniqueOrThrow({
    where: { id },
    ...includeCustomers,
  });
  return res.status(OK).json(toTicket(ticket));
});

function now() {
  return new Date().toISOString().split(".")[0] + "Z";
}

function toTicket({ customers: { name }, tenant: _1, ...rest }) {
  return { ...rest, customer: name };
}
