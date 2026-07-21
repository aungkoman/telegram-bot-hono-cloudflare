-- Prediction League Bot - initial schema
-- Run with: npm run db:migrate:local  /  npm run db:migrate:remote

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL UNIQUE,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- membership of a user within a group leaderboard
CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  group_id INTEGER NOT NULL REFERENCES groups(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, group_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id INTEGER NOT NULL UNIQUE, -- football-data.org match id
  competition_code TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_time TEXT NOT NULL, -- ISO 8601 UTC
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED | FINISHED | POSTPONED | CANCELLED
  home_score INTEGER,
  away_score INTEGER,
  scored INTEGER NOT NULL DEFAULT 0, -- 1 once points have been distributed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  group_id INTEGER NOT NULL REFERENCES groups(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  predicted_home INTEGER NOT NULL,
  predicted_away INTEGER NOT NULL,
  points_awarded INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, group_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON memberships(group_id, total_points DESC);
