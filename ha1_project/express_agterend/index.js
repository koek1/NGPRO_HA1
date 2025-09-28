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
        
        // Ensure Round 2 is marked as final round
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(dbPath);
        db.run('UPDATE Rondte SET is_laaste = 1 WHERE rondte_id = 2', (err) => {
            if (err) {
                console.error('Error updating Round 2 as final:', err);
            } else {
                console.log('Round 2 marked as final round');
            }
            db.close();
        });
        
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

    const { kriteria1, kriteria2, kriteria3, rondteId } = req.body;
    
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

    // Use provided round ID or default to 1 for backward compatibility
    const targetRondteId = rondteId || 1;

    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get criteria IDs for the specified round
    const kriteriaIds = [1, 2, 3]; // Backend, Frontend, Database
    const marks = [kriteria1, kriteria2, kriteria3];

    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Delete existing marks for this team in this round
      db.run('DELETE FROM Punte_span_brug WHERE span_id = ? AND merkblad_id IN (SELECT merkblad_id FROM Merkblad WHERE rondte_id = ?)', [spanId, targetRondteId], (err) => {
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
          db.get('SELECT merkblad_id FROM Merkblad WHERE rondte_id = ? AND kriteria_id = ?', [targetRondteId, kriteriaId], (err, row) => {
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
              db.run('INSERT INTO Merkblad (rondte_id, kriteria_id, totaal) VALUES (?, ?, 100)', [targetRondteId, kriteriaId], function(err) {
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

    // Get round ID from query parameter, default to 1 for backward compatibility
    const rondteId = parseInt(req.query.rondteId) || 1;

    // Validate that team exists
    const team = await getTeamById(spanId);
    if (!team) {
      return res.status(404).json({ error: 'Span nie gevind nie' });
    }

    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get marks for this team in the specified round
    db.all(`
      SELECT 
        psb.punt,
        k.beskrywing as kriteria_naam,
        k.kriteria_id
      FROM Punte_span_brug psb
      JOIN Merkblad m ON psb.merkblad_id = m.merkblad_id
      JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
      WHERE psb.span_id = ? AND m.rondte_id = ?
      ORDER BY k.kriteria_id
    `, [spanId, rondteId], (err, rows) => {
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

    // First, get the teams that should participate in this round
    // For round 1, show all teams. For subsequent rounds, only show remaining teams.
    let teamFilterQuery = '';
    let teamFilterParams = [];
    
    if (rondteId === 1) {
      // Round 1: Show all teams
      teamFilterQuery = 'SELECT span_id FROM Span';
    } else {
      // Round 2+: Only show teams that were not eliminated in the previous round
      teamFilterQuery = `
        SELECT ru.span_id 
        FROM rondte_uitslag ru 
        WHERE ru.rondte_id = ? AND ru.in_gevaar = 0
      `;
      teamFilterParams = [rondteId - 1];
    }

    db.all(teamFilterQuery, teamFilterParams, (teamErr, eligibleTeams) => {
      if (teamErr) {
        res.status(500).json({ error: 'Kon nie deelnemende spanne kry nie', details: teamErr.message });
        db.close();
        return;
      }

      if (eligibleTeams.length === 0) {
        res.json([]);
        db.close();
        return;
      }

      // Create a list of eligible team IDs
      const eligibleTeamIds = eligibleTeams.map(team => team.span_id);
      const placeholders = eligibleTeamIds.map(() => '?').join(',');

      // Now get marks for only the eligible teams
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
        WHERE s.span_id IN (${placeholders})
        ORDER BY s.span_id, k.kriteria_id
      `, [rondteId, ...eligibleTeamIds], (err, rows) => {
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
        // Check if this is the final round
        db.get('SELECT is_laaste FROM Rondte WHERE rondte_id = ?', [rondteId], (roundErr, roundInfo) => {
          if (roundErr) {
            console.error('Error checking if round is final:', roundErr);
            res.status(500).json({ error: 'Kon nie rondte status kry nie', details: roundErr.message });
            db.close();
            return;
          }
          
          const isFinalRound = roundInfo && roundInfo.is_laaste === 1;
          console.log(`Round ${rondteId} is final round:`, isFinalRound);
          
          let totalTeams, teamsToEliminate, remainingTeams, teamsWithStatus, winner;
          
          if (isFinalRound) {
            // Final round: No elimination, just determine the overall winner
            totalTeams = rows.length;
            teamsToEliminate = 0;
            remainingTeams = totalTeams;
            
            console.log(`Final Round ${rondteId}: ${totalTeams} teams - determining overall winner`);
            
            // All teams are safe in final round, just rank them
            teamsWithStatus = rows.map((team, index) => ({
              ...team,
              rank: index + 1,
              is_eliminated: false,
              in_gevaar: 0
            }));
            
            winner = rows.length > 0 ? rows[0] : null;
          } else {
            // Regular round: Eliminate bottom 50%
            totalTeams = rows.length;
            teamsToEliminate = Math.floor(totalTeams * 0.5);
            remainingTeams = totalTeams - teamsToEliminate;
            
            console.log(`Round ${rondteId}: ${totalTeams} teams, eliminating ${teamsToEliminate}, ${remainingTeams} remaining`);
            
            // Mark teams as eliminated or safe
            teamsWithStatus = rows.map((team, index) => ({
              ...team,
              rank: index + 1,
              is_eliminated: index >= remainingTeams,
              in_gevaar: index >= remainingTeams ? 1 : 0
            }));
            
            winner = rows.length > 0 ? rows[0] : null;
          }
          
          const eliminatedTeams = teamsWithStatus.filter(team => team.is_eliminated);
          const remainingTeamsList = teamsWithStatus.filter(team => !team.is_eliminated);
        
        // Save elimination results to rondte_uitslag table (only for non-final rounds)
        let eliminationPromises = [];
        
        if (!isFinalRound) {
          eliminationPromises = teamsWithStatus.map(team => {
            return new Promise((resolve, reject) => {
              db.run(`
                INSERT OR REPLACE INTO rondte_uitslag 
                (span_id, rondte_id, rank, in_gevaar, gemiddelde_punt)
                VALUES (?, ?, ?, ?, ?)
              `, [team.span_id, rondteId, team.rank, team.in_gevaar, Math.round(team.gemiddeld_punt)], (err) => {
                if (err) {
                  console.error(`Error saving elimination status for team ${team.span_id}:`, err);
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          });
        }

        // For final rounds, just resolve immediately
        const eliminationPromise = eliminationPromises.length > 0 
          ? Promise.all(eliminationPromises)
          : Promise.resolve();

        eliminationPromise.then(() => {
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
        }).catch(err => {
          console.error('Error saving elimination results:', err);
          res.status(500).json({ error: 'Kon nie uitslag stoor nie', details: err.message });
          db.close();
        });
        
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
                        const response = {
                          message: isFinalRound ? 'Finale rondte gesluit - Algehele wenner bepaal!' : 'Rondte suksesvol gesluit',
                          rondte_id: rondteId,
                          winner: winner,
                          all_teams: teamsWithStatus,
                          is_final_round: isFinalRound,
                          overall_winner: isFinalRound ? winner : null
                        };

                        // Only include elimination data for non-final rounds
                        if (!isFinalRound) {
                          response.eliminated_teams = eliminatedTeams;
                          response.remaining_teams = remainingTeamsList;
                          response.elimination_summary = {
                            total_teams: totalTeams,
                            eliminated_count: teamsToEliminate,
                            remaining_count: remainingTeams
                          };
                        }

                        res.json(response);
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
              const response = {
                message: isFinalRound ? 'Finale rondte gesluit - Algehele wenner bepaal!' : 'Rondte suksesvol gesluit',
                rondte_id: rondteId,
                winner: winner,
                all_teams: teamsWithStatus,
                is_final_round: isFinalRound,
                overall_winner: isFinalRound ? winner : null
              };

              // Only include elimination data for non-final rounds
              if (!isFinalRound) {
                response.eliminated_teams = eliminatedTeams;
                response.remaining_teams = remainingTeamsList;
                response.elimination_summary = {
                  total_teams: totalTeams,
                  eliminated_count: teamsToEliminate,
                  remaining_count: remainingTeams
                };
              }

              res.json(response);
            }
            if (!updateErr || !updateErr.message.includes('no such column: is_gesluit')) {
              db.close();
            }
          });
        }
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie rondte sluit nie', details: err.message });
  }
});

// Endpoint to get elimination results for a round
app.get('/rounds/:id/elimination', async (req, res) => {
  try {
    const rondteId = parseInt(req.params.id, 10);
    if (isNaN(rondteId)) {
      return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // Get elimination results from rondte_uitslag table
    db.all(`
      SELECT 
        ru.span_id,
        s.naam,
        s.projek_beskrywing,
        s.span_bio,
        s.logo,
        ru.rank,
        ru.in_gevaar,
        ru.gemiddelde_punt
      FROM rondte_uitslag ru
      JOIN Span s ON s.span_id = ru.span_id
      WHERE ru.rondte_id = ?
      ORDER BY ru.rank
    `, [rondteId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Kon nie uitslag kry nie', details: err.message });
        db.close();
      } else {
        const eliminatedTeams = rows.filter(team => team.in_gevaar === 1);
        const remainingTeams = rows.filter(team => team.in_gevaar === 0);
        
        res.json({
          rondte_id: rondteId,
          all_teams: rows,
          eliminated_teams: eliminatedTeams,
          remaining_teams: remainingTeams,
          elimination_summary: {
            total_teams: rows.length,
            eliminated_count: eliminatedTeams.length,
            remaining_count: remainingTeams.length
          }
        });
        db.close();
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie uitslag kry nie', details: err.message });
  }
});

// Endpoint to create next round with remaining teams
app.post('/rounds/:id/create-next', async (req, res) => {
  try {
    const currentRoundId = parseInt(req.params.id, 10);
    if (isNaN(currentRoundId)) {
      return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath);

    // First check if current round is closed
    db.get('SELECT is_gesluit FROM Rondte WHERE rondte_id = ?', [currentRoundId], (err, round) => {
      if (err) {
        console.error('Error checking round status:', err);
        res.status(500).json({ error: 'Kon nie rondte status kry nie', details: err.message });
        db.close();
      } else if (!round) {
        console.error('Round not found:', currentRoundId);
        res.status(404).json({ error: 'Rondte nie gevind nie' });
        db.close();
      } else if (!round.is_gesluit) {
        console.error('Round not closed:', currentRoundId, 'is_gesluit:', round.is_gesluit);
        res.status(400).json({ error: 'Rondte moet eers gesluit word voordat volgende rondte geskep kan word' });
        db.close();
      } else {
        console.log('Round is closed, checking for remaining teams...');
        
        // First check if there are any elimination results for this round
        db.all('SELECT COUNT(*) as count FROM rondte_uitslag WHERE rondte_id = ?', [currentRoundId], (countErr, countResult) => {
          if (countErr) {
            console.error('Error checking elimination results:', countErr);
            res.status(500).json({ error: 'Kon nie uitslag data kry nie', details: countErr.message });
            db.close();
            return;
          }
          
          const eliminationCount = countResult[0].count;
          console.log('Elimination results found:', eliminationCount);
          
          if (eliminationCount === 0) {
            res.status(400).json({ error: 'Geen uitslag data vir hierdie rondte nie. Maak seker die rondte is gesluit met eliminering.' });
            db.close();
            return;
          }
          
          // Get remaining teams from current round
          db.all(`
            SELECT ru.span_id, s.naam, s.projek_beskrywing, s.span_bio, s.logo
            FROM rondte_uitslag ru
            JOIN Span s ON s.span_id = ru.span_id
            WHERE ru.rondte_id = ? AND ru.in_gevaar = 0
            ORDER BY ru.rank
          `, [currentRoundId], (err, remainingTeams) => {
            if (err) {
              console.error('Error getting remaining teams:', err);
              res.status(500).json({ error: 'Kon nie oorblywende spanne kry nie', details: err.message });
              db.close();
            } else {
              console.log('Remaining teams found:', remainingTeams.length);
              if (remainingTeams.length === 0) {
                console.error('No remaining teams for next round');
                res.status(400).json({ error: 'Geen oorblywende spanne vir volgende rondte nie. Maak seker die rondte is gesluit en spanne is geëlimineer.' });
                db.close();
              } else {
                // Create next round
                const nextRoundId = currentRoundId + 1;
                const isLastRound = nextRoundId === 2; // Round 2 is always the final round
                
                db.run(`
                  INSERT INTO Rondte (rondte_id, is_eerste, is_laaste, is_gesluit, max_spanne)
                  VALUES (?, 0, ?, 0, ?)
                `, [nextRoundId, isLastRound ? 1 : 0, remainingTeams.length], (insertErr) => {
                  if (insertErr) {
                    res.status(500).json({ error: 'Kon nie volgende rondte skep nie', details: insertErr.message });
                    db.close();
                  } else {
                    // Copy criteria from current round to next round
                    db.all(`
                      SELECT kriteria_id, totaal
                      FROM Merkblad
                      WHERE rondte_id = ?
                    `, [currentRoundId], (criteriaErr, criteria) => {
                      if (criteriaErr) {
                        console.error('Error copying criteria:', criteriaErr);
                        // Continue even if criteria copy fails
                        res.json({
                          message: 'Volgende rondte suksesvol geskep',
                          next_round_id: nextRoundId,
                          remaining_teams: remainingTeams,
                          is_final_round: isLastRound,
                          teams_count: remainingTeams.length
                        });
                        db.close();
                      } else {
                        // Insert criteria for next round
                        const criteriaPromises = criteria.map(crit => {
                          return new Promise((resolve, reject) => {
                            db.run(`
                              INSERT INTO Merkblad (rondte_id, kriteria_id, totaal)
                              VALUES (?, ?, ?)
                            `, [nextRoundId, crit.kriteria_id, crit.totaal], (err) => {
                              if (err) reject(err);
                              else resolve();
                            });
                          });
                        });

                        Promise.all(criteriaPromises).then(() => {
                          res.json({
                            message: 'Volgende rondte suksesvol geskep',
                            next_round_id: nextRoundId,
                            remaining_teams: remainingTeams,
                            is_final_round: isLastRound,
                            teams_count: remainingTeams.length,
                            criteria_copied: criteria.length
                          });
                          db.close();
                        }).catch(criteriaInsertErr => {
                          console.error('Error inserting criteria for next round:', criteriaInsertErr);
                          res.json({
                            message: 'Volgende rondte geskep, maar kriteria kon nie gekopieer word nie',
                            next_round_id: nextRoundId,
                            remaining_teams: remainingTeams,
                            is_final_round: isLastRound,
                            teams_count: remainingTeams.length,
                            warning: 'Kriteria moet handmatig bygevoeg word'
                          });
                          db.close();
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie volgende rondte skep nie', details: err.message });
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