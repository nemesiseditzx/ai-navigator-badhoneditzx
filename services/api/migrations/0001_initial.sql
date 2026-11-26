PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS user_preferences (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,language TEXT NOT NULL DEFAULT 'en',personality TEXT NOT NULL DEFAULT 'friendly',voice_enabled INTEGER NOT NULL DEFAULT 1 CHECK (voice_enabled IN (0,1)),updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS saved_places (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,label TEXT NOT NULL,latitude REAL NOT NULL,longitude REAL NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places(user_id);
CREATE TABLE IF NOT EXISTS trip_summaries (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,started_at TEXT NOT NULL,ended_at TEXT,distance_meters REAL,destination_label TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_trip_summaries_user_started ON trip_summaries(user_id,started_at DESC);
CREATE TABLE IF NOT EXISTS road_reports (id TEXT PRIMARY KEY,report_type TEXT NOT NULL CHECK (report_type IN ('hazard','closure','crash','pothole','other')),latitude REAL NOT NULL,longitude REAL NOT NULL,description TEXT,status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','confirmed','resolved','rejected')),expires_at TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_road_reports_status_expiry ON road_reports(status,expires_at);
-- Deliberately no raw GPS breadcrumb table. Live location stays on-device unless the user explicitly shares a trip.
