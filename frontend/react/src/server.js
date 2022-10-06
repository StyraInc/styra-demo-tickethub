import express from "express";
import cookieParser from "cookie-parser";
import StatusCodes from "http-status-codes";
import path from "path";
import {fileURLToPath} from "url";

import {router as apiRouter} from "./api.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = 4000
const app = express()

// Set static dir
const staticDir = path.join(__dirname, 'public')
app.use(express.static(staticDir))

// Common middlewares
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

// Error handling
app.use((err, req, res, _) => {
  console.error(err, true)
  const status = (err instanceof HttpError ? err.HttpStatus : StatusCodes.BAD_REQUEST)
  return res.status(status).json({
    error: err && err.message,
  })
})

// Authentication.
app.use((req, res, next) => {
  const {tenant, user} = req.cookies
  if (tenant && user) {
    req.auth = {tenant, subject: user}
    next()
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({error: 'authentication error: user credentials not provided'})
  }
})

// API
app.use('/api', apiRouter)

// Start app
app.listen(port, () => {
  console.info(`Server started on port: ${port}`)
})
