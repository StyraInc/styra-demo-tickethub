import "express-async-errors"; // makes sure uncaught errors in async handlers doesn't cause crash
import "module-alias/register.js";

import cookieParser from "cookie-parser";
import express from "express";
import StatusCodes from "http-status-codes";

import { router as apiRouter } from "./api.js";

const port = process.env.SERVER_PORT || 4000;
const host = process.env.SERVER_HOST || "localhost";
const app = express();

// common middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// error handling
app.use((err, _req, res, _next) => {
  const status =
    err instanceof HttpError ? err.HttpStatus : StatusCodes.BAD_REQUEST;
  return res.status(status).json({
    error: err?.message,
  });
});

// authentication
app.use((req, res, next) => {
  if ("user" in req.cookies) {
    const [tenant, subject] = req.cookies.user.split(" / ");
    req.auth = { tenant, subject };
    next();
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: "authentication error: user credentials not provided",
    });
  }
});

// API
app.use("/api", apiRouter);

app.listen(port, host, () => {
  console.info(`Server started on port: ${port}`);
});
