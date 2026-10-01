const express = require("express");
const router = express.Router();
const { getAllFacts, getFactsByCategory, getRandomFact } = require("../controllers/factsController");

router.get("/random", getRandomFact);
router.get("/category/:category", getFactsByCategory);
router.get("/", getAllFacts);

module.exports = router;
