const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 4000;
const { initializeDatabase, getDatabasePath } = require('./db_setup/setup');

// CORS configuration to allow requests from localhost
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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


const { getTeamById, getMembersByTeamId, createTeam, getAllTeams, updateTeam, deleteTeam, createMember, updateMember, deleteMember, getMemberById } = require('./span/span');

// Endpoint to get all teams (must come before /teams/:id)
app.get('/teams', async (req, res) => {
    try {
        const teams = await getAllTeams();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie spanne laai nie', details: err.message });
    }
});

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

// Endpoint to get a specific member by ID
app.get('/members/:id', async (req, res) => {
    const lidId = parseInt(req.params.id, 10);
    if (isNaN(lidId)) {
        return res.status(400).json({ error: 'Ongeldige lid ID' });
    }
    try {
        const member = await getMemberById(lidId);
        if (!member) {
            return res.status(404).json({ error: 'Span lid nie gevind nie' });
        }
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span lid laai nie', details: err.message });
    }
});

// Endpoint to create a new team
app.post('/teams', async (req, res) => {
    try {
        const { naam, projek_beskrywing, span_bio, logo } = req.body;
        
        // Validate required fields
        if (!naam || !projek_beskrywing || !span_bio) {
            return res.status(400).json({ 
                error: 'Naam, projek beskrywing en span bio is verpligtend' 
            });
        }
        
        const teamData = {
            naam: naam.trim(),
            projek_beskrywing: projek_beskrywing.trim(),
            span_bio: span_bio.trim(),
            logo: logo ? logo.trim() : null
        };
        
        const newTeam = await createTeam(teamData);
        res.status(201).json(newTeam);
    } catch (err) {
        if (err.message === 'Team name already exists') {
            return res.status(409).json({ error: 'Span naam bestaan reeds' });
        }
        res.status(500).json({ error: 'Kon nie nuwe span skep nie', details: err.message });
    }
});

// Endpoint to update a team
app.put('/teams/:id', async (req, res) => {
    try {
        const spanId = parseInt(req.params.id, 10);
        if (isNaN(spanId)) {
            return res.status(400).json({ error: 'Ongeldige span ID' });
        }

        const { naam, projek_beskrywing, span_bio, logo } = req.body;
        
        // Validate required fields
        if (!naam || !projek_beskrywing || !span_bio) {
            return res.status(400).json({ 
                error: 'Naam, projek beskrywing en span bio is verpligtend' 
            });
        }
        
        const teamData = {
            naam: naam.trim(),
            projek_beskrywing: projek_beskrywing.trim(),
            span_bio: span_bio.trim(),
            logo: logo ? logo.trim() : null
        };
        
        const updatedTeam = await updateTeam(spanId, teamData);
        res.json(updatedTeam);
    } catch (err) {
        if (err.message === 'Team not found') {
            return res.status(404).json({ error: 'Span nie gevind nie' });
        }
        if (err.message === 'Team name already exists') {
            return res.status(409).json({ error: 'Span naam bestaan reeds' });
        }
        res.status(500).json({ error: 'Kon nie span opdateer nie', details: err.message });
    }
});

// Endpoint to delete a team
app.delete('/teams/:id', async (req, res) => {
    try {
        const spanId = parseInt(req.params.id, 10);
        if (isNaN(spanId)) {
            return res.status(400).json({ error: 'Ongeldige span ID' });
        }

        await deleteTeam(spanId);
        res.status(204).send();
    } catch (err) {
        if (err.message === 'Team not found') {
            return res.status(404).json({ error: 'Span nie gevind nie' });
        }
        res.status(500).json({ error: 'Kon nie span verwyder nie', details: err.message });
    }
});

// Endpoint to create a new team member
app.post('/teams/:id/members', async (req, res) => {
    try {
        const spanId = parseInt(req.params.id, 10);
        if (isNaN(spanId)) {
            return res.status(400).json({ error: 'Ongeldige span ID' });
        }

        // Validate that team exists
        const team = await getTeamById(spanId);
        if (!team) {
            return res.status(404).json({ error: 'Span nie gevind nie' });
        }

        const { naam, bio, foto } = req.body;
        
        // Validate required fields
        if (!naam || !bio) {
            return res.status(400).json({ 
                error: 'Naam en bio is verpligtend' 
            });
        }
        
        const memberData = {
            span_id: spanId,
            naam: naam.trim(),
            bio: bio.trim(),
            foto: foto ? foto.trim() : null
        };
        
        const newMember = await createMember(memberData);
        res.status(201).json(newMember);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie nuwe span lid skep nie', details: err.message });
    }
});

// Endpoint to update a team member
app.put('/members/:id', async (req, res) => {
    try {
        const lidId = parseInt(req.params.id, 10);
        if (isNaN(lidId)) {
            return res.status(400).json({ error: 'Ongeldige lid ID' });
        }

        const { naam, bio, foto } = req.body;
        
        // Validate required fields
        if (!naam || !bio) {
            return res.status(400).json({ 
                error: 'Naam en bio is verpligtend' 
            });
        }
        
        const memberData = {
            naam: naam.trim(),
            bio: bio.trim(),
            foto: foto ? foto.trim() : null
        };
        
        const updatedMember = await updateMember(lidId, memberData);
        res.json(updatedMember);
    } catch (err) {
        if (err.message === 'Member not found') {
            return res.status(404).json({ error: 'Span lid nie gevind nie' });
        }
        res.status(500).json({ error: 'Kon nie span lid opdateer nie', details: err.message });
    }
});

// Endpoint to delete a team member
app.delete('/members/:id', async (req, res) => {
    try {
        const lidId = parseInt(req.params.id, 10);
        if (isNaN(lidId)) {
            return res.status(400).json({ error: 'Ongeldige lid ID' });
        }

        await deleteMember(lidId);
        res.status(204).send();
    } catch (err) {
        if (err.message === 'Member not found') {
            return res.status(404).json({ error: 'Span lid nie gevind nie' });
        }
        res.status(500).json({ error: 'Kon nie span lid verwyder nie', details: err.message });
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