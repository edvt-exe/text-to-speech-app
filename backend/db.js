const Database = require('better-sqlite3');
const db = new Database('history.db');

// create the history table
db.exec(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    language TEXT NOT NULL,
    fileName TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP)
`);

function saveToHistory(text, language, fileName) {
    const stmt = db.prepare('INSERT INTO history (text, language, fileName) VALUES(?, ?, ?)');
    return stmt.run(text, language, fileName);
}

function getHistory() {
    return db.prepare('SELECT * FROM history ORDER BY createdAt DESC LIMIT 100').all();
}

module.exports = {saveToHistory, getHistory};