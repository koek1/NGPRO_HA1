const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get database path
const dbPath = path.resolve(__dirname, 'melktert.db');

console.log('Fixing database schema...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Check if is_gesluit column exists
db.all("PRAGMA table_info(Rondte)", (err, columns) => {
    if (err) {
        console.error('Error checking table info:', err.message);
        db.close();
        return;
    }
    
    console.log('Current Rondte table columns:', columns.map(col => col.name));
    
    const hasIsGesluit = columns.some(col => col.name === 'is_gesluit');
    
    if (!hasIsGesluit) {
        console.log('Adding is_gesluit column...');
        db.run('ALTER TABLE Rondte ADD COLUMN is_gesluit INTEGER NOT NULL DEFAULT 0', (alterErr) => {
            if (alterErr) {
                console.error('Error adding is_gesluit column:', alterErr.message);
            } else {
                console.log('✅ is_gesluit column added successfully');
                
                // Update existing records
                db.run('UPDATE Rondte SET is_gesluit = 0 WHERE is_gesluit IS NULL', (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating existing records:', updateErr.message);
                    } else {
                        console.log('✅ Existing records updated with is_gesluit = 0');
                    }
                    
                    // Verify the fix
                    db.all("PRAGMA table_info(Rondte)", (verifyErr, newColumns) => {
                        if (verifyErr) {
                            console.error('Error verifying table info:', verifyErr.message);
                        } else {
                            console.log('✅ Updated Rondte table columns:', newColumns.map(col => col.name));
                        }
                        db.close();
                    });
                });
            }
        });
    } else {
        console.log('✅ is_gesluit column already exists');
        db.close();
    }
});
