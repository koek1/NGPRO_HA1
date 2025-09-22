const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;
const { initializeDatabase, getDatabasePath } = require('./db_setup/setup');

// CORS configuration to allow requests from localhost
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    optionsSuccessStatus: 200
}));

// Middleware to parse JSON bodies
app.use(express.json());

let clients = [];

app.get('/', (req, res) => {
    res.json({ message: 'Welkom by die Melktert Express agterend' });
});

// Initialize DB then start the server
initializeDatabase()
    .then((dbPath) => {
        console.log(`SQLite DB ready at ${dbPath}`);
        app.listen(port, () => {
            console.log(`Express API listening at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });


const { getTeamById, getMembersByTeamId } = require('./span/span');

// Endpoint to get team info by team (span) ID
app.get('/teams/:id', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        const team = await getTeamById(spanId);
        if (!team) {
            return res.status(404).json({ error: 'Span nie gevind nie' });
        }
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span inligting laai nie', details: err.message });
    }
});

// Endpoint to get all members for a given team (span) ID
app.get('/teams/:id/members', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        const members = await getMembersByTeamId(spanId);
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span lede laai nie', details: err.message });
    }
});

// Server Sent Events endpoint
app.get("/stream", (req, res) => {
    // Set CORS headers for SSE
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Add new client
    clients.push(res);
    console.log("New client connected, total:", clients.length);
  
    req.on("close", () => {
      clients = clients.filter(c => c !== res);
      console.log("Client disconnected, total:", clients.length);
    });
  });
  
  // POST endpoint to send a message
  app.post("/merk/punte", (req, res) => {
    const message = req.body;
  
    // Send to all connected SSE clients
    clients.forEach(c => c.write(`data: ${JSON.stringify(message)}\n\n`));
  
    res.status(200).json({ ok: true });
  });