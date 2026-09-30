CREATE TABLE IF NOT EXISTS users (
  telegram_user_id TEXT PRIMARY KEY NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  created_at TEXT NOT NULL
);
