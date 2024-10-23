import "express-async-errors"; // makes sure uncaught errors in async handlers doesn't cause crash
import "module-alias/register.js";

import express from "express";
import StatusCodes from "http-status-codes";

import { router as apiRouter } from "./api.js";
import { UnauthorizedError } from "./authz.js";
import { PrismaClient } from "@prisma/client";

const { INTERNAL_SERVER_ERROR, UNAUTHORIZED, FORBIDDEN } = StatusCodes;
const port = process.env.SERVER_PORT || 4000;
const host = process.env.SERVER_HOST || "localhost";
const app = express();
const prisma = new PrismaClient();

// common middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function readToken(val) {
  if (!val) return [];
  return val.slice(7).split(" / ");
}

// authentication
app.use(async (req, res, next) => {
  let [tenantName, subject] = readToken(req.headers.authorization);
  if (!tenantName || !subject) {
    return res.status(UNAUTHORIZED).json({
      error: "authentication error: user credentials not provided",
    });
  }
  const tenantRecord = await prisma.tenants.findFirstOrThrow({
    where: { name: tenantName },
  });
  req.auth = {
    tenant: { name: tenantRecord.name, id: tenantRecord.id },
    subject,
  };
  next();
});

// API
app.use("/api", apiRouter);

// error handling
app.use((err, _req, res, _next) => {
  if (err instanceof UnauthorizedError) {
    return res.status(FORBIDDEN).json({
      status: "forbidden",
      message: err.message,
    }); // TODO(sr): do we actually get this response JSON back?
  }
  console.error(err);
  return res.status(INTERNAL_SERVER_ERROR).json({
    error: err.message,
  });
});

app.listen(port, host, () => {
  console.info(`Server started on port: ${port}`);
});
