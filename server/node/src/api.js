import StatusCodes from "http-status-codes";
import { Router } from "express";
import { param } from "express-validator";
import { Authorizer } from "./authz.js";
import { PrismaClient } from "@prisma/client";
import { ucastToPrisma } from "@styra/ucast-prisma";

// all routes in this router is prefixed with /api, see ./server.js:42
export const router = Router();
const { OK, FORBIDDEN } = StatusCodes;

const prisma = new PrismaClient({
  log: ["query"],
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
    const { allow, reason } = await authz.authorized(
      path,
      { action: "resolve" },
      req,
    );
    if (!allow) return res.status(FORBIDDEN).json({ reason });

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

// assign ticket
router.post(
  "/tickets/:id/assign",
  [param("id").isInt().toInt()],
  async (req, res) => {
    const {
      params: { id },
    } = req;
    const { allow, reason } = await authz.authorized(
      path,
      { action: "assign" },
      req,
    );
    if (!allow) return res.status(FORBIDDEN).json({ reason });

    const {
      auth: {
        tenant: { id: tenantId },
      },
      body: { assignee },
    } = req;
    const ticket = await prisma.tickets.update({
      where: { id },
      data: {
        users: {
          connectOrCreate: {
            where: {
              tenant_name: {
                tenant: tenantId,
                name: assignee,
              },
            },
            create: {
              name: assignee,
              tenants: {
                connect: { id: tenantId },
              },
            },
          },
        },
        last_updated: now(),
      },
      include: { users: true, customers: true },
    });
    return res.status(OK).json(toTicket(ticket));
  },
);

// create ticket
router.post("/tickets", async (req, res) => {
  const { allow, reason } = await authz.authorized(
    path,
    { action: "create" },
    req,
  );
  if (!allow) return res.status(FORBIDDEN).json({ reason });

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
  const { allow, reason, conditions } = await authz.authorized(
    path,
    { action: "list" },
    req,
  );
  if (!allow) return res.status(FORBIDDEN).json({ reason });
  console.dir({ allow, conditions }, { depth: null });

  const filters = ucastToPrisma(conditions, "tickets");
  console.dir(filters, { depth: null });

  const tickets = (
    await prisma.tickets.findMany({
      where: {
        tenant: req.auth.tenant.id,
        ...filters,
      },
      include: {
        customers: true,
        users: true,
      },
    })
  ).map((ticket) => toTicket(ticket));
  return res.status(OK).json({ tickets });
});

// get ticket
router.get("/tickets/:id", [param("id").isInt().toInt()], async (req, res) => {
  const {
    params: { id },
  } = req;
  const { allow, reason } = await authz.authorized(
    path,
    { action: "get", id },
    req,
  );
  if (!allow) return res.status(FORBIDDEN).json({ reason });

  const ticket = await prisma.tickets.findUniqueOrThrow({
    where: { id },
    ...includeCustomers,
  });
  return res.status(OK).json(toTicket(ticket));
});

function now() {
  return new Date().toISOString().split(".")[0] + "Z";
}

function toTicket({
  customers: { name: customer },
  users,
  assignee: _2,
  tenant: _1,
  ...rest
}) {
  return { ...rest, customer, assignee: users?.name };
}
