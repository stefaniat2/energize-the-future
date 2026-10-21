const db = require("../database/db");
const { asyncHandler } = require("../middleware/asyncHandler");

const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const result = await db.run(
    "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
    [name, email, subject, message]
  );

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received.",
    data: { id: result.lastInsertRowid },
  });
});

module.exports = { createContactMessage };
