const db = require("../database/db");
const { asyncHandler } = require("../middleware/asyncHandler");

const createSuggestion = asyncHandler(async (req, res) => {
  const { name, email, category, message } = req.body;

  const result = await db.run(
    "INSERT INTO suggestions (name, email, category, message) VALUES (?, ?, ?, ?)",
    [name, email, category, message]
  );

  res.status(201).json({
    success: true,
    message: "Thank you! Your suggestion has been received.",
    data: { id: result.lastInsertRowid },
  });
});

module.exports = { createSuggestion };
