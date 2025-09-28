const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

function getDatabasePath() {
    return path.resolve(__dirname, '..', 'melktert.db');
}

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();

        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
        });

        db.serialize(() => {
            db.run('PRAGMA foreign_keys = ON');

            // Span table
            db.run(`
                CREATE TABLE IF NOT EXISTS Span (
                    span_id INTEGER PRIMARY KEY,
                    naam TEXT NOT NULL,
                    logo TEXT,
                    projek_beskrywing TEXT,
                    span_bio TEXT
                )
            `);

            // Lid table
            db.run(`
                CREATE TABLE IF NOT EXISTS Lid (
                    lid_id INTEGER PRIMARY KEY,
                    span_id INTEGER NOT NULL,
                    naam TEXT NOT NULL,
                    foto TEXT,
                    bio TEXT,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // Rondte table
            // max_spanne is 'n % van die spanne wat deelneem
            db.run(`
                CREATE TABLE IF NOT EXISTS Rondte (
                    rondte_id INTEGER PRIMARY KEY,
                    is_eerste INTEGER NOT NULL DEFAULT 0,
                    is_laaste INTEGER NOT NULL DEFAULT 0,
                    is_gesluit INTEGER NOT NULL DEFAULT 0,
                    max_spanne REAL NOT NULL 
                )
            `);

            // Kriteria table
            db.run(`
                CREATE TABLE IF NOT EXISTS Kriteria (
                    kriteria_id INTEGER PRIMARY KEY,
                    beskrywing TEXT NOT NULL,
                    default_totaal INTEGER NOT NULL
                )
            `);

            // Merkblad table
            db.run(`
                CREATE TABLE IF NOT EXISTS Merkblad (
                    merkblad_id INTEGER PRIMARY KEY,
                    rondte_id INTEGER NOT NULL,
                    kriteria_id INTEGER NOT NULL,
                    totaal INTEGER,
                    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE,
                    FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
                )
            `);

            // Punte_span_brug table
            db.run(`
                CREATE TABLE IF NOT EXISTS Punte_span_brug (
                    id INTEGER PRIMARY KEY,
                    merkblad_id INTEGER NOT NULL,
                    span_id INTEGER NOT NULL,
                    punt INTEGER NOT NULL,
                    FOREIGN KEY (merkblad_id) REFERENCES merkblad(merkblad_id) ON DELETE CASCADE,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // rondte_uitslag table
            db.run(`
                CREATE TABLE IF NOT EXISTS rondte_uitslag (
                    span_id INTEGER NOT NULL,
                    rondte_id INTEGER NOT NULL,
                    rank INTEGER,
                    in_gevaar INTEGER NOT NULL DEFAULT 1,
                    gemiddelde_punt INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (span_id, rondte_id),
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
                    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE
                )
            `);

            // Insert dummy data for Span and Lid tables
            db.run(`
                INSERT OR IGNORE INTO Span (span_id, naam, projek_beskrywing, span_bio) 
                VALUES (1, 'Melktert Masters', 'Die toekoms van wegneem melktert bestellings', 'Ons skep full stack web apps')
            `);

            db.run(`
                INSERT OR IGNORE INTO Lid (lid_id, span_id, naam, bio) 
                VALUES 
                (1, 1, 'Die Leier', 'Hou van projek bestuur.'),
                (2, 1, 'Die react dev', 'Hou van gebruikerskoppelvlakke skep.'),
                (3, 1, 'Die express dev', 'Hou van agterend dienste skep.'),
                (4, 1, 'Die DB dev', 'Hou van data en databasisse.')
            `);

            // Insert dummy data for Kriteria table
            db.run(`
                INSERT OR IGNORE INTO Kriteria (kriteria_id, beskrywing, default_totaal) 
                VALUES 
                (1, 'Backend Development', 100),
                (2, 'Frontend Development', 100),
                (3, 'Database Design', 100)
            `);

            // Insert first and only round data for Rondte table
            db.run(`
                INSERT OR IGNORE INTO Rondte (rondte_id, is_eerste, is_laaste, is_gesluit, max_spanne) 
                VALUES 
                (1, 1, 1, 0, 100)
            `);

            // Check if is_gesluit column exists after table creation, if not add it
            db.all("PRAGMA table_info(Rondte)", (err, columns) => {
                if (err) {
                    console.log('Error getting table columns:', err.message);
                } else {
                    const hasIsGesluit = columns.some(col => col.name === 'is_gesluit');
                    if (!hasIsGesluit) {
                        console.log('Adding is_gesluit column to existing table...');
                        db.run(`ALTER TABLE Rondte ADD COLUMN is_gesluit INTEGER NOT NULL DEFAULT 0`, (alterErr) => {
                            if (alterErr) {
                                console.log('Error adding is_gesluit column:', alterErr.message);
                            } else {
                                console.log('is_gesluit column added successfully');
                                // Update existing records to have is_gesluit = 0
                                db.run('UPDATE Rondte SET is_gesluit = 0 WHERE is_gesluit IS NULL', (updateErr) => {
                                    if (updateErr) {
                                        console.log('Error updating existing records:', updateErr.message);
                                    } else {
                                        console.log('Existing records updated with is_gesluit = 0');
                                    }
                                });
                            }
                        });
                    } else {
                        console.log('is_gesluit column already exists');
                    }
                }
            });

            db.close((err) => {
                if (err) return reject(err);
                return resolve(dbPath);
            });
        });
    });
}

module.exports = { initializeDatabase, getDatabasePath };


