const db = require("../database/db");
const { asyncHandler } = require("../middleware/asyncHandler");

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

const getScenarios = asyncHandler(async (req, res) => {
  const lang = req.query.lang || "en";
  const rows = await db.all("SELECT * FROM game_scenarios ORDER BY level ASC");
  res.json({ success: true, data: rows.map((row) => formatScenario(row, lang)) });
});

const submitScore = asyncHandler(async (req, res) => {
  const { playerName, score, sustainabilityScore, levelsCompleted } = req.body;

  const result = await db.run(
    "INSERT INTO game_scores (player_name, score, sustainability_score, levels_completed) VALUES (?, ?, ?, ?)",
    [playerName, score, sustainabilityScore, levelsCompleted]
  );

  res.status(201).json({
    success: true,
    message: "Score submitted successfully.",
    data: { id: result.lastInsertRowid, playerName, score, sustainabilityScore, levelsCompleted },
  });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const rows = await db.all(
    `SELECT player_name AS playerName, score, sustainability_score AS sustainabilityScore,
            levels_completed AS levelsCompleted, created_at AS createdAt
     FROM game_scores
     ORDER BY score DESC, sustainability_score DESC
     LIMIT ?`,
    [limit]
  );

  res.json({ success: true, data: rows });
});

module.exports = { getScenarios, submitScore, getLeaderboard };
