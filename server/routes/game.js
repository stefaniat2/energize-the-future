const express = require("express");
const router = express.Router();
const { getScenarios, submitScore, getLeaderboard } = require("../controllers/gameController");
const { validateScore } = require("../middleware/validators");

router.get("/scenarios", getScenarios);
router.post("/scores", validateScore, submitScore);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
