import { Router } from "express";
import { habitSchema, habitUpdateSchema, checkinSchema } from "../../shared/schemas.js";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import { calculateHabitStreak, toDateString } from "../utils/streakCalculator.js";

const router = Router();

// All habit routes require authentication
router.use(requireAuth);

// GET /api/habits - list all active habits with computed streaks
router.get("/", async (req, res) => {
  try {
    const habits = await db.getHabits(req.user.id, req.token);
    const allLogs = await db.getAllHabitLogsForUser(req.user.id, req.token);
    const today = toDateString();

    const logsByHabit = new Map();
    for (const log of allLogs) {
      if (!logsByHabit.has(log.habit_id)) {
        logsByHabit.set(log.habit_id, []);
      }
      logsByHabit.get(log.habit_id).push(log.log_date);
    }

    const enhancedHabits = await Promise.all(
      habits.map(async habit => {
        const habitLogs = logsByHabit.get(habit.id) || [];
        const streakInfo = calculateHabitStreak(habit, habitLogs, today);

        // Update streaks in DB if changed
        if (
          streakInfo.current_streak !== habit.current_streak ||
          streakInfo.longest_streak !== habit.longest_streak
        ) {
          await db.updateHabit(
            req.user.id,
            habit.id,
            {
              current_streak: streakInfo.current_streak,
              longest_streak: streakInfo.longest_streak
            },
            req.token
          );
        }

        return {
          ...habit,
          current_streak: streakInfo.current_streak,
          longest_streak: streakInfo.longest_streak,
          is_completed_today: streakInfo.is_completed_today,
          streak_broken: streakInfo.streak_broken
        };
      })
    );

    return res.json(enhancedHabits);
  } catch (err) {
    console.error("Error fetching habits:", err);
    return res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// POST /api/habits - create habit
router.post("/", async (req, res) => {
  const parseResult = habitSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const newHabit = await db.createHabit(req.user.id, parseResult.data, req.token);
    return res.status(201).json({
      ...newHabit,
      current_streak: 0,
      longest_streak: 0,
      is_completed_today: false
    });
  } catch (err) {
    console.error("Error creating habit:", err);
    return res.status(500).json({ error: "Failed to create habit" });
  }
});

// GET /api/habits/:id - single habit detail + log history
router.get("/:id", async (req, res) => {
  try {
    const habit = await db.getHabitById(req.user.id, req.params.id, req.token);
    const logs = await db.getHabitLogs(req.user.id, req.params.id, req.token);
    const today = toDateString();

    const streakInfo = calculateHabitStreak(habit, logs, today);

    // Sync streak metrics
    if (
      streakInfo.current_streak !== habit.current_streak ||
      streakInfo.longest_streak !== habit.longest_streak
    ) {
      await db.updateHabit(
        req.user.id,
        habit.id,
        {
          current_streak: streakInfo.current_streak,
          longest_streak: streakInfo.longest_streak
        },
        req.token
      );
    }

    return res.json({
      habit: {
        ...habit,
        current_streak: streakInfo.current_streak,
        longest_streak: streakInfo.longest_streak,
        is_completed_today: streakInfo.is_completed_today
      },
      logs,
      streakInfo
    });
  } catch (err) {
    console.error("Error fetching habit detail:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to fetch habit" });
  }
});

// PATCH /api/habits/:id - update habit
router.patch("/:id", async (req, res) => {
  const parseResult = habitUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const updated = await db.updateHabit(req.user.id, req.params.id, parseResult.data, req.token);
    return res.json(updated);
  } catch (err) {
    console.error("Error updating habit:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to update habit" });
  }
});

// DELETE /api/habits/:id - archive/delete habit
router.delete("/:id", async (req, res) => {
  try {
    await db.deleteHabit(req.user.id, req.params.id, req.token);
    return res.json({ success: true, message: "Habit archived successfully" });
  } catch (err) {
    console.error("Error deleting habit:", err);
    return res.status(500).json({ error: "Failed to delete habit" });
  }
});

// POST /api/habits/:id/checkin - log today (or specified date) as complete, recalculate streak
router.post("/:id/checkin", async (req, res) => {
  const parseResult = checkinSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const logDate = parseResult.data.log_date || toDateString();
    const habit = await db.getHabitById(req.user.id, req.params.id, req.token);

    // Save log
    const log = await db.addHabitLog(req.user.id, habit.id, logDate, req.token);

    // Fetch updated logs and recalculate streak
    const logs = await db.getHabitLogs(req.user.id, habit.id, req.token);
    const streakInfo = calculateHabitStreak(habit, logs, toDateString());

    // Update habit with new streak values
    const updatedHabit = await db.updateHabit(
      req.user.id,
      habit.id,
      {
        current_streak: streakInfo.current_streak,
        longest_streak: streakInfo.longest_streak
      },
      req.token
    );

    return res.json({
      success: true,
      log,
      habit: {
        ...updatedHabit,
        is_completed_today: streakInfo.is_completed_today
      },
      streakInfo
    });
  } catch (err) {
    console.error("Error during habit checkin:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to check in habit" });
  }
});

// DELETE /api/habits/:id/checkin - undo checkin for today (or specified date)
router.delete("/:id/checkin", async (req, res) => {
  try {
    const logDate = req.query.date || req.body?.log_date || toDateString();
    const habit = await db.getHabitById(req.user.id, req.params.id, req.token);

    await db.removeHabitLog(req.user.id, habit.id, logDate, req.token);

    // Recalculate streak
    const logs = await db.getHabitLogs(req.user.id, habit.id, req.token);
    const streakInfo = calculateHabitStreak(habit, logs, toDateString());

    const updatedHabit = await db.updateHabit(
      req.user.id,
      habit.id,
      {
        current_streak: streakInfo.current_streak,
        longest_streak: streakInfo.longest_streak
      },
      req.token
    );

    return res.json({
      success: true,
      habit: {
        ...updatedHabit,
        is_completed_today: streakInfo.is_completed_today
      },
      streakInfo
    });
  } catch (err) {
    console.error("Error removing checkin:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to remove check-in" });
  }
});

export default router;
