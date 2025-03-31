import StatusCodes from "http-status-codes";
import { Router } from "express";
import { param } from "express-validator";
import { PrismaClient } from "@prisma/client";

import { OPAClient } from "@styra/opa";

// all routes in this router is prefixed with /api, see ./server.js:42
export const router = Router();
const { OK, FORBIDDEN } = StatusCodes;

const prisma = new PrismaClient({
  log: ["query"],
});
const includeRelations = { include: { customers: true, users: true } };

// setup authz
const opa = new OPAClient(process.env.OPA_URL || "http://127.0.0.1:8181/");
const path = "tickets/response";

// resolve ticket
router.post(
  "/tickets/:id/resolve",
  [param("id").isInt().toInt()],
  async (req, res) => {
    const {
      params: { id },
      auth: { tenant, subject: user },
    } = req;
    const { allow, reason } = await opa.evaluate(
      path,
      { user, tenant, action: "resolve" },
    );
    if (!allow) return res.status(FORBIDDEN).json({ reason });

    const ticket = await prisma.tickets.update({
      where: { id },
      data: {
        resolved: req.body.resolved ? true : false,
        last_updated: now(),
      },
      ...includeRelations,
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
      auth: { tenant, subject: user },
    } = req;
    const { allow, reason } = await opa.evaluate(
      path,
      { user, tenant, action: "assign" },
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
      ...includeRelations,
    });
    return res.status(OK).json(toTicket(ticket));
  },
);

// unassign ticket
router.delete(
  "/tickets/:id/assign",
  [param("id").isInt().toInt()],
  async (req, res) => {
    const {
      params: { id },
      auth: { tenant, subject: user },
    } = req;
    const { allow, reason } = await opa.evaluate(
      path,
      { user, tenant, action: "unassign" },
    );
    if (!allow) return res.status(FORBIDDEN).json({ reason });

    const ticket = await prisma.tickets.update({
      where: {
        id,
      },
      data: {
        users: {
          disconnect: true,
        },
      },
      ...includeRelations,
    });
    return res.status(OK).json(toTicket(ticket));
  },
);

// create ticket
router.post("/tickets", async (req, res) => {
  const {
    auth: { tenant, subject: user },
    body: { customer, ...ticketData },
  } = req;
  const { allow, reason } = await opa.evaluate(
    path,
    { user, tenant, action: "create" },
  );
  if (!allow) return res.status(FORBIDDEN).json({ reason });

  const { id: tenantId } = tenant;

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
    ...includeRelations,
  });

  return res.status(OK).json(toTicket(ticket));
});

// list all tickets
router.get("/tickets", async (req, res) => {
  const {
    auth: { tenant, subject: user },
  } = req;
  const { query, mask } = await opa.getFilters(
    "tickets/filters/include",
    { user, tenant, action: "list" },
    "tickets",
  );
  if (!query) return res.status(FORBIDDEN).json({ reason: "not authorized" });

  const tickets = (
    await prisma.tickets.findMany({
      where: query,
      ...includeRelations,
      orderBy: {
        last_updated: "desc",
      },
    })
  ).map((ticket) => toTicket(mask(ticket)));
  return res.status(OK).json({ tickets });
});

// get ticket
router.get("/tickets/:id", [param("id").isInt().toInt()], async (req, res) => {
  const {
    params: { id },
    auth: { tenant, subject: user },
  } = req;
  const { allow, reason } = await opa.evaluate(
    path,
    { user, tenant, action: "get", id },
  );
  if (!allow) return res.status(FORBIDDEN).json({ reason });

  const ticket = await prisma.tickets.findUniqueOrThrow({
    where: { id },
    ...includeRelations,
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
  return { ...rest, customer, assignee: users?.name || null };
}
