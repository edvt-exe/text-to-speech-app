![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Vanilla JS](https://img.shields.io/badge/frontend-vanilla%20JS-f7df1e?logo=javascript&logoColor=black)

# TTS by edvt

A text-to-speech web app that converts text to audio in the browser or generates a downloadable MP3 via a Node.js backend. Built with no frontend frameworks — just HTML, CSS and JavaScript.

## Features

- Live speech preview using the Web Speech API (no backend needed)
- Searchable voice dropdown grouped by language, with speed, pitch and volume controls
- Waveform animation while audio plays
- MP3 generation and download via backend (Google TTS engine)
- Drag & drop a `.txt` file directly onto the input area
- Generation history saved in SQLite with inline audio playback
- Character counter with limit warnings
- Keyboard shortcuts: `Ctrl+Enter` to generate, `Ctrl+Space` to preview
- Auto-play toggle after MP3 generation
- Dark/light theme toggle
- Toast notifications (no `alert()`)
- Stats counter for total files generated (persisted in `localStorage`)
- **Rate Limiting:** 20 requests/hour per IP (protects backend from abuse)
- **Smart Caching:** SHA-256 hash-based deduplication (eliminates redundant TTS API calls)
- **Shareable Audio:** Generate unique URLs with OpenGraph meta tags (works on Discord, Twitter, Facebook)
- **Production Ready:** Docker & docker-compose with persistent volumes

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Backend     | Node.js, Express.js                            |
| TTS Engine  | node-gtts (Google TTS)                         |
| Database    | SQLite via better-sqlite3                      |
| Caching     | SHA-256 hash-based deduplication               |
| Rate Limit  | express-rate-limit                             |
| UUID Gen    | uuid v4                                         |
| Frontend    | Vanilla JS, HTML5, CSS3                        |
| Preview     | Web Speech API (browser-native)                |
| Deployment  | Docker, Docker Compose                         |
| Base Image  | node:20-alpine (multi-stage build)             |

## Project Structure

```
voicecraft/
├── backend/
│   ├── server.js                    # Express server with root-level /listen/:uuid route
│   ├── package.json
│   ├── db.js                        # SQLite database with UUID & hash support
│   ├── middleware/
│   │   └── rateLimiter.js          # Rate limiting (20 req/hour per IP)
│   ├── routes/
│   │   └── tts.js                  # POST /api/tts/generate, GET /api/tts/history
│   └── services/
│       ├── ttsEngine.js            # Google TTS API wrapper
│       ├── cacheService.js         # SHA-256 hash generation & cache lookup
│       └── playerService.js        # HTML player with OpenGraph meta tags
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       ├── speechPreview.js
│       └── historyPanel.js
├── audio-output/                    # Generated MP3 files (mounted as volume in Docker)
├── Dockerfile                       # Multi-stage production-ready container image
├── docker-compose.yml               # Orchestration with persistent volumes
├── .dockerignore
├── DEPLOYMENT.md                    # Detailed deployment guide
└── README.md
```


## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/your-username/text-to-speech-app.git
cd text-to-speech-app

# Install backend dependencies
cd backend
npm install

# Start the backend server
npm start          # production
npm run dev        # with auto-restart on file changes
```

Then open `frontend/index.html` with the **Live Server** extension in VS Code, or navigate directly to `http://127.0.0.1:5500/frontend/index.html`.

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5500` (Live Server default)

## Docker Deployment

**Prerequisites:** Docker 20.10+, Docker Compose 2.0+

VoiceCraft is production-ready with Docker. The container includes:
- Multi-stage build for minimal image size
- SQLite and audio file volumes for data persistence
- Health checks for automatic restart
- Resource limits and security best practices

### Quick Start

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f voicecraft-app

# Stop the application
docker-compose down
```

The app will be available at `http://localhost:3000`

### Data Persistence

VoiceCraft uses two named Docker volumes:
1. **voicecraft-db** — SQLite database with all generation history
2. **voicecraft-audio** — Generated MP3 files

Data persists even when containers stop or restart.

### Manage Volumes

```bash
# View volumes
docker volume ls

# Backup database
docker run --rm -v voicecraft-db:/data -v $(pwd):/backup \
  alpine tar czf /backup/voicecraft-db-backup.tar.gz -C /data .

# Restore database
docker run --rm -v voicecraft-db:/data -v $(pwd):/backup \
  alpine tar xzf /backup/voicecraft-db-backup.tar.gz -C /data
```

### Production Deployment

For detailed production deployment instructions, environment configuration, monitoring, and troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

## API Reference

### Generate MP3

POST /api/tts/generate

**Body**
```json
{
  "text": "Hello, world.",
  "language": "en",
  "speed": "normal"
}
```

**Response**
```json
{
  "filename": "speech_1234567890.mp3",
  "url": "/audio/speech_1234567890.mp3",
  "shareUuid": "550e8400-e29b-41d4-a716-446655440000",
  "shareUrl": "/listen/550e8400-e29b-41d4-a716-446655440000",
  "fromCache": false
}
```

**Features:**
- **Rate Limiting:** Maximum 20 requests per hour per IP (returns 429 if exceeded)
- **Smart Caching:** If the same text + language + speed was previously generated, returns cached file instantly without calling TTS API
- **Shareable Links:** Each generated audio gets a unique `shareUuid` for social media sharing

---

### Get History

GET /api/tts/history

Returns an array of the last 100 generated entries, ordered by most recent, including cache hashes and share UUIDs.

---

### Listen to Shared Audio

GET /listen/:uuid

Serves an HTML page with:
- Native audio player with browser controls
- Original text displayed
- OpenGraph meta tags for social media preview
- Works on Discord, Twitter, Facebook, etc.

**Example:** `/listen/550e8400-e29b-41d4-a716-446655440000`

---

### Serve Audio File

GET /audio/:fileName

Streams the generated MP3 file directly from the server.

<!-- ## Screenshots

> Add screenshots here -->

## License

[MIT](LICENSE)