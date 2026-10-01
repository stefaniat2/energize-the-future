const db = require("../database/db");

function createContactMessage(req, res) {
  const { name, email, subject, message } = req.body;

  const stmt = db.prepare(
    "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(name, email, subject, message);

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received.",
    data: { id: result.lastInsertRowid },
  });
}

module.exports = { createContactMessage };
