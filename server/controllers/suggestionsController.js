const db = require("../database/db");

function createSuggestion(req, res) {
  const { name, email, category, message } = req.body;

  const stmt = db.prepare(
    "INSERT INTO suggestions (name, email, category, message) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(name, email, category, message);

  res.status(201).json({
    success: true,
    message: "Thank you! Your suggestion has been received.",
    data: { id: result.lastInsertRowid },
  });
}

// Not exposed to the public router, but useful for local administration/testing.
function getAllSuggestions(req, res) {
  const rows = db
    .prepare("SELECT id, name, category, message, created_at AS createdAt FROM suggestions ORDER BY id DESC")
    .all();
  res.json({ success: true, data: rows });
}

module.exports = { createSuggestion, getAllSuggestions };
