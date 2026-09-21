import { Router } from "express";
import { taskSchema, taskUpdateSchema } from "../schemas.js";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All task routes require authentication
router.use(requireAuth);

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const { status, priority, category, from, to, sortBy } = req.query;
    const tasks = await db.getTasks(
      req.user.id,
      { status, priority, category, from, to, sortBy },
      req.token
    );
    return res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  const parseResult = taskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const createdTask = await db.createTask(req.user.id, parseResult.data, req.token);
    return res.status(201).json(createdTask);
  } catch (err) {
    console.error("Error creating task:", err);
    return res.status(500).json({ error: "Failed to create task" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  const parseResult = taskUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const updatedTask = await db.updateTask(req.user.id, req.params.id, parseResult.data, req.token);
    return res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to update task" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const success = await db.deleteTask(req.user.id, req.params.id, req.token);
    return res.json({ success, message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
