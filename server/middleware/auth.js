import { db } from "../lib/supabaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: "Empty token supplied" });
    }

    const user = await db.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
