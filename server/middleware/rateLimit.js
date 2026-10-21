// Tiny in-memory rate limiter (per IP, fixed window). Enough to stop form/score spam
// on a single-instance deployment without adding a dependency.
function rateLimit({ windowMs, max }) {
  const hits = new Map(); // ip -> { count, resetAt }

  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(ip);
    }
  }, windowMs).unref();

  return function limiter(req, res, next) {
    if (req.method !== "POST") return next();

    const now = Date.now();
    const entry = hits.get(req.ip);

    if (!entry || entry.resetAt <= now) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      });
    }
    next();
  };
}

module.exports = { rateLimit };
