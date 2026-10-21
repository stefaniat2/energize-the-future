require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./database/db"); // makes sure tables exist (and are seeded) before the app starts

const factsRoutes = require("./routes/facts");
const gameRoutes = require("./routes/game");
const suggestionsRoutes = require("./routes/suggestions");
const contactRoutes = require("./routes/contact");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { securityHeaders } = require("./middleware/security");
const { rateLimit } = require("./middleware/rateLimit");

const app = express();

// Render (and most hosts) sit behind a proxy; this makes req.ip the real visitor IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");

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
  try {
    return /\.vercel\.app$/.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        const error = new Error("This origin is not allowed to use the API.");
        error.status = 403;
        callback(error);
      }
    },
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Energize the Future API is running." });
});

// Only write endpoints are rate limited; reading facts/scenarios stays unrestricted.
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_MAX) || 20 });

app.use("/api/facts", factsRoutes);
app.use("/api/game/scores", writeLimiter);
app.use("/api/game", gameRoutes);
app.use("/api/suggestions", writeLimiter, suggestionsRoutes);
app.use("/api/contact", writeLimiter, contactRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
