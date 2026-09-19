import { Router } from "express";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import { weeklyReviewRateLimit } from "../middleware/rateLimit.js";
import { aiWeeklyReviewResponseSchema } from "../../shared/schemas.js";
import { generateJSON, COACH_MOMENTUM_SYSTEM_PROMPT } from "../lib/gemini.js";
import { toDateString, shiftDays, calculateHabitStreak } from "../utils/streakCalculator.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/analytics/summary?range=7|30|90
 */
router.get("/summary", async (req, res) => {
  try {
    const range = [7, 30, 90].includes(Number(req.query.range)) ? Number(req.query.range) : 30;
    const today = toDateString();
    const startDate = shiftDays(today, -(range - 1));

    const [tasks, habits, allLogs] = await Promise.all([
      db.getTasks(req.user.id, {}, req.token),
      db.getHabits(req.user.id, req.token),
      db.getAllHabitLogsForUser(req.user.id, req.token)
    ]);

    // 1. Task completion over time (grouped by day)
    const dailySeries = [];
    const tasksByDay = new Map();
    for (const t of tasks) {
      const d = t.due_date || t.created_at.slice(0, 10);
      if (d >= startDate && d <= today) {
        if (!tasksByDay.has(d)) {
          tasksByDay.set(d, { total: 0, completed: 0 });
        }
        tasksByDay.get(d).total++;
        if (t.is_completed) {
          tasksByDay.get(d).completed++;
        }
      }
    }

    // Also track habit checkins by day
    const habitLogsByDay = new Map();
    for (const l of allLogs) {
      if (l.log_date >= startDate && l.log_date <= today) {
        habitLogsByDay.set(l.log_date, (habitLogsByDay.get(l.log_date) || 0) + 1);
      }
    }

    let totalScheduledHabits = 0;
    let totalCompletedHabits = 0;
    let totalTasksInRange = 0;
    let completedTasksInRange = 0;

    for (let i = 0; i < range; i++) {
      const dStr = shiftDays(startDate, i);
      const taskStats = tasksByDay.get(dStr) || { total: 0, completed: 0 };
      const habitLogsCount = habitLogsByDay.get(dStr) || 0;

      totalTasksInRange += taskStats.total;
      completedTasksInRange += taskStats.completed;

      // Habit consistency for this day
      const dayScheduled = habits.length;
      totalScheduledHabits += dayScheduled;
      totalCompletedHabits += habitLogsCount;

      const taskRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : null;
      const habitRate = dayScheduled > 0 ? Math.round((habitLogsCount / dayScheduled) * 100) : 0;

      dailySeries.push({
        date: dStr,
        task_completion_rate: taskRate,
        tasks_completed: taskStats.completed,
        tasks_total: taskStats.total,
        habit_checkins: habitLogsCount,
        habit_consistency_rate: habitRate
      });
    }

    // Consistency score
    const overallConsistency = totalScheduledHabits > 0
      ? Math.round((totalCompletedHabits / totalScheduledHabits) * 100)
      : (habits.length > 0 ? 0 : 100);

    const taskCompletionRate = totalTasksInRange > 0
      ? Math.round((completedTasksInRange / totalTasksInRange) * 100)
      : (tasks.length > 0 ? 0 : 100);

    // Per-habit streak metrics
    const habitStreaks = habits.map(h => {
      const logs = allLogs.filter(l => l.habit_id === h.id).map(l => l.log_date);
      const streakInfo = calculateHabitStreak(h, logs, today);
      return {
        id: h.id,
        name: h.name,
        category: h.category,
        current_streak: streakInfo.current_streak,
        longest_streak: streakInfo.longest_streak,
        total_completions: logs.length
      };
    });

    return res.json({
      range_days: range,
      start_date: startDate,
      end_date: today,
      stats: {
        task_completion_rate: taskCompletionRate,
        overall_consistency: overallConsistency,
        tasks_completed: completedTasksInRange,
        tasks_total: totalTasksInRange,
        active_habits_count: habits.length,
        total_habit_logs: allLogs.length
      },
      daily_series: dailySeries,
      habit_streaks: habitStreaks
    });
  } catch (err) {
    console.error("Error computing analytics summary:", err);
    return res.status(500).json({ error: "Failed to generate analytics summary" });
  }
});

/**
 * GET /api/analytics/weekly-review/latest
 */
router.get("/weekly-review/latest", async (req, res) => {
  try {
    const latest = await db.getLatestWeeklyReview(req.user.id, req.token);
    return res.json(latest);
  } catch (err) {
    console.error("Error fetching latest review:", err);
    return res.status(500).json({ error: "Failed to fetch latest review" });
  }
});

/**
 * POST /api/analytics/weekly-review
 * Rate-limited to once per 6 hours
 */
router.post("/weekly-review", weeklyReviewRateLimit, async (req, res) => {
  try {
    const today = toDateString();
    const sevenDaysAgo = shiftDays(today, -6);

    const [tasks, habits, allLogs] = await Promise.all([
      db.getTasks(req.user.id, {}, req.token),
      db.getHabits(req.user.id, req.token),
      db.getAllHabitLogsForUser(req.user.id, req.token)
    ]);

    // Tasks in the last 7 days
    const recentTasks = tasks.filter(t => {
      const d = t.due_date || t.created_at.slice(0, 10);
      return d >= sevenDaysAgo && d <= today;
    });

    const tasksCompleted = recentTasks.filter(t => t.is_completed).length;
    const tasksTotal = recentTasks.length;

    // Habit metrics this week
    const recentLogs = allLogs.filter(l => l.log_date >= sevenDaysAgo && l.log_date <= today);
    const habitCompletionsMap = new Map();
    for (const h of habits) habitCompletionsMap.set(h.id, 0);
    for (const l of recentLogs) {
      if (habitCompletionsMap.has(l.habit_id)) {
        habitCompletionsMap.set(l.habit_id, habitCompletionsMap.get(l.habit_id) + 1);
      }
    }

    const scheduledWeeklyCount = habits.length * 7;
    const consistencyPct = scheduledWeeklyCount > 0
      ? Math.round((recentLogs.length / scheduledWeeklyCount) * 100)
      : 0;

    let bestHabitName = habits[0]?.name || "None yet";
    let bestHabitStreak = habits[0]?.current_streak || 0;
    let worstHabitName = habits[0]?.name || "None yet";
    let worstHabitCompletions = habits.length > 0 ? (habitCompletionsMap.get(habits[0].id) || 0) : 0;

    for (const h of habits) {
      const logs = allLogs.filter(l => l.habit_id === h.id).map(l => l.log_date);
      const s = calculateHabitStreak(h, logs, today);
      const comps = habitCompletionsMap.get(h.id) || 0;

      if (s.current_streak >= bestHabitStreak) {
        bestHabitStreak = s.current_streak;
        bestHabitName = h.name;
      }
      if (comps <= worstHabitCompletions) {
        worstHabitCompletions = comps;
        worstHabitName = h.name;
      }
    }

    const statsSnapshot = {
      tasks_completed: tasksCompleted,
      tasks_total: tasksTotal,
      habit_count: habits.length,
      consistency_pct: consistencyPct,
      best_habit_name: bestHabitName,
      best_habit_streak: bestHabitStreak,
      worst_habit_name: worstHabitName,
      worst_habit_completions: worstHabitCompletions
    };

    const displayName = req.user.display_name || "Athlete";

    const userPrompt = `Weekly stats for ${displayName}:
- Tasks completed: ${tasksCompleted} / ${tasksTotal}
- Habits tracked: ${habits.length}
- Average habit consistency: ${consistencyPct}%
- Best performing habit: ${bestHabitName} (${bestHabitStreak}-day streak)
- Worst performing habit: ${worstHabitName} (${worstHabitCompletions} completions this week)

Generate a weekly review. Respond as JSON matching this schema:
{
  "summary": "string, 2-4 sentences, encouraging coach tone, references real stats above",
  "suggestions": ["string", "string"],
  "highlight_habit": "string, the habit name to celebrate this week"
}`;

    let aiOutput = null;
    let parsedReview = null;

    try {
      aiOutput = await generateJSON({
        systemPrompt: COACH_MOMENTUM_SYSTEM_PROMPT,
        userPrompt
      });

      if (aiOutput) {
        const cleaned = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();
        const rawJson = JSON.parse(cleaned);
        const validated = aiWeeklyReviewResponseSchema.safeParse(rawJson);
        if (validated.success) {
          parsedReview = validated.data;
        }
      }
    } catch (aiErr) {
      console.warn("AI generation error, using coach fallback:", aiErr.message);
    }

    // Resilient fallback if AI call failed or returned invalid JSON
    if (!parsedReview) {
      const taskReviewText = tasksTotal > 0
        ? `You completed ${tasksCompleted} of ${tasksTotal} scheduled tasks this past week.`
        : "You had a quiet task list this past week.";
      const habitReviewText = habits.length > 0
        ? `Consistency clocked in at ${consistencyPct}%, with "${bestHabitName}" leading the charge at a ${bestHabitStreak}-day streak.`
        : "You haven't locked in your primary habits yet.";

      parsedReview = {
        summary: `Strong commitment on the field, ${displayName}. ${taskReviewText} ${habitReviewText} True champions don't look for perfection — they look for repetition.`,
        suggestions: [
          `Prioritize completing "${worstHabitName}" early in the morning before fatigue sets in.`,
          `Set clear deadlines for your top 3 tasks daily to keep completion velocity above 80%.`
        ],
        highlight_habit: bestHabitName
      };
    }

    // Persist to weekly_reviews table
    const saved = await db.createWeeklyReview(
      req.user.id,
      {
        summary: parsedReview.summary,
        suggestions: parsedReview.suggestions,
        highlight_habit: parsedReview.highlight_habit,
        stats_snapshot: statsSnapshot
      },
      req.token
    );

    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating weekly review:", err);
    return res.status(500).json({ error: "Failed to generate weekly review" });
  }
});

export default router;
