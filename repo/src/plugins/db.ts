import fp from "fastify-plugin";
import Database from "better-sqlite3";
import type { FastifyInstance } from "fastify";

export interface DbInstance extends Database.Database {}

declare module "fastify" {
  interface FastifyInstance {
    db: DbInstance;
  }
}

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

export const dbPlugin = fp(async (fastify: FastifyInstance) => {
  const dbPath = DATABASE_URL;

  // Ensure directory exists
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run migrations
  for (const migration of migrations) {
    db.exec(migration);
  }

  // Bind prepared statements for performance
  const stmts = {
    createUser: db.prepare(
      `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
    ),
    getUserById: db.prepare(`SELECT * FROM users WHERE id = ?`),
    getUserByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
    getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),
    updateUserToken: db.prepare(
      `UPDATE users SET refresh_token = ?, refresh_token_expiry = ?, updated_at = datetime('now') WHERE id = ?`,
    ),
    updateUserUpdatedAt: db.prepare(
      `UPDATE users SET updated_at = datetime('now') WHERE id = ?`,
    ),

    createGame: db.prepare(
      `INSERT INTO games (id, user_id, board, moves, elapsed_seconds, solved, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ),
    getGame: db.prepare(`SELECT * FROM games WHERE id = ?`),
    updateGame: db.prepare(
      `UPDATE games SET board = ?, moves = ?, elapsed_seconds = ?, solved = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    ),
    getGamesByUser: db.prepare(
      `SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ),

    createScore: db.prepare(
      `INSERT INTO scores (id, user_id, game_duration, move_count) VALUES (?, ?, ?, ?)`,
    ),
    getScoresByUser: db.prepare(
      `SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ),
    getTopScores: db.prepare(
      `SELECT s.*, u.username FROM scores s JOIN users u ON s.user_id = u.id ORDER BY s.game_duration ASC, s.move_count ASC LIMIT ?`,
    ),
  };

  fastify.decorate("db", db);
  fastify.decorate("stmts", stmts);

  fastify.addHook("onClose", async () => {
    db.close();
  });
});
