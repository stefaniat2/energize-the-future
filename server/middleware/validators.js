// Simple, dependency-free input validation helpers.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUGGESTION_CATEGORIES = [
  "renewable-energy",
  "energy-efficiency",
  "education",
  "transportation",
  "community-projects",
  "other",
];

function validateSuggestion(req, res, next) {
  const { name, email, category, message } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    errors.push("Name must be between 2 and 100 characters.");
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email address is required.");
  }
  if (!category || !SUGGESTION_CATEGORIES.includes(category)) {
    errors.push("A valid suggestion category is required.");
  }
  if (!message || typeof message !== "string" || message.trim().length < 10 || message.trim().length > 2000) {
    errors.push("Message must be between 10 and 2000 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid input.", errors });
  }

  req.body.name = name.trim();
  req.body.email = email.trim();
  req.body.message = message.trim();
  next();
}

function validateScore(req, res, next) {
  const { playerName, score, sustainabilityScore, levelsCompleted } = req.body || {};
  const errors = [];

  if (!playerName || typeof playerName !== "string" || playerName.trim().length < 1 || playerName.trim().length > 30) {
    errors.push("Player name must be between 1 and 30 characters.");
  }
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1000000) {
    errors.push("Score must be a valid, non-negative number.");
  }
  if (
    typeof sustainabilityScore !== "number" ||
    !Number.isFinite(sustainabilityScore) ||
    sustainabilityScore < 0 ||
    sustainabilityScore > 100
  ) {
    errors.push("Sustainability score must be a number between 0 and 100.");
  }
  if (
    typeof levelsCompleted !== "number" ||
    !Number.isInteger(levelsCompleted) ||
    levelsCompleted < 0 ||
    levelsCompleted > 100
  ) {
    errors.push("Levels completed must be a valid whole number.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid score submission.", errors });
  }

  req.body.playerName = playerName.trim();
  next();
}

function validateContactMessage(req, res, next) {
  const { name, email, subject, message } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    errors.push("Name must be between 2 and 100 characters.");
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email address is required.");
  }
  if (!subject || typeof subject !== "string" || subject.trim().length < 3 || subject.trim().length > 150) {
    errors.push("Subject must be between 3 and 150 characters.");
  }
  if (!message || typeof message !== "string" || message.trim().length < 10 || message.trim().length > 2000) {
    errors.push("Message must be between 10 and 2000 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid input.", errors });
  }

  req.body.name = name.trim();
  req.body.email = email.trim();
  req.body.subject = subject.trim();
  req.body.message = message.trim();
  next();
}

module.exports = { validateSuggestion, validateScore, validateContactMessage, SUGGESTION_CATEGORIES };
