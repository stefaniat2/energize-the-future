// Tests for the versioned seeding that keeps facts and game levels up to date.
process.env.DB_PATH = ":memory:";
process.env.TURSO_DATABASE_URL = ""; // always the in-memory database

const { test } = require("node:test");
const assert = require("node:assert/strict");

const db = require("../database/db");
const { seedDatabase, SEED_VERSION, facts } = require("../database/seedData");

test("seeding is idempotent, refreshes outdated content, and never touches user data", async () => {
  await db.ready;

  // Already seeded at startup: a second call must do nothing.
  assert.deepEqual(await seedDatabase(db), { factsInserted: 0, scenariosInserted: 0 });

  // Simulate a database seeded by an older version of the app, with a visitor's score in it.
  await db.run("INSERT INTO game_scores (player_name, score, sustainability_score, levels_completed) VALUES ('Keep', 1, 1, 1)");
  await db.run("UPDATE facts SET text_en = 'STALE TEXT' WHERE id = 1");
  await db.run("UPDATE meta SET value = '0' WHERE key = 'seed_version'");

  const refreshed = await seedDatabase(db);
  assert.equal(refreshed.factsInserted, facts.length);

  assert.equal((await db.get("SELECT text_en FROM facts WHERE id = 1")).text_en, facts[0].en, "stale text replaced");
  assert.equal((await db.get("SELECT MIN(id) AS id FROM facts")).id, 1, "ids restart at 1 so saved favourites stay valid");
  assert.equal((await db.get("SELECT COUNT(*) AS n FROM facts")).n, facts.length, "no duplicates");
  assert.equal((await db.get("SELECT COUNT(*) AS n FROM game_scores")).n, 1, "scores are untouched");
  assert.equal(Number((await db.get("SELECT value FROM meta WHERE key = 'seed_version'")).value), SEED_VERSION);
});
