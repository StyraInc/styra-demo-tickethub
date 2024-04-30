import express from "express";
import path from "path";
import { request } from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.CLIENT_PORT || 3000;
const host = process.env.CLIENT_HOST || "localhost";
const serverPort = process.env.SERVER_PORT || 4000;
const serverHost = process.env.SERVER_HOST || "localhost";
const server = express();

const staticDir = path.join(__dirname, "../public");
server.use(express.static(staticDir));

// Page aliases
server.get("/", (_, res) => {
  res.sendFile("tickets.html", { root: staticDir });
});

server.get("/tickets", (_, res) => {
  res.sendFile("tickets.html", { root: staticDir });
});

server.get("/ticket/new", (_, res) => {
  res.sendFile("new_ticket.html", { root: staticDir });
});

server.get("/ticket/*", (_, res) => {
  res.sendFile("ticket.html", { root: staticDir });
});

// Proxy
server.use("/", (req, resp) => {
  const options = {
    hostname: serverHost,
    port: serverPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  }
  
  const proxy = request(options, (proxiedResp) => {
    console.log("RESPONSE: " + req.method + " " + req.url + ": " + proxiedResp.statusCode + " " + proxiedResp.headers);
    resp.writeHead(proxiedResp.statusCode, proxiedResp.headers)
    proxiedResp.pipe(resp, {
      end: true,
    });
  });

  req.pipe(proxy, {
    end: true,
  });
});

server.listen(port, host, () => {
  console.info(`Proxy server started on port: ${port}`);
});
