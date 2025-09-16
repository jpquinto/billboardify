BEGIN;

-- DAILY AGGREGATES - Add name columns

-- Add names to daily track aggregates
ALTER TABLE daily_track_aggregates 
ADD COLUMN IF NOT EXISTS track_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to daily artist aggregates
ALTER TABLE daily_artist_aggregates 
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to daily album aggregates
ALTER TABLE daily_album_aggregates 
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- MONTHLY AGGREGATES - Add name columns

-- Add names to monthly track aggregates
ALTER TABLE monthly_track_aggregates 
ADD COLUMN IF NOT EXISTS track_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to monthly artist aggregates
ALTER TABLE monthly_artist_aggregates 
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to monthly album aggregates
ALTER TABLE monthly_album_aggregates 
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- YEARLY AGGREGATES - Add name columns

-- Add names to yearly track aggregates
ALTER TABLE yearly_track_aggregates 
ADD COLUMN IF NOT EXISTS track_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to yearly artist aggregates
ALTER TABLE yearly_artist_aggregates 
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- Add names to yearly album aggregates
ALTER TABLE yearly_album_aggregates 
ADD COLUMN IF NOT EXISTS album_name VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artist_name VARCHAR(500) NOT NULL DEFAULT '';

-- Create indexes on name columns for better search performance (optional)
-- These can help with queries that filter or sort by names

-- Track name indexes
CREATE INDEX IF NOT EXISTS idx_daily_track_name ON daily_track_aggregates (track_name);
CREATE INDEX IF NOT EXISTS idx_monthly_track_name ON monthly_track_aggregates (track_name);
CREATE INDEX IF NOT EXISTS idx_yearly_track_name ON yearly_track_aggregates (track_name);

-- Artist name indexes
CREATE INDEX IF NOT EXISTS idx_daily_artist_name ON daily_artist_aggregates (artist_name);
CREATE INDEX IF NOT EXISTS idx_monthly_artist_name ON monthly_artist_aggregates (artist_name);
CREATE INDEX IF NOT EXISTS idx_yearly_artist_name ON yearly_artist_aggregates (artist_name);

-- Album name indexes
CREATE INDEX IF NOT EXISTS idx_daily_album_name ON daily_album_aggregates (album_name);
CREATE INDEX IF NOT EXISTS idx_monthly_album_name ON monthly_album_aggregates (album_name);
CREATE INDEX IF NOT EXISTS idx_yearly_album_name ON yearly_album_aggregates (album_name);

COMMIT;