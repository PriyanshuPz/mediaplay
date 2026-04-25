# MediaPlay

MediaPlay is a self-hostable media library system like Jellyfin but very simple and lightweight. It is built for personal use, not for heavy production or multi-user system.
You can use this to manage your movies, music, and web series locally with automatic scanning and metadata fetching.

## Features

- Supports Movies, Music and Web Series
- Automatic scanning of media folder
- Basic metadata fetching (TMDB, iTunes for now.)
- Thumbnail support
- Simple UI
- Built with Go backend (single binary possible)
- No login, no auth, just plug and use

## Demo
https://github.com/user-attachments/assets/fa248d02-f0d1-443d-a3a4-6befe3f0aad9

## Installation

### Option 1 — Prebuilt Binary (Recommended)

Download the latest release from GitHub [(Releases section)]().

Pick the correct file for your system:

- Linux: `mediaplay-<version>-linux-amd64`
- Windows: `mediaplay-<version>-windows-amd64.exe`
- ARM (Raspberry Pi): `mediaplay-<version>-linux-arm-v7` or `arm-v6`

#### Run

```bash
chmod +x mediaplay-*
./mediaplay-*
```

On Windows:

```bash
mediaplay-*.exe
```

By default, server runs on:

```
http://localhost:8000
```

### Option 2 — Docker

Pull and run:

```bash
docker run -d \
  -p 8000:8000 \
  -v /path/to/your/media:/media \
  ghcr.io/p8labs/mediaplay:latest
```

Then open:

```
http://localhost:8000
```

#### Notes

- Replace `/path/to/your/media` with your actual media folder
- Container expects media at `/media`
- Works on amd64, arm64, arm/v7 (Raspberry Pi)

### Option 3 — Build from Source

Requirements:

- Go 1.22+
- pnpm (for frontend)

```bash
git clone https://github.com/p8labs/mediaplay.git
cd mediaplay

cd web
pnpm install
pnpm build
cd ..

go build -o mediaplay ./cmd
```

Run:

```bash
./mediaplay
```

---

### Configuration

Currently minimal.

```env

TMDB_API_KEY="" # get this from https://www.themoviedb.org if want rich metadata

# defaults
MEDIA_PATH="./media"
DATABASE_URL="app_data.db"
PORT="8000"
```

## Media Folder Structure

This is very important. Scanner depends on this structure.

```
/media
  /Movies
    movie.mp4
    /Movie Name
      movie.mp4

  /Web Series
    /Series Name
      /Season 1
        episode1.mp4
        episode2.mp4

  /Music
    song.mp3
    /Album
      song.mp3
```

### Notes

- Folder names are only used as hint, not strict
- System will try best to guess title
- You can fix metadata manually from UI

## Usage

1. Put your media inside `/media`
2. Start server
3. Open browser:

```
http://localhost:8000
```

4. It will auto scan every few minutes
5. Play media directly from UI

## Important Things

- This is not streaming optimized yet (no transcoding)
- Plays files directly from disk
- Best for local network usage

## Known Limitations

- No users / authentication
- No subtitle support yet
- No advanced search
- Basic player only

## Future Plans (maybe I AM LAZY!!)

- Better metadata system
- Background jobs improvements
- UI improvements
- Streaming optimization

## Final Note

This project is made for learning and personal usage. Don’t expect production-level stability. But for simple home media usage, it should work nicely.
