# WaveMusic 🎵 — Manual Audio URL Music Streaming Platform

A modern, responsive audio streaming website with a premium **Apple Music-inspired interface**, built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and the native **HTML5 Web Audio API**.

The website streams audio **directly from any public HTTPS audio URL** you provide. No Cloudflare R2 APIs, S3 SDKs, bucket listing endpoints, database setups, or worker backends are required!

---

## 🌟 How It Works (The 30-Second Workflow)

1. Open [`src/data/music.json`](file:///c:/projects/wavemusic/src/data/music.json).
2. Add your song entry with its title, artist, album, year, thumbnail URL, and direct audio URL:
   ```json
   {
     "id": "my-song-001",
     "title": "My Tamil Song",
     "artist": "My Favourite Artist",
     "album": "My Album",
     "genre": "Melody",
     "year": 2025,
     "duration": 240,
     "audioUrl": "https://example.com/audio/song.mp3",
     "thumbnailUrl": "https://example.com/images/cover.jpg",
     "description": "Tamil melody song",
     "language": "Tamil",
     "isExplicit": false
   }
   ```
3. Save the file.
4. Run or redeploy the site.
5. **The song immediately appears on the website and streams directly from its URL!**
   - The album is **automatically derived** and appears in the Albums section.
   - The artist profile is **automatically derived** with top tracks and albums.

---

## 🎧 Audio Player Features

- **Single Persistent Audio Engine**: Continuous playback across all in-app navigation routes.
- **Direct Progressive Streaming**: Native browser streaming with HTTP 206 Partial Content byte-range seeking (never downloads the full file upfront).
- **Universal Host Support**: Supports audio URLs from any compatible HTTPS host (Cloudflare R2 public links, personal servers, CDNs, AWS S3, Google Cloud, etc.), including URLs with query parameters/tokens.
- **Full Playback Controls**:
  - Play, pause, resume
  - Previous and next track
  - Scrubbable seekbar with elapsed and total duration
  - Volume control and mute toggle
  - Shuffle and multi-mode repeat (Off, All, One)
  - Queue drawer (reorder, add next, remove, clear)
  - Autoplay next track on song end
- **Full-Screen Now Playing Modal**:
  - Dynamic ambient backdrop blurred from album artwork
  - Animated audio visualizer wave bars
  - Synchronized karaoke-style scrolling lyrics viewer
  - Queue viewer
- **Media Session API**: Integrates with system media controls, lock screen metadata, and keyboard keys.
- **Global Keyboard Shortcuts**: Control playback from anywhere on the keyboard.

---

## 📁 Music Catalog Fields Reference (`src/data/music.json`)

Each song in `src/data/music.json` supports the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique identifier (e.g. `"song-tamil-001"`) |
| `title` | `string` | **Yes** | Track title |
| `artist` | `string` | **Yes** | Artist or singer name |
| `album` | `string` | **Yes** | Album or movie name |
| `genre` | `string` | **Yes** | Musical genre (e.g. `"Melody"`, `"Synthwave"`, `"Classical"`) |
| `year` | `number` | **Yes** | Release year (e.g. `2025`) |
| `duration` | `number` | **Yes** | Duration in seconds (e.g. `240` for 4:00) |
| `audioUrl` | `string` | **Yes** | Direct HTTPS audio stream URL |
| `thumbnailUrl` | `string` | **Yes** | Direct image URL for cover art (fallback SVG provided if broken) |
| `description` | `string` | No | Short description or story about the track |
| `language` | `string` | No | Language (e.g. `"Tamil"`, `"English"`, `"Instrumental"`) |
| `isExplicit` | `boolean` | No | Displays explicit `[E]` badge when `true` |
| `lyrics` | `array` | No | Array of `{ "time": seconds, "text": "lyric text" }` for synced display |
| `isDemo` | `boolean` | No | Displays a subtle `DEMO` badge |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## ☁️ Deploying to Cloudflare Pages

### Option 1: Git Integration (Recommended)
1. Push your repository to **GitHub** or **GitLab**.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. Cloudflare Pages automatically handles client-side routing via [`public/_redirects`](file:///c:/projects/wavemusic/public/_redirects).

### Option 2: Wrangler CLI Direct Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name=wavemusic
```

---

## 🧪 Testing Your Audio Stream URLs

You can test any audio URL before adding it to `music.json`:
1. Navigate to [`/settings`](http://localhost:3000/settings) in the web app.
2. In the **Audio Stream Diagnostic Tool**, paste your direct audio URL.
3. Click **Test URL**.
4. The tool inspects:
   - HTTP response status (`200 OK` or `206 Partial Content`)
   - HTTP byte-range seeking capability (`Accept-Ranges: bytes`)
   - Round-trip latency (ms)
   - Content-Type header (`audio/mpeg`, `audio/mp4`, etc.)
   - CORS availability for browser playback

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> | Seek forward 5s (<kbd>Shift</kbd> + <kbd>→</kbd> for 15s) |
| <kbd>←</kbd> | Seek backward 5s (<kbd>Shift</kbd> + <kbd>←</kbd> for 15s) |
| <kbd>↑</kbd> | Increase volume 5% |
| <kbd>↓</kbd> | Decrease volume 5% |
| <kbd>M</kbd> | Mute / Unmute |
| <kbd>N</kbd> | Next track |
| <kbd>P</kbd> | Previous track (or restart song) |
| <kbd>S</kbd> | Toggle Shuffle |
| <kbd>R</kbd> | Cycle Repeat Mode (Off → All → One) |
| <kbd>L</kbd> | Toggle Favourite |

---

## ⚖️ Legal & Copyright Disclaimer

WaveMusic is an **open-source, non-commercial software application** developed strictly for educational, research, and technical demonstration purposes.

- **No Media Stored**: This GitHub repository **does not host, distribute, or store any copyrighted audio (MP3/AAC) or video (MP4) files**. All media streams are fetched at client runtime from external, user-configured HTTPS endpoints.
- **Intellectual Property**: All musical tracks, song compositions, artist names, album titles, and promotional covers are the exclusive property and trademarks of their respective copyright holders and recording labels (e.g., Sony Music, Think Music, Sun Pictures, T-Series, Saregama, Lyca Productions, etc.).
- **Fair Use**: Evaluated under Section 107 of the US Copyright Act 1976 and Section 52 of the Indian Copyright Act 1957.
- **DMCA Takedown**: Copyright owners may request immediate removal of any reference or artwork by opening a GitHub issue or consulting [LEGAL.md](LEGAL.md).

For full details, please read [LEGAL.md](LEGAL.md).

---

## 📄 License

The software source code and client architecture are licensed under the [MIT License](LICENSE). Third-party trademarks and audio catalog metadata remain the property of their respective owners.

