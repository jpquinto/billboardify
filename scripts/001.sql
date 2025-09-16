BEGIN;

-- DAILY AGGREGATES

-- Table to store daily aggregated play counts for tracks
CREATE TABLE IF NOT EXISTS daily_track_aggregates (
    date DATE NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    daily_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (date, track_id)
);

-- Index for fast queries by artist within a date range
CREATE INDEX IF NOT EXISTS idx_daily_track_artist ON daily_track_aggregates (artist_id, date);
-- Index for fast queries by album within a date range
CREATE INDEX IF NOT EXISTS idx_daily_track_album ON daily_track_aggregates (album_id, date);

-- Table to store daily aggregated play counts for artists
CREATE TABLE IF NOT EXISTS daily_artist_aggregates (
    date DATE NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    daily_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (date, artist_id)
);

-- Index for fast queries by artist over a date range
CREATE INDEX IF NOT EXISTS idx_daily_artist_id ON daily_artist_aggregates (artist_id, date);

-- Table to store daily aggregated play counts for albums
CREATE TABLE IF NOT EXISTS daily_album_aggregates (
    date DATE NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    daily_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (date, album_id)
);

-- Index for fast queries by artist within a date range
CREATE INDEX IF NOT EXISTS idx_daily_album_artist ON daily_album_aggregates (artist_id, date);


-- MONTHLY AGGREGATES

-- Table to store monthly aggregated play counts for tracks
CREATE TABLE IF NOT EXISTS monthly_track_aggregates (
    year_month VARCHAR(7) NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    monthly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year_month, track_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_monthly_track_artist ON monthly_track_aggregates (artist_id, year_month);
-- Index for fast queries by album
CREATE INDEX IF NOT EXISTS idx_monthly_track_album ON monthly_track_aggregates (album_id, year_month);

-- Table to store monthly aggregated play counts for albums
CREATE TABLE IF NOT EXISTS monthly_artist_aggregates (
    year_month VARCHAR(7) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    monthly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year_month, artist_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_monthly_artist_id ON monthly_artist_aggregates (artist_id, year_month);

-- Table to store monthly aggregated play counts for albums
CREATE TABLE IF NOT EXISTS monthly_album_aggregates (
    year_month VARCHAR(7) NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    monthly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year_month, album_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_monthly_album_artist ON monthly_album_aggregates (artist_id, year_month);


-- YEARLY AGGREGATES

-- Table to store yearly aggregated play counts for tracks
CREATE TABLE IF NOT EXISTS yearly_track_aggregates (
    year INTEGER NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    yearly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year, track_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_yearly_track_artist ON yearly_track_aggregates (artist_id, year);
-- Index for fast queries by album
CREATE INDEX IF NOT EXISTS idx_yearly_track_album ON yearly_track_aggregates (album_id, year);

-- Table to store yearly aggregated play counts for albums
CREATE TABLE IF NOT EXISTS yearly_artist_aggregates (
    year INTEGER NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    yearly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year, artist_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_yearly_artist_id ON yearly_artist_aggregates (artist_id, year);

-- Table to store yearly aggregated play counts for albums
CREATE TABLE IF NOT EXISTS yearly_album_aggregates (
    year INTEGER NOT NULL,
    album_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    yearly_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (year, album_id)
);

-- Index for fast queries by artist
CREATE INDEX IF NOT EXISTS idx_yearly_album_artist ON yearly_album_aggregates (artist_id, year);

COMMIT;