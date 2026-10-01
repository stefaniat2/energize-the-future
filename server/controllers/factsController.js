const db = require("../database/db");

// Turns a raw database row into a language-aware fact object.
function formatFact(row, lang) {
  const validLang = ["en", "ro", "ru"].includes(lang) ? lang : "en";
  return {
    id: row.id,
    category: row.category,
    text: row[`text_${validLang}`],
  };
}

function getAllFacts(req, res) {
  const lang = req.query.lang || "en";
  const rows = db.prepare("SELECT * FROM facts ORDER BY id ASC").all();
  res.json({ success: true, data: rows.map((row) => formatFact(row, lang)) });
}

function getFactsByCategory(req, res) {
  const lang = req.query.lang || "en";
  const { category } = req.params;
  const rows = db.prepare("SELECT * FROM facts WHERE category = ? ORDER BY id ASC").all(category);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: `No facts found for category "${category}".` });
  }

  res.json({ success: true, data: rows.map((row) => formatFact(row, lang)) });
}

function getRandomFact(req, res) {
  const lang = req.query.lang || "en";
  const { category } = req.query;

  const row = category
    ? db.prepare("SELECT * FROM facts WHERE category = ? ORDER BY RANDOM() LIMIT 1").get(category)
    : db.prepare("SELECT * FROM facts ORDER BY RANDOM() LIMIT 1").get();

  if (!row) {
    return res.status(404).json({ success: false, message: "No facts available." });
  }

  res.json({ success: true, data: formatFact(row, lang) });
}

module.exports = { getAllFacts, getFactsByCategory, getRandomFact };
