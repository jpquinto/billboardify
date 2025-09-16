BEGIN;

-- Add the genre column to the daily_artist_aggregates table
ALTER TABLE daily_artist_aggregates
ADD COLUMN genre VARCHAR(255) NULL;

-- Create an index on the new genre column for efficient searching
CREATE INDEX IF NOT EXISTS idx_daily_artist_genre ON daily_artist_aggregates (genre);

-- Add the genre column to the monthly_artist_aggregates table
ALTER TABLE monthly_artist_aggregates
ADD COLUMN genre VARCHAR(255) NULL;

-- Create an index on the new genre column for efficient searching
CREATE INDEX IF NOT EXISTS idx_monthly_artist_genre ON monthly_artist_aggregates (genre);

-- Add the genre column to the yearly_artist_aggregates table
ALTER TABLE yearly_artist_aggregates
ADD COLUMN genre VARCHAR(255) NULL;

-- Create an index on the new genre column for efficient searching
CREATE INDEX IF NOT EXISTS idx_yearly_artist_genre ON yearly_artist_aggregates (genre);

COMMIT;