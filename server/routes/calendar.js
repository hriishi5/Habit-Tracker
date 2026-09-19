import { Router } from "express";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import { toDateString, getDayOfWeek } from "../utils/streakCalculator.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/calendar?month=YYYY-MM
 * Returns per-day aggregated data for the specified month (or current month if omitted).
 */
router.get("/", async (req, res) => {
  try {
    const monthQuery = req.query.month || toDateString().slice(0, 7); // e.g. '2026-09'
    const [year, month] = monthQuery.split("-").map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });
    }

    const startOfMonth = `${monthQuery}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endOfMonth = `${monthQuery}-${String(daysInMonth).padStart(2, "0")}`;

    // Fetch user habits, logs, and tasks
    const [habits, allLogs, tasks] = await Promise.all([
      db.getHabits(req.user.id, req.token),
      db.getAllHabitLogsForUser(req.user.id, req.token),
      db.getTasks(req.user.id, { from: startOfMonth, to: endOfMonth }, req.token)
    ]);

    // Index logs by date
    const logsByDate = new Map();
    for (const log of allLogs) {
      if (log.log_date >= startOfMonth && log.log_date <= endOfMonth) {
        if (!logsByDate.has(log.log_date)) {
          logsByDate.set(log.log_date, []);
        }
        logsByDate.get(log.log_date).push(log.habit_id);
      }
    }

    // Index tasks by due_date
    const tasksByDate = new Map();
    for (const task of tasks) {
      if (task.due_date) {
        if (!tasksByDate.has(task.due_date)) {
          tasksByDate.set(task.due_date, []);
        }
        tasksByDate.get(task.due_date).push(task);
      }
    }

    const days = [];
    const habitCount = habits.length;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthQuery}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = getDayOfWeek(dateStr);
      const completedHabitIds = logsByDate.get(dateStr) || [];
      const dayTasks = tasksByDate.get(dateStr) || [];

      // Calculate habits scheduled for this day
      let scheduledCount = 0;
      for (const h of habits) {
        if (h.start_date && h.start_date > dateStr) continue;
        if (h.frequency_type === "daily") {
          scheduledCount++;
        } else if (h.frequency_type === "weekly_days") {
          const daysArray = Array.isArray(h.frequency_value) ? h.frequency_value : [];
          if (daysArray.includes(dayOfWeek)) scheduledCount++;
        } else {
          scheduledCount++;
        }
      }

      // Heatmap intensity 0 to 4
      let intensity = 0;
      const completedCount = completedHabitIds.length;
      if (completedCount > 0) {
        const ratio = scheduledCount > 0 ? completedCount / scheduledCount : 1;
        if (ratio >= 1.0) intensity = 4;
        else if (ratio >= 0.75) intensity = 3;
        else if (ratio >= 0.5) intensity = 2;
        else intensity = 1;
      }

      days.push({
        date: dateStr,
        day_number: d,
        day_of_week: dayOfWeek,
        habits_completed: completedCount,
        habits_scheduled: scheduledCount,
        intensity,
        tasks_count: dayTasks.length,
        tasks_completed: dayTasks.filter(t => t.is_completed).length
      });
    }

    return res.json({
      month: monthQuery,
      year,
      month_number: month,
      total_days: daysInMonth,
      active_habits_count: habitCount,
      days
    });
  } catch (err) {
    console.error("Error generating calendar heatmap:", err);
    return res.status(500).json({ error: "Failed to load calendar data" });
  }
});

/**
 * GET /api/calendar/day?date=YYYY-MM-DD
 * Detailed drilldown for a specific day
 */
router.get("/day", async (req, res) => {
  try {
    const dateStr = req.query.date || toDateString();
    const [habits, allLogs, allTasks] = await Promise.all([
      db.getHabits(req.user.id, req.token),
      db.getAllHabitLogsForUser(req.user.id, req.token),
      db.getTasks(req.user.id, {}, req.token)
    ]);

    const completedHabitIdSet = new Set(
      allLogs.filter(l => l.log_date === dateStr).map(l => l.habit_id)
    );

    const habitsWithStatus = habits.map(h => ({
      ...h,
      completed: completedHabitIdSet.has(h.id)
    }));

    const tasksForDay = allTasks.filter(t => t.due_date === dateStr);

    return res.json({
      date: dateStr,
      habits: habitsWithStatus,
      tasks: tasksForDay,
      stats: {
        habits_completed: completedHabitIdSet.size,
        habits_total: habits.length,
        tasks_total: tasksForDay.length,
        tasks_completed: tasksForDay.filter(t => t.is_completed).length
      }
    });
  } catch (err) {
    console.error("Error fetching day drilldown:", err);
    return res.status(500).json({ error: "Failed to load day details" });
  }
});

export default router;
