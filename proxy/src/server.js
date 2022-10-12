import express from "express";
import path from "path";
import { request } from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = process.env.PORT || 3000
const host = process.env.HOST || 'localhost'
const backendPort = process.env.BACKEND_PORT || 3001
const backendHost = process.env.BACKEND_HOST || 'localhost'
const server = express()

const staticDir = path.join(__dirname, './public')
server.use(express.static(staticDir))

// Page aliases
server.get('/', (_, res) => {
  res.sendFile('tickets.html', {root: staticDir})
})

server.get('/tickets', (_, res) => {
  res.sendFile('tickets.html', {root: staticDir})
})

server.get('/ticket/new', (_, res) => {
  res.sendFile('new_ticket.html', {root: staticDir})
})

server.get('/ticket/*', (_, res) => {
  res.sendFile('ticket.html', {root: staticDir})
})

server.get('/admin', (_, res) => {
  res.sendFile('admin.html', {root: staticDir})
})

// Proxy
server.use('/', (req, resp) => {
  const options = {
    hostname: backendHost,
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  }

  const proxy = request(options, (proxiedResp) => {
    resp.writeHead(proxiedResp.statusCode, proxiedResp.headers)
    proxiedResp.pipe(resp, {
      end: true
    })
  })

  req.pipe(proxy, {
    end: true
  })
})

server.listen(port, host, () => {
  console.info(`Proxy server started on port: ${port}`)
})
