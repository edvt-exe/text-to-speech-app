const express = require('express');
const cors = require('cors');
const path = require('path');
const ttsRoutes = require('./routes/tts');
const {getAudioByUuid} = require('./db');
const {generatePlayerHTML} = require('./services/playerService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, '../audio-output')));
app.use('/api/tts', ttsRoutes);

/**
 * GET /listen/:uuid - Public shareable audio player (root-level route)
 * WHY: Root-level route makes shareable URLs cleaner: /listen/abc-123 instead of /api/tts/listen/abc-123
 * Users are more likely to share a simple, clean URL structure
 */
app.get('/listen/:uuid', (req, res) => {
    const {uuid} = req.params;
    
    try {
        const audioRecord = getAudioByUuid(uuid);
        
        if (!audioRecord) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Audio Not Found - VoiceCraft</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                        .container { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
                        h1 { color: #1f2937; margin-bottom: 10px; }
                        p { color: #6b7280; margin-bottom: 20px; }
                        a { color: #667eea; text-decoration: none; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Audio Not Found</h1>
                        <p>The requested audio file does not exist or has been deleted.</p>
                        <a href="/">← Return to VoiceCraft</a>
                    </div>
                </body>
                </html>
            `);
        }
        
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const audioUrl = `${protocol}://${host}/audio/${audioRecord.fileName}`;
        const pageUrl = `${protocol}://${host}/listen/${uuid}`;
        
        const html = generatePlayerHTML(
            audioRecord.text,
            audioRecord.language,
            audioUrl,
            pageUrl
        );
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        
    } catch (err) {
        console.error(`[ERROR] Failed to retrieve audio for UUID ${uuid}:`, err);
        res.status(500).json({error: 'Failed to load audio player'});
    }
});

app.listen(PORT, () =>{
    console.log(`The server started on PORT: ${PORT}`);
});