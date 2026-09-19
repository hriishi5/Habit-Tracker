// In-memory rate limiting store: key -> { timestamp, count }
const rateLimitMap = new Map();

/**
 * Creates rate limit middleware per user ID.
 * @param {string} routeKey identifier for the rate limit bucket
 * @param {number} windowMs time window in milliseconds
 * @param {number} maxRequests maximum allowed requests within window
 */
export function rateLimitPerUser(routeKey, windowMs, maxRequests = 1) {
  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = `${routeKey}:${userId}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry) {
      rateLimitMap.set(key, { timestamp: now, count: 1 });
      return next();
    }

    const elapsed = now - entry.timestamp;
    if (elapsed > windowMs) {
      // Reset window
      rateLimitMap.set(key, { timestamp: now, count: 1 });
      return next();
    }

    if (entry.count >= maxRequests) {
      const waitMinutes = Math.ceil((windowMs - elapsed) / (60 * 1000));
      return res.status(429).json({
        error: `Rate limit reached. Please wait ${waitMinutes} minute(s) before requesting another ${routeKey}.`,
        retryAfterMs: windowMs - elapsed
      });
    }

    entry.count += 1;
    return next();
  };
}

// 6-hour rate limit for weekly reviews (6 * 60 * 60 * 1000 = 21,600,000 ms)
export const weeklyReviewRateLimit = rateLimitPerUser("weekly-review", 6 * 60 * 60 * 1000, 1);

// Cooldown for AI motivate (e.g. 5 seconds to prevent spam clicks)
export const motivateRateLimit = rateLimitPerUser("ai-motivate", 5 * 1000, 3);
