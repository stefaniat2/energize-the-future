const express = require("express");
const router = express.Router();
const { createContactMessage } = require("../controllers/contactController");
const { validateContactMessage } = require("../middleware/validators");

router.post("/", validateContactMessage, createContactMessage);

module.exports = router;
