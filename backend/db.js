const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const db = new Database('history.db');

// create the history table with caching support and sharing capabilities
db.exec(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    language TEXT NOT NULL,
    fileName TEXT NOT NULL,
    contentHash TEXT UNIQUE,
    shareUuid TEXT UNIQUE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP)
`);

/**
 * Save audio generation to history with content hash and share UUID
 * WHY: We store the contentHash to enable quick cache lookups without re-scanning all records
 * The UNIQUE constraint ensures each unique content (text + language + speed) has one canonical file
 * We store shareUuid to enable public sharing - users can share audio via /listen/:uuid URLs
 * 
 * @param {string} text - The text that was converted to speech
 * @param {string} language - Language code used
 * @param {string} fileName - Generated MP3 filename
 * @param {string} contentHash - SHA-256 hash of the content (for fast cache lookups)
 * @returns {object} Database run result
 */
function saveToHistory(text, language, fileName, contentHash) {
    const shareUuid = uuidv4(); // Generate unique UUID for sharing
    const stmt = db.prepare(
        'INSERT INTO history (text, language, fileName, contentHash, shareUuid) VALUES(?, ?, ?, ?, ?)'
    );
    return stmt.run(text, language, fileName, contentHash, shareUuid);
}

/**
 * Retrieve history of generated audio files (limited to last 100)
 * WHY: Pagination prevents loading massive datasets; users typically care about recent generations
 */
function getHistory() {
    return db.prepare('SELECT * FROM history ORDER BY createdAt DESC LIMIT 100').all();
}

/**
 * Retrieve a specific audio record by its share UUID
 * WHY: This enables the /listen/:uuid public route to serve shareable audio players
 * 
 * @param {string} uuid - The share UUID to look up
 * @returns {object|null} Record with text, fileName, language, or null if not found
 */
function getAudioByUuid(uuid) {
    const stmt = db.prepare(
        'SELECT text, language, fileName FROM history WHERE shareUuid = ? LIMIT 1'
    );
    return stmt.get(uuid);
}

module.exports = {saveToHistory, getHistory, getAudioByUuid, db};