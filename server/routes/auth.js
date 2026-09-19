import { Router } from "express";
import { signupSchema, loginSchema } from "../../shared/schemas.js";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors
    });
  }

  try {
    const { email, password, display_name } = result.data;
    const authResult = await db.signUp({ email, password, displayName: display_name });
    return res.status(201).json(authResult);
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(err.status || 400).json({ error: err.message || "Failed to create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors
    });
  }

  try {
    const { email, password } = result.data;
    const authResult = await db.login({ email, password });
    return res.status(200).json(authResult);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(err.status || 401).json({ error: err.message || "Invalid credentials" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch("/profile", requireAuth, async (req, res) => {
  const { display_name } = req.body;
  if (!display_name || typeof display_name !== "string") {
    return res.status(400).json({ error: "Invalid display_name" });
  }

  try {
    const updated = await db.updateProfile(req.user.id, { display_name: display_name.trim() });
    return res.json({ user: { ...req.user, display_name: updated.display_name } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
