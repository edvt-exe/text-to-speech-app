/**
 * Player Page HTML Generator
 * 
 * WHY: Generates a self-contained HTML page with OpenGraph meta tags for social media sharing.
 * When users share the /listen/:uuid link on social media, the OG tags are parsed by platforms
 * to show a preview with the audio description and thumbnail.
 */

/**
 * Generate an HTML page for audio playback with social sharing support
 * WHY: The <audio> tag provides browser-native playback controls (play, pause, seek, volume).
 * OpenGraph meta tags ensure proper preview when link is shared on Twitter, Facebook, Discord, etc.
 * 
 * @param {string} text - The original text that was converted to speech
 * @param {string} language - Language code (used in description)
 * @param {string} audioUrl - Full URL to the MP3 file (e.g., http://localhost:3000/audio/speech_123.mp3)
 * @param {string} pageUrl - Full URL of the player page for og:url (e.g., http://localhost:3000/listen/uuid-here)
 * @param {string} thumbnailUrl - Optional URL to thumbnail image for og:image
 * @returns {string} Complete HTML document
 */
function generatePlayerHTML(text, language, audioUrl, pageUrl, thumbnailUrl = null) {
    const description = `Listen to this text-to-speech audio: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}" in ${language}`;
    
    // Use a default VoiceCraft thumbnail if none provided
    const ogImage = thumbnailUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"%3E%3Crect fill="%234F46E5" width="1200" height="630"/%3E%3Ctext x="50%25" y="50%25" font-size="60" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EVoiceCraft%3C/text%3E%3C/svg%3E';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VoiceCraft - Audio Player</title>
    
    <!-- OpenGraph Meta Tags for Social Media Sharing -->
    <!-- WHY: These tags control how the page appears when shared on social platforms -->
    <meta property="og:type" content="audio.music">
    <meta property="og:title" content="VoiceCraft Audio">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="player">
    <meta name="twitter:title" content="VoiceCraft Audio">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
    
    <!-- Audio Meta Tags -->
    <meta property="og:audio" content="${audioUrl}">
    <meta property="og:audio:type" content="audio/mpeg">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .player-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px 30px;
        }
        
        .player-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .player-header h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .player-header p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .language-badge {
            display: inline-block;
            background: #e5e7eb;
            color: #374151;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .text-content {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
        }
        
        .text-content p {
            color: #374151;
            font-size: 15px;
            line-height: 1.6;
            word-break: break-word;
        }
        
        audio {
            width: 100%;
            margin-bottom: 20px;
            outline: none;
        }
        
        audio::-webkit-media-controls-panel {
            background-color: #f3f4f6;
        }
        
        .player-footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .player-footer p {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 10px;
        }
        
        .share-hint {
            color: #667eea;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        @media (max-width: 480px) {
            .player-container {
                padding: 25px 20px;
            }
            
            .player-header h1 {
                font-size: 20px;
            }
            
            .text-content p {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="player-header">
            <div class="logo">🎙️ VoiceCraft</div>
            <h1>Audio Player</h1>
            <p>Listen to generated speech</p>
            <span class="language-badge">${language}</span>
        </div>
        
        <div class="text-content">
            <p>${escapeHtml(text)}</p>
        </div>
        
        <audio controls preload="metadata">
            <source src="${audioUrl}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        
        <div class="player-footer">
            <p class="share-hint">💡 Share this link with others!</p>
            <p>Powered by <strong>VoiceCraft</strong></p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * WHY: User-generated text could contain <, >, &, quotes. We must escape these
 * before inserting into HTML to prevent malicious code injection via JavaScript or HTML.
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

module.exports = { generatePlayerHTML };
