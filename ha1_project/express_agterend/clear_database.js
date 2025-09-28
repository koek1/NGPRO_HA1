/**
 * Database Clearing Utility
 * 
 * This script clears all data from the database while preserving the schema.
 * Use this for testing purposes to start with a clean database.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get database path
const dbPath = path.resolve(__dirname, 'melktert.db');

console.log('🗑️  Clearing database...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(' Error opening database:', err.message);
        process.exit(1);
    }
    console.log(' Connected to database');
});

// Clear all data in the correct order (respecting foreign key constraints)
db.serialize(() => {
    console.log(' Clearing all data...');
    
    // Clear all marks first
    db.run('DELETE FROM Punte_span_brug', (err) => {
        if (err) {
            console.error(' Error clearing marks:', err.message);
        } else {
            console.log(' Cleared all marks');
        }
    });
    
    // Clear all round results
    db.run('DELETE FROM rondte_uitslag', (err) => {
        if (err) {
            console.error(' Error clearing round results:', err.message);
        } else {
            console.log(' Cleared all round results');
        }
    });
    
    // Clear all members
    db.run('DELETE FROM Lid', (err) => {
        if (err) {
            console.error(' Error clearing members:', err.message);
        } else {
            console.log(' Cleared all members');
        }
    });
    
    // Clear all teams
    db.run('DELETE FROM Span', (err) => {
        if (err) {
            console.error(' Error clearing teams:', err.message);
        } else {
            console.log(' Cleared all teams');
        }
    });
    
    // Clear all merkblad records
    db.run('DELETE FROM Merkblad', (err) => {
        if (err) {
            console.error(' Error clearing merkblad records:', err.message);
        } else {
            console.log(' Cleared all merkblad records');
        }
    });
    
    // Clear all criteria
    db.run('DELETE FROM Kriteria', (err) => {
        if (err) {
            console.error(' Error clearing criteria:', err.message);
        } else {
            console.log(' Cleared all criteria');
        }
    });
    
    // Clear all rounds
    db.run('DELETE FROM Rondte', (err) => {
        if (err) {
            console.error(' Error clearing rounds:', err.message);
        } else {
            console.log(' Cleared all rounds');
        }
    });
    
    // Reset auto-increment counters
    db.run('DELETE FROM sqlite_sequence', (err) => {
        if (err) {
            console.error(' Error resetting auto-increment:', err.message);
        } else {
            console.log(' Reset auto-increment counters');
        }
    });
    
    // Reinitialize with default data
    console.log(' Reinitializing with default data...');
    
    // Insert default round
    db.run(`
        INSERT INTO Rondte (rondte_id, is_eerste, is_laaste, is_gesluit, max_spanne)
        VALUES (1, 1, 0, 0, 100)
    `, (err) => {
        if (err) {
            console.error(' Error creating default round:', err.message);
        } else {
            console.log(' Created default round');
        }
    });
    
    // Insert default criteria
    const defaultCriteria = [
        { beskrywing: 'Backend Development', default_totaal: 100 },
        { beskrywing: 'Frontend Development', default_totaal: 100 },
        { beskrywing: 'Database Design', default_totaal: 100 }
    ];
    
    let criteriaCount = 0;
    defaultCriteria.forEach((criteria, index) => {
        db.run(`
            INSERT INTO Kriteria (beskrywing, default_totaal)
            VALUES (?, ?)
        `, [criteria.beskrywing, criteria.default_totaal], (err) => {
            if (err) {
                console.error(` Error creating criteria ${index + 1}:`, err.message);
            } else {
                criteriaCount++;
                if (criteriaCount === defaultCriteria.length) {
                    console.log(' Created default criteria');
                    
                    // Create merkblad records for the default round
                    db.all('SELECT kriteria_id FROM Kriteria', (err, criteria) => {
                        if (err) {
                            console.error(' Error getting criteria:', err.message);
                        } else {
                            let merkbladCount = 0;
                            criteria.forEach(crit => {
                                db.run(`
                                    INSERT INTO Merkblad (rondte_id, kriteria_id, totaal)
                                    VALUES (?, ?, ?)
                                `, [1, crit.kriteria_id, 100], (err) => {
                                    if (err) {
                                        console.error(' Error creating merkblad:', err.message);
                                    } else {
                                        merkbladCount++;
                                        if (merkbladCount === criteria.length) {
                                            console.log(' Created default merkblad records');
                                            console.log(' Database cleared and reinitialized successfully!');
                                            console.log(' You can now create new teams and they will have empty forms.');
                                            db.close();
                                        }
                                    }
                                });
                            });
                        }
                    });
                }
            }
        });
    });
});
