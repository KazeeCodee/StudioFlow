-- Migration: add gallery_urls and video_links to spaces
-- Allows multiple images and YouTube links per space

ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_links  text[] NOT NULL DEFAULT '{}';
