const express = require("express");
const router = express.Router();
const { createSuggestion } = require("../controllers/suggestionsController");
const { validateSuggestion } = require("../middleware/validators");

router.post("/", validateSuggestion, createSuggestion);

module.exports = router;
