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

// Origins allowed to call this API, in addition to the always-allowed ones below.
// Accepts a single URL or a comma-separated list, e.g. "https://a.com,https://b.com".
const EXTRA_ORIGINS = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin requests, curl, server-to-server, etc.
  if (EXTRA_ORIGINS.includes(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/\.vercel\.app$/.test(new URL(origin).hostname)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
  })
);
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
