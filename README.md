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

---

## Installation

### Local Development Setup

**Prerequisites:**
- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git

**Step 1: Clone and setup**
```bash
git clone https://github.com/edvt-exe/text-to-speech-app.git
cd txt-to-speech/backend
npm install
```

**Step 2: Start backend**
```bash
npm start              # Production mode on port 3000
# OR
npm run dev           # Development mode with auto-restart
```

**Step 3: Open frontend**
- Option A: Use VS Code's **Live Server** extension on `frontend/index.html`
- Option B: Run `npx http-server frontend` and open `http://localhost:8080`
- Option C: Directly open `frontend/index.html` (no backend preview, only Web Speech API)

Backend: `http://localhost:3000`  
Frontend: `http://localhost:8080` (or Live Server port)

### Verify Installation

```bash
# Check if backend is running
curl http://localhost:3000/api/tts/history

# Should return: []  (empty array)
```

---

## Usage Examples

### Basic Audio Generation (Fetch API)

```javascript
const generateAudio = async (text, language = 'en') => {
  const response = await fetch('http://localhost:3000/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, speed: 'normal' })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('Audio generated:', data.url);
    console.log('Share this:', data.shareUrl);
  } else if (response.status === 429) {
    console.error('Rate limit exceeded. Try again in 1 hour.');
  }
  
  return data;
};

// Usage
generateAudio('Hello, World!', 'en');
```

### Retrieve Generation History

```javascript
const getHistory = async () => {
  const response = await fetch('http://localhost:3000/api/tts/history');
  const history = await response.json();
  
  history.forEach(entry => {
    console.log(`${entry.text} (${entry.language}) - ${entry.fileName}`);
  });
};
```

### Share Audio

Users can share the audio URL from the generation response:
```
http://your-app.com/listen/550e8400-e29b-41d4-a716-446655440000
```

When posted on Discord/Twitter, it shows:
- Audio player preview
- Original text
- Custom thumbnail (OG image)

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                       │
│  - Vanilla JS, HTML5, CSS3                                  │
│  - Web Speech API preview (no backend needed)               │
│  - Generate button calls POST /api/tts/generate             │
└───────────────────┬─────────────────────────────────────────┘
                    │ (HTTP POST)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS SERVER (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Rate Limiter] ← 20 req/hour per IP                       │
│       ↓                                                     │
│  [Cache Check] ← SHA-256 hash lookup                       │
│       ├→ HIT: Return existing MP3                          │
│       └→ MISS: Call TTS API below                          │
│       ↓                                                     │
│  [node-gtts] ← Google TTS API wrapper                      │
│       ↓                                                     │
│  [Save to DB] ← SQLite with hash + UUID                    │
│       ↓                                                     │
│  [Return Response] with shareUuid                          │
│                                                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    Database   Audio Files  Share Links
   (SQLite)   (MP3 files)   (/listen/:uuid)
```

### Database Schema

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,                    -- Original text
  language TEXT NOT NULL,                -- Language code (en, ro, es, etc.)
  fileName TEXT NOT NULL,                -- Generated MP3 filename
  contentHash TEXT UNIQUE,               -- SHA-256 hash for cache lookup
  shareUuid TEXT UNIQUE,                 -- UUID for public sharing
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Caching Logic

1. **Input Normalization:** `text + language + speed` → Deterministic string
2. **Hash Generation:** SHA-256 hash of normalized input
3. **Cache Lookup:** Query database where `contentHash = hash`
4. **Cache Hit:** Return existing `fileName` instantly (no API call)
5. **Cache Miss:** Call node-gtts, generate MP3, store with hash

**Example:**
```
Request 1: "Hello" in English
  → Hash: abc123def456...
  → API call → speech_1234.mp3
  → Saved with hash abc123def456...

Request 2: "Hello" in English (identical)
  → Hash: abc123def456... (same)
  → Database lookup → Found! speech_1234.mp3
  → Return instantly ✓ (no API call)
```

### Rate Limiting

- **Limit:** 20 requests per hour per client IP
- **Detection:** Uses `X-Forwarded-For` header (supports proxies/cloud)
- **Response on Limit:** HTTP 429 with JSON error message

```json
{
  "error": "Too many audio generation requests",
  "message": "You have exceeded the limit of 20 requests per hour. Please try again later.",
  "retryAfter": 1725139200000,
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Sharing Mechanism

Each audio generation gets a unique **UUID v4**:
```javascript
shareUuid: "550e8400-e29b-41d4-a716-446655440000"
shareUrl: "/listen/550e8400-e29b-41d4-a716-446655440000"
```

The `/listen/:uuid` route serves an HTML page with:
- **OpenGraph Meta Tags** for social media preview
- **Native `<audio>` element** for browser-based playback
- **Responsive design** for mobile sharing
- **XSS protection** with HTML escaping

---

## Performance Optimization

### Caching Benefits

| Scenario | Without Cache | With Cache | Improvement |
|----------|---------------|-----------|-------------|
| Repeat request | ~2-3s (API call) | <50ms (DB lookup) | 50-60x faster |
| Server load | High (multiple API calls) | Low (bypassed) | ✓ Significant |
| Bandwidth | High | Low | ✓ Reduced |
| Cost | Depends on TTS provider | Lower | ✓ Cost saving |

**Real-world example:**
- 100 requests to generate same text: 1 API call + 99 cache hits
- Without caching: 100 API calls

### Rate Limiting Benefits

Protects against:
- Abuse (intentional DoS)
- Runaway scripts (accidental spam)
- Unexpected traffic spikes
- Excessive API usage costs

### Database Performance

- SQLite optimized for single-machine deployments
- UNIQUE constraint on `contentHash` ensures fast lookups
- Indexes on frequently queried columns
- Limit of 100 history entries prevents bloat

**For scale:** Migrate to PostgreSQL with replication.

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Database errors

```bash
# Reset database (deletes all history)
rm backend/history.db

# Backend will auto-recreate on next start
npm start
```

### Docker container exits immediately

```bash
# Check logs
docker-compose logs voicecraft-app

# Rebuild
docker-compose up -d --build
```

### Rate limit hit

- Limit: 20 requests/hour per IP
- Wait 1 hour or restart the backend (resets in-memory limiter)

### Audio files not playing

```bash
# Verify audio-output directory exists
ls -la audio-output/

# Check audio file permissions
file audio-output/speech_*.mp3

# Test direct URL
curl http://localhost:3000/audio/speech_1234.mp3
```

### Frontend can't reach backend

// Frontend code must use correct backend URL
// Local development:
const API_URL = 'http://localhost:3000';

---

## Future Improvements

### Potential Enhancements

- **Authentication & User Accounts**
  - Save generation history per user
  - Track personal cache statistics
  - Private/public sharing toggles

- **Multi-Language Support**
  - Support more TTS engines (AWS Polly, Azure TTS)
  - Dynamic language detection
  - Language-specific optimizations

- **Advanced Caching**
  - Redis for distributed caching
  - S3/Cloud storage for audio files
  - Cache invalidation policies

- **Analytics & Monitoring**
  - Track generation statistics (popular texts, languages)
  - API usage metrics
  - Performance dashboards

- **UI/UX Improvements**
  - Download as WAV/OGG formats
  - Batch processing (multiple texts)
  - Voice selection (male/female/neutral)
  - Pitch and rate customization

- **Testing**
  - Unit tests (Jest)
  - Integration tests
  - Load testing (Apache JMeter)
  - E2E tests (Playwright)

- **Internationalization**
  - Multi-language UI
  - RTL support (Arabic, Hebrew)
  - Localized error messages

---

## Security Considerations

 **Implemented:**
- Rate limiting (prevents abuse)
- Input validation (empty text check)
- HTML escaping (XSS prevention)
- Non-root Docker execution (container security)
- Health checks (auto-restart)
- Resource limits (prevents runaway)

 **Recommendations:**
- Use HTTPS in production (reverse proxy)
- Implement CSRF tokens for state-changing operations
- Add authentication for sensitive endpoints
- Regularly update dependencies (`npm audit`)
- Scan Docker images for vulnerabilities (`trivy`)
- Never commit `.env` files to git
- Use secrets management (AWS Secrets, HashiCorp Vault)

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use meaningful variable names
- Add comments explaining the "why", not the "what"
- Follow existing code patterns
- Validate all user inputs
- Test thoroughly before submitting PR

---

## License

[MIT](LICENSE)

---

## Acknowledgments

- **node-gtts** — Google Text-to-Speech API wrapper
- **better-sqlite3** — High-performance SQLite driver
- **express-rate-limit** — Rate limiting middleware
- **uuid** — UUID v4 generation
- Open source community

---

## Changelog

### v2.0.0 (2026-09-01) — Production Ready
-  Rate limiting (20 req/hour per IP)
-  Smart caching (SHA-256 hash-based deduplication)
-  Shareable audio links with OpenGraph meta tags
-  Docker & docker-compose support
-  Security improvements (non-root execution, health checks)
-  Comprehensive deployment guide

### v1.0.0 (Initial Release)
- Core TTS functionality
- SQLite history
- Web Speech API preview
- Dark/light theme