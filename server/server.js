require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./database/db"); // makes sure tables exist before the app starts

const factsRoutes = require("./routes/facts");
const gameRoutes = require("./routes/game");
const suggestionsRoutes = require("./routes/suggestions");
const contactRoutes = require("./routes/contact");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Energize the Future API is running." });
});

app.use("/api/facts", factsRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/contact", contactRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Energize the Future API running on http://localhost:${PORT}`);
});
