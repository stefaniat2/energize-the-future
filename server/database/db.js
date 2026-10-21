// Database access layer built on the libSQL client (SQLite-compatible).
//   - TURSO_DATABASE_URL set  -> hosted Turso database (permanent, survives host restarts)
//   - otherwise               -> local SQLite file (DB_PATH) or ":memory:" for tests
// All helpers are async so both modes share one code path.
require("dotenv").config();
const path = require("path");
const { createClient } = require("@libsql/client");
const { seedDatabase } = require("./seedData");

function connectionOptions() {
  if (process.env.TURSO_DATABASE_URL) {
    return { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  if (process.env.DB_PATH === ":memory:") return { url: ":memory:" };
  // DB_PATH may be relative to server/ or absolute.
  const file = path.resolve(__dirname, "..", process.env.DB_PATH || "./database/energize.db");
  return { url: `file:${file}` };
}

const client = createClient(connectionOptions());

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    text_en TEXT NOT NULL,
    text_ro TEXT NOT NULL,
    text_ru TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER NOT NULL,
    title_en TEXT NOT NULL,
    title_ro TEXT NOT NULL,
    title_ru TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ro TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    options_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    sustainability_score INTEGER NOT NULL,
    levels_completed INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const db = {
  client,
  isRemote: Boolean(process.env.TURSO_DATABASE_URL),

  // SELECT many rows -> array of row objects
  async all(sql, args = []) {
    return (await client.execute({ sql, args })).rows;
  },

  // SELECT one row -> row object or undefined
  async get(sql, args = []) {
    return (await client.execute({ sql, args })).rows[0];
  },

  // INSERT / UPDATE / DELETE -> { lastInsertRowid, changes } (ids as plain numbers, not BigInt)
  async run(sql, args = []) {
    const result = await client.execute({ sql, args });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  },

  // Several statements in one transaction: [{ sql, args }, ...]
  batch(statements) {
    return client.batch(statements, "write");
  },
};

// Resolves once the tables exist and are seeded. server.js waits for it before listening,
// and app.js makes every request wait for it, so nothing can query a half-built database.
db.ready = (async () => {
  await client.executeMultiple(SCHEMA);
  const seeded = await seedDatabase(db);
  if (seeded.factsInserted || seeded.scenariosInserted) {
    console.log(
      `Auto-seeded database (facts: ${seeded.factsInserted}, scenarios: ${seeded.scenariosInserted}).`
    );
  }
})();
// Avoid a crash from an unhandled rejection; callers that await db.ready still see the error.
db.ready.catch(() => {});

module.exports = db;
