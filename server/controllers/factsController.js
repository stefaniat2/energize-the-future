const db = require("../database/db");
const { asyncHandler } = require("../middleware/asyncHandler");

// Turns a raw database row into a language-aware fact object.
function formatFact(row, lang) {
  const validLang = ["en", "ro", "ru"].includes(lang) ? lang : "en";
  return {
    id: row.id,
    category: row.category,
    text: row[`text_${validLang}`],
  };
}

const getAllFacts = asyncHandler(async (req, res) => {
  const lang = req.query.lang || "en";
  const rows = await db.all("SELECT * FROM facts ORDER BY id ASC");
  res.json({ success: true, data: rows.map((row) => formatFact(row, lang)) });
});

const getFactsByCategory = asyncHandler(async (req, res) => {
  const lang = req.query.lang || "en";
  const { category } = req.params;
  const rows = await db.all("SELECT * FROM facts WHERE category = ? ORDER BY id ASC", [category]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: `No facts found for category "${category}".` });
  }

  res.json({ success: true, data: rows.map((row) => formatFact(row, lang)) });
});

const getRandomFact = asyncHandler(async (req, res) => {
  const lang = req.query.lang || "en";
  const { category } = req.query;

  const row = category
    ? await db.get("SELECT * FROM facts WHERE category = ? ORDER BY RANDOM() LIMIT 1", [category])
    : await db.get("SELECT * FROM facts ORDER BY RANDOM() LIMIT 1");

  if (!row) {
    return res.status(404).json({ success: false, message: "No facts available." });
  }

  res.json({ success: true, data: formatFact(row, lang) });
});

module.exports = { getAllFacts, getFactsByCategory, getRandomFact };
