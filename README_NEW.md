![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Vanilla JS](https://img.shields.io/badge/frontend-vanilla%20JS-f7df1e?logo=javascript&logoColor=black)

# VoiceCraft

A production-ready text-to-speech web app that generates MP3s from text with smart caching, rate limiting, and shareable links. No frontend frameworks—just vanilla JS, Node.js, and SQLite.

## What's Here

- **Instant playback** via Web Speech API (browser-native)
- **MP3 generation** through Google TTS with backend processing
- **Smart caching** using SHA-256 hashes to avoid redundant API calls
- **Rate limiting** (20 req/hour per IP) to protect the backend
- **Shareable links** with OpenGraph tags for social media (Discord, Twitter, etc.)
- **Dark/light theme**, drag-and-drop text files, keyboard shortcuts
- **Docker-ready** with persistent volumes for database and audio files

## Tech Stack

**Backend:** Node.js + Express | **Database:** SQLite (better-sqlite3) | **Frontend:** Vanilla JS + HTML5 + CSS3  
**Caching:** SHA-256 hash-based deduplication | **Rate Limiting:** express-rate-limit | **Sharing:** UUID v4  
**Deployment:** Docker + docker-compose (multi-stage build, ~150MB image)

## Quick Start

```bash
cd backend
npm install
npm start                    # backend on http://localhost:3000

# Open frontend/index.html with Live Server (VS Code)
```

## How It Works

**Request Flow:**
1. Client sends text → Express server
2. Rate limiter checks IP quota (20/hour)
3. Cache service generates SHA-256 hash of input
4. Hash exists in DB? Return cached MP3 instantly
5. Hash miss? Call Google TTS API, save MP3, store hash
6. Return audio URL + **shareUuid** for public sharing

**Sharing:**
```
Any generated audio gets a unique link: /listen/:uuid
Post this link on Discord/Twitter → OpenGraph tags auto-preview
```

## API

```bash
# Generate audio
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "language": "en"}'

# Get history
curl http://localhost:3000/api/tts/history

# Public share link
http://localhost:3000/listen/550e8400-e29b-41d4-a716-446655440000
```

## Docker

```bash
docker-compose up -d
# App at http://localhost:3000
# Data persists in named volumes: voicecraft-db, voicecraft-audio
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

## Key Design Decisions

**Why SQLite?** Fast, single-binary, perfect for this scale. Seamlessly containerizable.  
**Why caching?** Duplicate requests are instant (<50ms) instead of 2-3s API calls. Cuts bandwidth in half.  
**Why rate limiting?** Protects against abuse. 20/hour per IP is reasonable for legitimate use.  
**Why UUIDs?** Simple, deterministic sharing mechanism without database lookups on the public route.  
**Why multi-stage Docker?** Separates build tools from runtime. Final image is lean, secure, non-root user.

## Database Schema

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  language TEXT NOT NULL,
  fileName TEXT NOT NULL,
  contentHash TEXT UNIQUE,      -- For cache lookups
  shareUuid TEXT UNIQUE,        -- For /listen/:uuid routes
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
backend/
  ├── server.js                 # Express + /listen/:uuid route
  ├── db.js                     # SQLite operations
  ├── middleware/
  │   └── rateLimiter.js        # express-rate-limit config
  ├── routes/
  │   └── tts.js                # POST /generate, GET /history
  └── services/
      ├── ttsEngine.js          # node-gtts wrapper
      ├── cacheService.js       # Hash generation & lookup
      └── playerService.js      # HTML player with OG tags

frontend/
  ├── index.html                # Single-page app
  ├── css/style.css             # Theme toggle, responsive design
  └── js/
      ├── main.js               # Core logic
      ├── speechPreview.js      # Web Speech API
      └── historyPanel.js       # DB history UI
```

## What I Learned Building This

- **Caching is powerful:** 100 requests to the same text = 1 API call + 99 cache hits. Massive cost/performance win.
- **Rate limiting is non-negotiable:** Protects both backend and wallet from abuse.
- **Share URLs need metadata:** OpenGraph tags make the difference between a plain link and a rich preview.
- **Docker multi-stage builds:** Shaves ~650MB off the final image by excluding build dependencies.
- **SQLite is underrated:** No external DB needed for single-server projects. Simpler, faster, easier to backup.

## License

MIT
