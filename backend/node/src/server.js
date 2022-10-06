import 'module-alias/register.js'
import cookieParser from "cookie-parser";
import express from "express";
import 'express-async-errors'; // makes sure uncaught errors in async handlers doesn't cause crash
import StatusCodes from "http-status-codes";

import {router as htmlRouter} from "./html.js";
import {router as apiRouter} from "./api.js";

const port = process.env.PORT || 3000
const host = process.env.HOST || 'localhost'
const app = express()

/**
 * Middlewares
 */

// Common middlewares
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

/**
 * Routes and error handling
 */

// Error handling
app.use((err, req, res, _) => {
  console.error(err, true)
  const status = (err instanceof HttpError ? err.HttpStatus : StatusCodes.BAD_REQUEST)
  return res.status(status).json({
    error: err && err.message,
  })
})

// HTML
app.use(htmlRouter)

// Authentication.
app.use((req, res, next) => {
  if ('user' in req.cookies) {
    const [tenant, subject] = req.cookies.user.split(' / ')
    req.auth = {tenant, subject}
    next()
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "authentication error: user credentials not provided"
    })
  }
})

// API
app.use('/api', apiRouter)

// Start app
app.listen(port, host, () => {
  console.info(`Server started on port: ${port}`)
})
