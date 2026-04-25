## Configuration

MediaPlay supports both **environment variables** and **CLI flags**.
So it is easy for anyone to run the server in one command.

### Priority Order

1. CLI flags (highest priority)
2. `.env` file
3. system environment
4. defaults

### CLI Flags (Recommended)

```bash
./mediaplay \
  --port 8000 \
  --media ./media \
  --db app_data.db \
  --tmdb YOUR_API_KEY
```

Available flags:

- `--port` → server port (default: `8000`)
- `--media` → media directory (default: `./media`)
- `--db` → database file path (default: `app_data.db`)
- `--tmdb` → TMDB API key (optional)

### Environment Variables

You can also use a `.env` file in same folder:

```env
TMDB_API_KEY=your_api_key

# defaults
MEDIA_PATH=./media
DATABASE_PATH=app_data.db
PORT=8000
```

### Example

```bash
./mediaplay --media /mnt/media --port 9000
```
