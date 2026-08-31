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

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js, Express.js                 |
| TTS Engine | node-gtts (Google TTS)            |
| Database | SQLite via better-sqlite3           |
| Frontend | Vanilla JS, HTML5, CSS3             |
| Preview  | Web Speech API (browser-native)     |

## Project Structure

```
text-to-speech-app/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/tts.js
│   └── services/ttsEngine.js
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       ├── speechPreview.js
│       └── historyPanel.js
└── audio-output/
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

## API Reference

### Generate MP3

POST /api/tts/generate

**Body**
```json
{
  "text": "Hello, world.",
  "language": "en"
}
```

**Response**
```json
{
  "fileName": "speech_1234567890.mp3",
  "url": "/audio/speech_1234567890.mp3"
}
```

---

### Get History

GET /api/tts/history


Returns an array of the last 50 generated entries, ordered by most recent.

---

### Serve Audio File

GET /audio/:fileName


Streams the generated MP3 file directly from the server.

<!-- ## Screenshots

> Add screenshots here -->

## License

[MIT](LICENSE)