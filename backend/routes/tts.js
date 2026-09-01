const express = require('express');
const router = express.Router();

const {generateAudioFile} = require('../services/ttsEngine');
const {saveToHistory, getHistory, db} = require('../db');
const {audioGenerationLimiter} = require('../middleware/rateLimiter');
const {generateContentHash, getCachedAudio} = require('../services/cacheService');

// POST /api/tts/generate - Generate audio from text
// WHY: Rate limiter applied here to protect against abuse and excessive external API calls
router.post('/generate', audioGenerationLimiter, async (req, res) => {
    const {text, language, speed = 'normal'} = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({error: 'The text can not be empty'});
    }

    try {
        // Generate content hash for cache lookup
        // WHY: Hash is deterministic - same input always produces same hash
        const contentHash = generateContentHash(text, language, speed);
        
        // Check if we've already generated audio for this exact content
        // WHY: If cache hit, skip the entire node-gtts API call (saves bandwidth + time)
        const cachedRecord = getCachedAudio(db, contentHash);
        
        if (cachedRecord) {
            // Cache hit! Return the existing file without calling TTS API
            console.log(`[CACHE HIT] Returning cached audio: ${cachedRecord.fileName}`);
            // Retrieve the shareUuid for this cached record
            const cachedWithUuid = db.prepare(
                'SELECT shareUuid FROM history WHERE fileName = ? LIMIT 1'
            ).get(cachedRecord.fileName);
            return res.json({
                filename: cachedRecord.fileName,
                url: `/audio/${cachedRecord.fileName}`,
                shareUuid: cachedWithUuid?.shareUuid || null,
                shareUrl: cachedWithUuid?.shareUuid ? `/listen/${cachedWithUuid.shareUuid}` : null,
                fromCache: true // Signal to frontend that this was served from cache
            });
        }

        // Cache miss - generate new audio via TTS API
        console.log(`[CACHE MISS] Generating new audio for content hash: ${contentHash}`);
        const filename = await generateAudioFile(text, language);
        
        // Save to history with content hash for future lookups
        // WHY: saveToHistory generates a unique shareUuid internally
        const result = saveToHistory(text, language, filename, contentHash);
        
        // Retrieve the newly saved record to get the shareUuid
        const newRecord = db.prepare(
            'SELECT shareUuid FROM history WHERE id = ? LIMIT 1'
        ).get(result.lastInsertRowid);
        
        res.json({
            filename,
            url: `/audio/${filename}`,
            shareUuid: newRecord?.shareUuid || null,
            shareUrl: newRecord?.shareUuid ? `/listen/${newRecord.shareUuid}` : null,
            fromCache: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Generating audio did not work'});
    }
});

router.get('/history', (req, res) => {
    res.json(getHistory());
});

module.exports = router;
