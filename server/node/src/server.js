import "express-async-errors"; // makes sure uncaught errors in async handlers doesn't cause crash
import "module-alias/register.js";

import cookieParser from "cookie-parser";
import express from "express";
import StatusCodes from "http-status-codes";

import { router as apiRouter } from "./api.js";
import { UnauthorizedError } from "./authz.js";
import { PrismaClient, Prisma } from "@prisma/client";

const { INTERNAL_SERVER_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND } =
  StatusCodes;
const port = process.env.SERVER_PORT || 4000;
const host = process.env.SERVER_HOST || "localhost";
const app = express();
const prisma = new PrismaClient();

// common middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// authentication
app.use(async (req, res, next) => {
  if ("user" in req.cookies) {
    const [tenantName, subject] = req.cookies.user.split(" / ");
    const tenantRecord = await prisma.tenants.findFirstOrThrow({
      where: { name: tenantName },
    });
    req.auth = {
      tenant: { name: tenantRecord.name, id: tenantRecord.id },
      subject,
    };
    next();
  } else {
    res.status(UNAUTHORIZED).json({
      error: "authentication error: user credentials not provided",
    });
  }
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
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if ((err.code = "P2025")) {
      return res.status(NOT_FOUND).json({ status: "not found" });
    }
  }
  console.error(err);
  return res.status(INTERNAL_SERVER_ERROR).json({
    error: err.message,
  });
});

app.listen(port, host, () => {
  console.info(`Server started on port: ${port}`);
});
