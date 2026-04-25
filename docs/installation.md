## Installation

Installing MediaPlay is very easy and there are multiple ways in which you can install it.

### Option 1 — Prebuilt Binary (Recommended)

Download the latest release from GitHub [(Releases)](https://github.com/PriyanshuPz/mediaplay/releases).

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
  ghcr.io/priyanshupz/mediaplay:latest
```

### Option 3 — Build from Source

Requirements:

- Go 1.22+
- pnpm (for frontend)

```bash
git clone https://github.com/PriyanshuPz/mediaplay.git
cd mediaplay

cd web
pnpm install
pnpm build
cd ..

go build -o mediaplay ./cmd
./mediaplay
```
