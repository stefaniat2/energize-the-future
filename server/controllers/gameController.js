const db = require("../database/db");

function formatScenario(row, lang) {
  const validLang = ["en", "ro", "ru"].includes(lang) ? lang : "en";
  return {
    id: row.id,
    level: row.level,
    title: row[`title_${validLang}`],
    description: row[`description_${validLang}`],
    options: JSON.parse(row.options_json).map((opt) => ({
      text: opt.text[validLang] || opt.text.en,
      effects: opt.effects,
    })),
  };
}

function getScenarios(req, res) {
  const lang = req.query.lang || "en";
  const rows = db.prepare("SELECT * FROM game_scenarios ORDER BY level ASC").all();
  res.json({ success: true, data: rows.map((row) => formatScenario(row, lang)) });
}

function submitScore(req, res) {
  const { playerName, score, sustainabilityScore, levelsCompleted } = req.body;

  const stmt = db.prepare(
    "INSERT INTO game_scores (player_name, score, sustainability_score, levels_completed) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(playerName, score, sustainabilityScore, levelsCompleted);

  res.status(201).json({
    success: true,
    message: "Score submitted successfully.",
    data: { id: result.lastInsertRowid, playerName, score, sustainabilityScore, levelsCompleted },
  });
}

function getLeaderboard(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const rows = db
    .prepare(
      `SELECT player_name AS playerName, score, sustainability_score AS sustainabilityScore,
              levels_completed AS levelsCompleted, created_at AS createdAt
       FROM game_scores
       ORDER BY score DESC, sustainability_score DESC
       LIMIT ?`
    )
    .all(limit);

  res.json({ success: true, data: rows });
}

module.exports = { getScenarios, submitScore, getLeaderboard };
