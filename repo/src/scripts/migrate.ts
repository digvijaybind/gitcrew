#!/usr/bin/env tsx
/**
 * Database migration script.
 * Run with: npm run db:migrate
 * Creates/updates the SQLite database schema.
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATABASE_URL = process.env.DATABASE_URL || "./data/puzzle.db";

const migrations = [
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    refresh_token TEXT,
    refresh_token_expiry TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Create games table
  `CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    board TEXT NOT NULL,
    moves INTEGER NOT NULL DEFAULT 0,
    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
    solved INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Create scores table
  `CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    game_duration INTEGER NOT NULL,
    move_count INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Indexes for queries
  `CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_scores_duration ON scores(game_duration)`,
];

const dbDir = path.dirname(DATABASE_URL);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DATABASE_URL);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

let applied = 0;
for (const migration of migrations) {
  try {
    db.exec(migration);
    applied++;
    console.log(`✓ Applied migration`);
  } catch (err) {
    console.error(`✗ Migration failed:`, err);
  }
}

db.close();
console.log(`\nDatabase migration complete. ${applied} migration(s) applied.`);
