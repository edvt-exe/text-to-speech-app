const express = require('express');
const router = express.Router();

const {generateAudioFile} = require('../services/ttsEngine');
const {saveToHistory, getHistory} = require('../db');

router.post('/generate', async (req, res) => {
    const {text, language} = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({error: 'The text can not be empty'});
    }

    try {
        const filename = await generateAudioFile(text, language);
        saveToHistory(text, language, filename);
        res.json({filename, url: `/audio/${filename}` });
    } catch (ret) {
        console.error(ret);
        res.status(500).json({error: 'Generating audio did not work'});
    }
});

router.get('/history', (req, res) => {
    res.json(getHistory());
});

module.exports = router;
