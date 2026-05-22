-- Migration 041: brain_articles table for content-engine Brain articles
-- Tracks article lifecycle: seed → composition → image gen → upload → publish
-- Stored in the same D1 database as LINE Harness for unified infra.

CREATE TABLE IF NOT EXISTS brain_articles (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  price              INTEGER NOT NULL DEFAULT 100,
  category           TEXT NOT NULL DEFAULT 'ビジネス',
  thumbnail_prompt   TEXT,
  seed_source        TEXT,
  composition_status TEXT NOT NULL DEFAULT 'pending'
                     CHECK (composition_status IN ('pending','ready','failed')),
  brain_status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (brain_status IN ('pending','draft_saved','under_review','published','failed')),
  brain_url          TEXT,
  image_status       TEXT DEFAULT 'none'
                     CHECK (image_status IN ('none','inserted','failed')),
  thumbnail_status   TEXT DEFAULT 'none'
                     CHECK (thumbnail_status IN ('none','done','failed')),
  last_error         TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now','+9 hours')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now','+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_brain_articles_composition ON brain_articles (composition_status);
CREATE INDEX IF NOT EXISTS idx_brain_articles_brain_status ON brain_articles (brain_status);
