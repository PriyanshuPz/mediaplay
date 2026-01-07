CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY,

  -- what kind of media this is
  type TEXT NOT NULL CHECK (
    type IN ('movie', 'series', 'video', 'image')
  ),

  title TEXT NOT NULL,
  description TEXT,

  -- optional metadata
  year INTEGER,
  poster_path TEXT,

  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);



CREATE TABLE IF NOT EXISTS media_files (
  id INTEGER PRIMARY KEY,

  media_id INTEGER NOT NULL,
  path TEXT NOT NULL UNIQUE,

  -- file metadata
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  duration REAL,
  mime TEXT,

  -- episode-specific (optional)
  season INTEGER,
  episode INTEGER,

  indexed_at INTEGER NOT NULL,

  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_files_media ON media_files(media_id);
CREATE INDEX IF NOT EXISTS idx_media_files_season ON media_files(season, episode);
