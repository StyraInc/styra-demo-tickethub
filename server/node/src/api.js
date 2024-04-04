import StatusCodes from "http-status-codes";
import { Router } from "express";
import { param } from "express-validator";
import { Authorizer } from "./authz.js";
import { PrismaClient } from "@prisma/client";

// all routes in this router is prefixed with /api, see ./server.js:42
export const router = Router();
const { OK } = StatusCodes;

const prisma = new PrismaClient();
const includeCustomers = { include: { customers: { select: { name: true } } } };

// setup authz
const authz = new Authorizer(process.env.OPA_URL || "http://127.0.0.1:8181/");
const path = "tickets/allow";

// resolve ticket
router.post(
  "/tickets/:id/resolve",
  [param("id").isInt().toInt()],
  async (req, res) => {
    const conditions = await authz.authorizedFilter(
      "tickets/conditions",
      { action: "resolve" },
      req,
    );

    const ticket = await prisma.tickets.update({
      where: { id: req.params.id, ...conditions },
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
  const conditions = await authz.authorizedFilter(
    "tickets/conditions",
    { action: "list" },
    req,
  );

  const tickets = (
    await prisma.tickets.findMany({
      where: { tenant: req.auth.tenant.id, ...conditions },
      ...includeCustomers,
    })
  ).map((ticket) => toTicket(ticket));
  return res.status(OK).json({ tickets });
});

// get ticket
router.get("/tickets/:id", [param("id").isInt().toInt()], async (req, res) => {
  const conditions = await authz.authorizedFilter(
    "tickets/conditions",
    { action: "get" },
    req,
  );

  const ticket = await prisma.tickets.findUniqueOrThrow({
    where: { id: req.params.id, ...conditions },
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
