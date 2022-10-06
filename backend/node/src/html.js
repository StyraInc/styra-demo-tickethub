import express from "express";
import path from "path";
import {fileURLToPath} from "url";

export const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set static dir
const staticDir = path.join(__dirname, 'public')
router.use(express.static(staticDir))

// Serve main page
router.get('/', (_, res) => {
  res.sendFile('tickets.html', {root: staticDir})
})

router.get('/tickets', (_, res) => {
  res.sendFile('tickets.html', {root: staticDir})
})

router.get('/ticket/new', (_, res) => {
  res.sendFile('new_ticket.html', {root: staticDir})
})

router.get('/ticket/*', (_, res) => {
  res.sendFile('ticket.html', {root: staticDir})
})

router.get('/admin', (_, res) => {
  res.sendFile('admin.html', {root: staticDir})
})