const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

/**
 * Get team info by team (span) ID.
 * @param {number} spanId
 * @returns {Promise<Object|null>}
 */
function getTeamById(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.get(
            `SELECT span_id, naam, projek_beskrywing, span_bio, logo
             FROM Span
             WHERE span_id = ?`,
            [spanId],
            (err, row) => {
                db.close();
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(row);
            }
        );
    });
}

/**
 * Get all members for a given team (span) ID.
 * @param {number} spanId
 * @returns {Promise<Array>}
 */
function getMembersByTeamId(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.all(
            `SELECT lid_id, span_id, naam, bio, foto
             FROM Lid
             WHERE span_id = ?`,
            [spanId],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

/**
 * Check if a team name already exists
 * @param {string} naam - Team name to check
 * @param {number} excludeId - Team ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if name exists, false otherwise
 */
function teamNameExists(naam, excludeId = null) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        let query = `SELECT COUNT(*) as count FROM Span WHERE naam = ?`;
        let params = [naam];
        
        if (excludeId) {
            query += ` AND span_id != ?`;
            params.push(excludeId);
        }

        db.get(query, params, (err, row) => {
            db.close();
            if (err) return reject(err);
            resolve(row.count > 0);
        });
    });
}

/**
 * Create a new team (span).
 * @param {Object} teamData - Team data object
 * @param {string} teamData.naam - Team name
 * @param {string} teamData.projek_beskrywing - Project description
 * @param {string} teamData.span_bio - Team bio
 * @param {string} teamData.logo - Team logo URL (optional)
 * @returns {Promise<Object>} Created team object
 */
function createTeam(teamData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if team name already exists
            const nameExists = await teamNameExists(teamData.naam);
            if (nameExists) {
                return reject(new Error('Team name already exists'));
            }

            const dbPath = getDatabasePath();
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) return reject(err);
            });

            const { naam, projek_beskrywing, span_bio, logo } = teamData;
            
            db.run(
                `INSERT INTO Span (naam, projek_beskrywing, span_bio, logo)
                 VALUES (?, ?, ?, ?)`,
                [naam, projek_beskrywing, span_bio, logo || null],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                
                // Get the created team
                db.get(
                    `SELECT span_id, naam, projek_beskrywing, span_bio, logo
                     FROM Span
                     WHERE span_id = ?`,
                    [this.lastID],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Get all teams (spanne).
 * @returns {Promise<Array>} Array of team objects
 */
function getAllTeams() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.all(
            `SELECT span_id, naam, projek_beskrywing, span_bio, logo
             FROM Span
             ORDER BY span_id`,
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

/**
 * Update a team (span).
 * @param {number} spanId - Team ID to update
 * @param {Object} teamData - Updated team data
 * @returns {Promise<Object>} Updated team object
 */
function updateTeam(spanId, teamData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if team name already exists (excluding current team)
            const nameExists = await teamNameExists(teamData.naam, spanId);
            if (nameExists) {
                return reject(new Error('Team name already exists'));
            }

            const dbPath = getDatabasePath();
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) return reject(err);
            });

            const { naam, projek_beskrywing, span_bio, logo } = teamData;
        
        db.run(
            `UPDATE Span 
             SET naam = ?, projek_beskrywing = ?, span_bio = ?, logo = ?
             WHERE span_id = ?`,
            [naam, projek_beskrywing, span_bio, logo || null, spanId],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                
                if (this.changes === 0) {
                    db.close();
                    return reject(new Error('Team not found'));
                }
                
                // Get the updated team
                db.get(
                    `SELECT span_id, naam, projek_beskrywing, span_bio, logo
                     FROM Span
                     WHERE span_id = ?`,
                    [spanId],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Delete a team (span).
 * @param {number} spanId - Team ID to delete
 * @returns {Promise<boolean>} Success status
 */
function deleteTeam(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        // Delete all related data for the team
        db.serialize(() => {
            // Delete all marks for this team
            db.run(`DELETE FROM Punte_span_brug WHERE span_id = ?`, [spanId], (err) => {
                if (err) {
                    db.close();
                    return reject(err);
                }
            });
            
            // Delete all round results for this team
            db.run(`DELETE FROM rondte_uitslag WHERE span_id = ?`, [spanId], (err) => {
                if (err) {
                    db.close();
                    return reject(err);
                }
            });
            
            // Delete all members of the team
            db.run(`DELETE FROM Lid WHERE span_id = ?`, [spanId], (err) => {
                if (err) {
                    db.close();
                    return reject(err);
                }
            });
            
            // Finally delete the team itself
            db.run(`DELETE FROM Span WHERE span_id = ?`, [spanId],
                    function(err) {
                        db.close();
                        if (err) return reject(err);
                        if (this.changes === 0) {
                            return reject(new Error('Team not found'));
                        }
                        resolve(true);
                    }
                );
            }
        );
    });
}

/**
 * Create a new team member (lid).
 * @param {Object} memberData - Member data object
 * @param {number} memberData.span_id - Team ID
 * @param {string} memberData.naam - Member name
 * @param {string} memberData.bio - Member bio
 * @param {string} memberData.foto - Member photo URL (optional)
 * @returns {Promise<Object>} Created member object
 */
function createMember(memberData) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        const { span_id, naam, bio, foto } = memberData;
        
        db.run(
            `INSERT INTO Lid (span_id, naam, bio, foto)
             VALUES (?, ?, ?, ?)`,
            [span_id, naam, bio, foto || null],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                
                // Get the created member
                db.get(
                    `SELECT lid_id, span_id, naam, bio, foto
                     FROM Lid
                     WHERE lid_id = ?`,
                    [this.lastID],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
    });
}

/**
 * Update a team member (lid).
 * @param {number} lidId - Member ID to update
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object>} Updated member object
 */
function updateMember(lidId, memberData) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        const { naam, bio, foto } = memberData;
        
        db.run(
            `UPDATE Lid 
             SET naam = ?, bio = ?, foto = ?
             WHERE lid_id = ?`,
            [naam, bio, foto || null, lidId],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                
                if (this.changes === 0) {
                    db.close();
                    return reject(new Error('Member not found'));
                }
                
                // Get the updated member
                db.get(
                    `SELECT lid_id, span_id, naam, bio, foto
                     FROM Lid
                     WHERE lid_id = ?`,
                    [lidId],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
    });
}

/**
 * Delete a team member (lid).
 * @param {number} lidId - Member ID to delete
 * @returns {Promise<boolean>} Success status
 */
function deleteMember(lidId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `DELETE FROM Lid WHERE lid_id = ?`,
            [lidId],
            function(err) {
                db.close();
                if (err) return reject(err);
                if (this.changes === 0) {
                    return reject(new Error('Member not found'));
                }
                resolve(true);
            }
        );
    });
}

/**
 * Get a specific team member by member ID.
 * @param {number} lidId - Member ID to fetch
 * @returns {Promise<Object|null>} Member object or null if not found
 */
function getMemberById(lidId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.get(
            `SELECT lid_id, span_id, naam, bio, foto
             FROM Lid
             WHERE lid_id = ?`,
            [lidId],
            (err, row) => {
                db.close();
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(row);
            }
        );
    });
}

module.exports = {
    getTeamById,
    getMembersByTeamId,
    createTeam,
    getAllTeams,
    updateTeam,
    deleteTeam,
    createMember,
    updateMember,
    deleteMember,
    getMemberById,
    teamNameExists
};
