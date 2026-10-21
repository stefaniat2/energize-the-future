// Integration tests for the REST API. Run with: npm test
// Uses Node's built-in test runner and an in-memory SQLite database, so it never touches real data.
process.env.DB_PATH = ":memory:";
process.env.CLIENT_ORIGIN = "";
process.env.TURSO_DATABASE_URL = ""; // always test against the in-memory database

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../app");
const db = require("../database/db");

let server;
let base;

before(async () => {
  await db.ready;
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const json = (path, options = {}) =>
  fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

const post = (path, body) => json(path, { method: "POST", body: JSON.stringify(body) });

test("health check responds", async () => {
  const res = await json("/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).success, true);
});

test("security headers are set and x-powered-by is hidden", async () => {
  const res = await json("/health");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("facts: returns all 35 seeded facts in every language", async () => {
  const texts = {};
  for (const lang of ["en", "ro", "ru"]) {
    const body = await (await json(`/facts?lang=${lang}`)).json();
    assert.equal(body.data.length, 35);
    texts[lang] = body.data[0].text;
  }
  assert.notEqual(texts.en, texts.ro);
  assert.notEqual(texts.en, texts.ru);
});

test("facts: every category has facts, unknown category is 404", async () => {
  for (const category of ["solar", "wind", "climate", "efficiency", "hydropower", "technology"]) {
    const res = await json(`/facts/category/${category}`);
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.ok(data.length >= 5, `${category} should have at least 5 facts`);
    assert.ok(data.every((f) => f.category === category));
  }
  assert.equal((await json("/facts/category/nope")).status, 404);
});

test("facts: random fact respects the category filter", async () => {
  for (let i = 0; i < 10; i++) {
    const { data } = await (await json("/facts/random?category=wind")).json();
    assert.equal(data.category, "wind");
  }
});

test("game: 10 scenarios, each with two options and all effect keys", async () => {
  const { data } = await (await json("/game/scenarios?lang=ro")).json();
  assert.equal(data.length, 10);
  data.forEach((scenario, i) => {
    assert.equal(scenario.level, i + 1);
    assert.equal(scenario.options.length, 2);
    for (const option of scenario.options) {
      for (const key of ["clean", "pollution", "affordability", "happiness", "sustainability", "budget"]) {
        assert.equal(typeof option.effects[key], "number");
      }
    }
  });
});

test("game: valid score is stored and the leaderboard is sorted high to low", async () => {
  for (const [playerName, score] of [["Ana", 900], ["Ion", 1500], ["Maria", 1200]]) {
    const res = await post("/game/scores", { playerName, score, sustainabilityScore: 60, levelsCompleted: 10 });
    assert.equal(res.status, 201);
  }
  const { data } = await (await json("/game/leaderboard?limit=3")).json();
  assert.deepEqual(data.map((r) => r.playerName), ["Ion", "Maria", "Ana"]);
});

test("game: invalid scores are rejected with 400", async () => {
  const bad = [
    { playerName: "", score: 10, sustainabilityScore: 5, levelsCompleted: 1 },
    { playerName: "Cheater", score: 999999, sustainabilityScore: 5, levelsCompleted: 1 },
    { playerName: "Neg", score: -1, sustainabilityScore: 5, levelsCompleted: 1 },
    { playerName: "Over", score: 10, sustainabilityScore: 500, levelsCompleted: 1 },
    { playerName: "Str", score: "100", sustainabilityScore: 5, levelsCompleted: 1 },
  ];
  for (const payload of bad) {
    const res = await post("/game/scores", payload);
    assert.equal(res.status, 400, JSON.stringify(payload));
  }
});

test("suggestions: valid submission succeeds, invalid returns every error", async () => {
  const ok = await post("/suggestions", {
    name: "Maria", email: "maria@example.com", category: "education", message: "Solar panels on the school roof!",
  });
  assert.equal(ok.status, 201);

  const bad = await post("/suggestions", { name: "A", email: "nope", category: "x", message: "short" });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).errors.length, 4);
});

test("contact: valid submission succeeds, invalid is rejected", async () => {
  const ok = await post("/contact", {
    name: "Ion", email: "ion@example.com", subject: "Question", message: "Great project, thank you!",
  });
  assert.equal(ok.status, 201);
  assert.equal((await post("/contact", { name: "", email: "", subject: "", message: "" })).status, 400);
});

test("SQL injection attempts are stored as plain text, not executed", async () => {
  const res = await post("/suggestions", {
    name: "Robert'); DROP TABLE facts;--", email: "bob@example.com", category: "other", message: "Little Bobby Tables says hi.",
  });
  assert.equal(res.status, 201);
  const { data } = await (await json("/facts")).json();
  assert.equal(data.length, 35);
});

test("malformed JSON gets a clean error, not a crash", async () => {
  const res = await fetch(`${base}/contact`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json",
  });
  assert.ok(res.status >= 400 && res.status < 500);
  assert.equal((await res.json()).success, false);
});

test("unknown routes return a JSON 404", async () => {
  const res = await json("/does-not-exist");
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test("CORS: Vercel and localhost origins are allowed, unknown origins are not", async () => {
  const allowed = async (origin) =>
    (await fetch(`${base}/health`, { headers: { Origin: origin } })).headers.get("access-control-allow-origin");

  assert.equal(await allowed("https://energize-the-future.vercel.app"), "https://energize-the-future.vercel.app");
  assert.equal(await allowed("http://localhost:5173"), "http://localhost:5173");
  assert.equal(await allowed("https://evil-site.com"), null);
  const blocked = await fetch(`${base}/health`, { headers: { Origin: "https://evil-site.com" } });
  assert.equal(blocked.status, 403);
});

test("rate limiting: write endpoints return 429 when spammed", async () => {
  let blocked = 0;
  for (let i = 0; i < 40; i++) {
    const res = await post("/contact", { name: "", email: "", subject: "", message: "" });
    if (res.status === 429) blocked++;
  }
  assert.ok(blocked > 0, "expected at least one 429 response");
});
