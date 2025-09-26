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

// Endpoint to store marks for a team
app.post('/teams/:id/marks', async (req, res) => {
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

    const { kriteria1, kriteria2, kriteria3 } = req.body;
    
    // Validate marks are provided and are numbers
    if (kriteria1 === undefined || kriteria2 === undefined || kriteria3 === undefined) {
      return res.status(400).json({ 
        error: 'Alle kriteria punte is verpligtend' 
      });
    }

    if (isNaN(kriteria1) || isNaN(kriteria2) || isNaN(kriteria3)) {
      return res.status(400).json({ 
        error: 'Punte moet nommers wees' 
      });
    }

    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get the first round and criteria IDs (assuming we're using the first round)
    const rondteId = 1;
    const kriteriaIds = [1, 2, 3]; // Backend, Frontend, Database
    const marks = [kriteria1, kriteria2, kriteria3];

    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Delete existing marks for this team in this round
      db.run('DELETE FROM Punte_span_brug WHERE span_id = ? AND merkblad_id IN (SELECT merkblad_id FROM Merkblad WHERE rondte_id = ?)', [spanId, rondteId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: 'Kon nie bestaande punte verwyder nie', details: err.message });
          db.close();
          return;
        }

        // Insert new marks
        let completed = 0;
        let hasError = false;

        kriteriaIds.forEach((kriteriaId, index) => {
          // Get or create merkblad for this round and criteria
          db.get('SELECT merkblad_id FROM Merkblad WHERE rondte_id = ? AND kriteria_id = ?', [rondteId, kriteriaId], (err, row) => {
            if (err) {
              hasError = true;
              db.run('ROLLBACK');
              res.status(500).json({ error: 'Kon nie merkblad kry nie', details: err.message });
              db.close();
              return;
            }

            let merkbladId;
            if (row) {
              merkbladId = row.merkblad_id;
              insertMark(merkbladId, marks[index]);
            } else {
              // Create new merkblad
              db.run('INSERT INTO Merkblad (rondte_id, kriteria_id, totaal) VALUES (?, ?, 100)', [rondteId, kriteriaId], function(err) {
                if (err) {
                  hasError = true;
                  db.run('ROLLBACK');
                  res.status(500).json({ error: 'Kon nie merkblad skep nie', details: err.message });
                  db.close();
                  return;
                }
                merkbladId = this.lastID;
                insertMark(merkbladId, marks[index]);
              });
            }

            function insertMark(merkbladId, mark) {
              // Insert the mark
              db.run('INSERT INTO Punte_span_brug (merkblad_id, span_id, punt) VALUES (?, ?, ?)', [merkbladId, spanId, mark], function(err) {
                if (err) {
                  hasError = true;
                  db.run('ROLLBACK');
                  res.status(500).json({ error: 'Kon nie punt stoor nie', details: err.message });
                  db.close();
                  return;
                }

                completed++;
                if (completed === kriteriaIds.length && !hasError) {
                  db.run('COMMIT', (err) => {
                    if (err) {
                      res.status(500).json({ error: 'Kon nie transaksie voltooi nie', details: err.message });
                    } else {
                      res.status(201).json({ 
                        message: 'Punte suksesvol gestoor',
                        span_id: spanId,
                        marks: {
                          kriteria1: kriteria1,
                          kriteria2: kriteria2,
                          kriteria3: kriteria3
                        }
                      });
                    }
                    db.close();
                  });
                }
              });
            }
          });
        });
      });
    });

  } catch (err) {
    res.status(500).json({ error: 'Kon nie punte stoor nie', details: err.message });
  }
});

// Endpoint to get marks for a team
app.get('/teams/:id/marks', async (req, res) => {
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

    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get marks for this team
    db.all(`
      SELECT 
        psb.punt,
        k.beskrywing as kriteria_naam,
        k.kriteria_id
      FROM Punte_span_brug psb
      JOIN Merkblad m ON psb.merkblad_id = m.merkblad_id
      JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
      WHERE psb.span_id = ? AND m.rondte_id = 1
      ORDER BY k.kriteria_id
    `, [spanId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie punte laai nie', details: err.message });
      } else {
        // Format the response
        const marks = {
          kriteria1: null,
          kriteria2: null,
          kriteria3: null
        };

        rows.forEach(row => {
          if (row.kriteria_id === 1) marks.kriteria1 = row.punt;
          if (row.kriteria_id === 2) marks.kriteria2 = row.punt;
          if (row.kriteria_id === 3) marks.kriteria3 = row.punt;
        });

        // Only consider it as having marks if at least one mark is greater than 0
        const hasActualMarks = rows.length > 0 && (marks.kriteria1 > 0 || marks.kriteria2 > 0 || marks.kriteria3 > 0);

        res.json({
          span_id: spanId,
          has_marks: hasActualMarks,
          marks: marks,
          details: rows
        });
      }
      db.close();
    });

  } catch (err) {
    res.status(500).json({ error: 'Kon nie punte laai nie', details: err.message });
  }
});

// Endpoint to delete marks for a team
app.delete('/teams/:id/marks', async (req, res) => {
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

    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Delete all marks for this team
    db.run('DELETE FROM Punte_span_brug WHERE span_id = ?', [spanId], function(err) {
      if (err) {
        res.status(500).json({ error: 'Kon nie punte verwyder nie', details: err.message });
      } else {
        res.status(200).json({ 
          message: 'Punte suksesvol verwyder',
          span_id: spanId,
          deleted_rows: this.changes
        });
      }
      db.close();
    });

  } catch (err) {
    res.status(500).json({ error: 'Kon nie punte verwyder nie', details: err.message });
  }
});

// Endpoint to get all criteria
app.get('/criteria', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    db.all('SELECT * FROM Kriteria ORDER BY kriteria_id', (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie kriteria laai nie', details: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie kriteria laai nie', details: err.message });
  }
});

// Endpoint to get all rounds
app.get('/rounds', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    db.all('SELECT * FROM Rondte ORDER BY rondte_id', (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie rondtes laai nie', details: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie rondtes laai nie', details: err.message });
  }
});

// Endpoint to get all teams with their marks for a specific round
app.get('/rounds/:id/teams-marks', async (req, res) => {
  try {
    const rondteId = parseInt(req.params.id, 10);
    if (isNaN(rondteId)) {
      return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    db.all(`
      SELECT 
        s.span_id,
        s.naam as span_naam,
        s.projek_beskrywing,
        s.span_bio,
        s.logo,
        k.kriteria_id,
        k.beskrywing as kriteria_naam,
        COALESCE(psb.punt, 0) as punt
      FROM Span s
      CROSS JOIN Kriteria k
      LEFT JOIN Merkblad m ON m.rondte_id = ? AND m.kriteria_id = k.kriteria_id
      LEFT JOIN Punte_span_brug psb ON psb.span_id = s.span_id AND psb.merkblad_id = m.merkblad_id
      ORDER BY s.span_id, k.kriteria_id
    `, [rondteId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie span punte laai nie', details: err.message });
      } else {
        // Group by team
        const teamsMap = new Map();
        rows.forEach(row => {
          if (!teamsMap.has(row.span_id)) {
            teamsMap.set(row.span_id, {
              span_id: row.span_id,
              naam: row.span_naam,
              projek_beskrywing: row.projek_beskrywing,
              span_bio: row.span_bio,
              logo: row.logo,
              marks: {}
            });
          }
          teamsMap.get(row.span_id).marks[row.kriteria_id] = row.punt;
        });

        const teams = Array.from(teamsMap.values());
        res.json(teams);
      }
      db.close();
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie span punte laai nie', details: err.message });
  }
});

// Endpoint to close a round and determine winner
app.post('/rounds/:id/close', async (req, res) => {
  try {
    const rondteId = parseInt(req.params.id, 10);
    if (isNaN(rondteId)) {
      return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get all teams with their average marks for this round
    db.all(`
      SELECT 
        s.span_id,
        s.naam,
        s.projek_beskrywing,
        s.span_bio,
        s.logo,
        AVG(psb.punt) as gemiddeld_punt,
        COUNT(psb.punt) as aantal_kriteria
      FROM Span s
      LEFT JOIN Merkblad m ON m.rondte_id = ?
      LEFT JOIN Punte_span_brug psb ON psb.span_id = s.span_id AND psb.merkblad_id = m.merkblad_id
      GROUP BY s.span_id, s.naam, s.projek_beskrywing, s.span_bio, s.logo
      HAVING aantal_kriteria > 0
      ORDER BY gemiddeld_punt DESC
    `, [rondteId], (err, rows) => {
      if (err) {
        console.error('Error in close round query:', err);
        res.status(500).json({ error: 'Kon nie rondte sluit nie', details: err.message });
        db.close();
      } else {
        const winner = rows.length > 0 ? rows[0] : null;
        
        // If there's a winner, get their team members
        if (winner) {
          db.all(`
            SELECT lid_id, naam, bio, foto
            FROM Lid
            WHERE span_id = ?
            ORDER BY lid_id
          `, [winner.span_id], (membersErr, members) => {
            if (membersErr) {
              console.error('Error getting winner members:', membersErr);
              // Continue with closing round even if members fetch fails
              closeRound();
            } else {
              winner.members = members || [];
              closeRound();
            }
          });
        } else {
          closeRound();
        }
        
        function closeRound() {
          // Update round status to closed
          db.run('UPDATE Rondte SET is_gesluit = 1 WHERE rondte_id = ?', [rondteId], (updateErr) => {
            if (updateErr) {
              console.error('Error updating round status:', updateErr);
              // If the column doesn't exist, try to add it first
              if (updateErr.message.includes('no such column: is_gesluit')) {
                console.log('is_gesluit column missing, attempting to add it...');
                db.run('ALTER TABLE Rondte ADD COLUMN is_gesluit INTEGER NOT NULL DEFAULT 0', (alterErr) => {
                  if (alterErr) {
                    console.error('Error adding is_gesluit column:', alterErr);
                    res.status(500).json({ error: 'Kon nie is_gesluit kolom byvoeg nie', details: alterErr.message });
                  } else {
                    // Try the update again
                    db.run('UPDATE Rondte SET is_gesluit = 1 WHERE rondte_id = ?', [rondteId], (retryErr) => {
                      if (retryErr) {
                        res.status(500).json({ error: 'Kon nie rondte status opdateer nie', details: retryErr.message });
                      } else {
                        res.json({
                          message: 'Rondte suksesvol gesluit',
                          rondte_id: rondteId,
                          winner: winner,
                          all_teams: rows
                        });
                      }
                      db.close();
                    });
                  }
                });
              } else {
                res.status(500).json({ error: 'Kon nie rondte status opdateer nie', details: updateErr.message });
              }
            } else {
              console.log(`Round ${rondteId} closed successfully. Winner:`, winner?.naam || 'None');
              res.json({
                message: 'Rondte suksesvol gesluit',
                rondte_id: rondteId,
                winner: winner,
                all_teams: rows
              });
            }
            if (!updateErr || !updateErr.message.includes('no such column: is_gesluit')) {
              db.close();
            }
          });
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie rondte sluit nie', details: err.message });
  }
});

// Endpoint to get winner for a closed round
app.get('/rounds/:id/winner', async (req, res) => {
  try {
    const rondteId = parseInt(req.params.id, 10);
    if (isNaN(rondteId)) {
      return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Check if round is closed
    db.get('SELECT is_gesluit FROM Rondte WHERE rondte_id = ?', [rondteId], (err, round) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie rondte status kry nie', details: err.message });
      } else if (!round) {
        res.status(404).json({ error: 'Rondte nie gevind nie' });
      } else if (!round.is_gesluit) {
        res.status(400).json({ error: 'Rondte is nog nie gesluit nie' });
      } else {
        // Get winner with team members
        db.get(`
          SELECT 
            s.span_id,
            s.naam,
            s.projek_beskrywing,
            s.span_bio,
            s.logo,
            AVG(psb.punt) as gemiddeld_punt
          FROM Span s
          LEFT JOIN Merkblad m ON m.rondte_id = ?
          LEFT JOIN Punte_span_brug psb ON psb.span_id = s.span_id AND psb.merkblad_id = m.merkblad_id
          GROUP BY s.span_id, s.naam, s.projek_beskrywing, s.span_bio, s.logo
          ORDER BY gemiddeld_punt DESC
          LIMIT 1
        `, [rondteId], (winnerErr, winner) => {
          if (winnerErr) {
            res.status(500).json({ error: 'Kon nie wenner kry nie', details: winnerErr.message });
            db.close();
          } else if (!winner) {
            res.json(null);
            db.close();
          } else {
            // Get team members for the winner
            db.all(`
              SELECT lid_id, naam, bio, foto
              FROM Lid
              WHERE span_id = ?
              ORDER BY lid_id
            `, [winner.span_id], (membersErr, members) => {
              if (membersErr) {
                res.status(500).json({ error: 'Kon nie span lede kry nie', details: membersErr.message });
              } else {
                res.json({
                  ...winner,
                  members: members || []
                });
              }
              db.close();
            });
          }
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie wenner kry nie', details: err.message });
  }
});