/**
 * Cache Service - Hash-based Content Deduplication
 * 
 * WHY: Instead of calling the node-gtts API every time, we generate a hash from the input
 * (text + language + speed) and check if we've already generated audio for this exact content.
 * This dramatically reduces API calls, bandwidth, and generation time for repeated requests.
 */

const crypto = require('crypto');

/**
 * Generate a SHA-256 hash from text + language + speed
 * WHY: SHA-256 is cryptographically secure and collision-resistant, ensuring we don't
 * accidentally serve wrong audio files for similar inputs. It's also faster than MD5.
 * 
 * @param {string} text - The text to be spoken
 * @param {string} language - Language code (e.g., 'en', 'ro', 'es')
 * @param {string} speed - Speech speed (e.g., 'slow', 'normal', 'fast') - defaults to 'normal'
 * @returns {string} SHA-256 hash in hex format
 */
function generateContentHash(text, language, speed = 'normal') {
    const content = `${text.trim()}|${language}|${speed}`;
    return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
}

/**
 * Check if content has already been cached in the database
 * WHY: Before expensive TTS API call, we check the database. If found, we return the
 * cached filename immediately, bypassing the entire audio generation process.
 * 
 * @param {Database} db - better-sqlite3 database instance
 * @param {string} contentHash - SHA-256 hash of content
 * @returns {object|null} Record with cached fileName, or null if not found
 */
function getCachedAudio(db, contentHash) {
    const stmt = db.prepare('SELECT fileName FROM history WHERE contentHash = ? LIMIT 1');
    return stmt.get(contentHash);
}

module.exports = {
    generateContentHash,
    getCachedAudio
};
