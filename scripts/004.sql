-- Migration 004: Add image URL columns to aggregate tables
-- This migration adds NOT NULL image URL columns to all aggregate tables

BEGIN;

-- Add album_cover_url to daily track aggregates
ALTER TABLE daily_track_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

-- Add artist_image_url to daily artist aggregates
ALTER TABLE daily_artist_aggregates 
ADD COLUMN artist_image_url TEXT NOT NULL;

-- Add album_cover_url to daily album aggregates
ALTER TABLE daily_album_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

-- Add album_cover_url to monthly track aggregates
ALTER TABLE monthly_track_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

-- Add artist_image_url to monthly artist aggregates
ALTER TABLE monthly_artist_aggregates 
ADD COLUMN artist_image_url TEXT NOT NULL;

-- Add album_cover_url to monthly album aggregates
ALTER TABLE monthly_album_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

-- Add album_cover_url to yearly track aggregates
ALTER TABLE yearly_track_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

-- Add artist_image_url to yearly artist aggregates
ALTER TABLE yearly_artist_aggregates 
ADD COLUMN artist_image_url TEXT NOT NULL;

-- Add album_cover_url to yearly album aggregates
ALTER TABLE yearly_album_aggregates 
ADD COLUMN album_cover_url TEXT NOT NULL;

COMMIT;