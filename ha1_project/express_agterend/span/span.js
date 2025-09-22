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

module.exports = {
    getTeamById,
    getMembersByTeamId
};
