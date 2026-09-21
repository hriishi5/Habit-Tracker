import { Router } from "express";
import { db } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import { motivateRateLimit } from "../middleware/rateLimit.js";
import { aiNudgeResponseSchema } from "../schemas.js";
import { generateJSON, COACH_MOMENTUM_SYSTEM_PROMPT } from "../lib/gemini.js";
import { toDateString, shiftDays, calculateHabitStreak } from "../utils/streakCalculator.js";

const router = Router();

/**
 * GET /api/quotes/daily
 * Deterministic Quote of the Day seeded by calendar date.
 */
router.get("/daily", async (req, res) => {
  try {
    const quotes = await db.getAllQuotes();
    if (!quotes || quotes.length === 0) {
      return res.status(404).json({ error: "No quotes available" });
    }

    const todayStr = req.query.date || toDateString();
    // Compute deterministic numeric hash from date string
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % quotes.length;
    const dailyQuote = quotes[index];

    return res.json({
      date: todayStr,
      quote: dailyQuote
    });
  } catch (err) {
    console.error("Error fetching daily quote:", err);
    return res.status(500).json({ error: "Failed to fetch daily quote" });
  }
});

/**
 * POST /api/motivate
 * Generates an AI contextual motivational nudge referencing the user's real stats.
 */
router.post("/motivate", requireAuth, motivateRateLimit, async (req, res) => {
  try {
    const today = toDateString();
    const sevenDaysAgo = shiftDays(today, -6);

    const [tasks, habits, allLogs, quotes] = await Promise.all([
      db.getTasks(req.user.id, {}, req.token),
      db.getHabits(req.user.id, req.token),
      db.getAllHabitLogsForUser(req.user.id, req.token),
      db.getAllQuotes()
    ]);

    // Calculate 7-day task completion rate
    const recentTasks = tasks.filter(t => {
      const d = t.due_date || t.created_at.slice(0, 10);
      return d >= sevenDaysAgo && d <= today;
    });
    const completedTasks = recentTasks.filter(t => t.is_completed).length;
    const completionRate = recentTasks.length > 0
      ? Math.round((completedTasks / recentTasks.length) * 100)
      : 100;

    // Detect broken streaks and find longest active streak
    let brokenHabitName = "None";
    let brokenHabitPrevStreak = 0;
    let longestActiveStreak = 0;
    let longestActiveHabitName = "None";

    for (const h of habits) {
      const logs = allLogs.filter(l => l.habit_id === h.id).map(l => l.log_date);
      const streakInfo = calculateHabitStreak(h, logs, today);

      if (streakInfo.streak_broken && brokenHabitName === "None") {
        brokenHabitName = h.name;
        brokenHabitPrevStreak = streakInfo.previous_streak;
      }

      if (streakInfo.current_streak > longestActiveStreak) {
        longestActiveStreak = streakInfo.current_streak;
        longestActiveHabitName = h.name;
      }
    }

    // Allow client to pass specific context if a check-in just broke
    if (req.body?.habit_name) {
      brokenHabitName = req.body.habit_name;
      brokenHabitPrevStreak = Number(req.body.previous_streak) || 3;
    }

    const displayName = req.user.display_name || "Champ";

    const userPrompt = `User stats:
- Name: ${displayName}
- Broken streak habit: ${brokenHabitName} (was at ${brokenHabitPrevStreak} days)
- 7-day task completion rate: ${completionRate}%
- Longest current streak (any habit): ${longestActiveStreak} days on "${longestActiveHabitName}"

Generate a short motivational nudge (max 3 sentences) referencing these specific stats. Respond as JSON matching this schema:
{
  "message": "string, max 3 sentences",
  "tone": "encouraging | firm | celebratory",
  "related_quote_tag": "one of: discipline | consistency | resilience | comebacks | teamwork | focus | hard_work"
}`;

    let parsedNudge = null;

    try {
      const aiOutput = await generateJSON({
        systemPrompt: COACH_MOMENTUM_SYSTEM_PROMPT,
        userPrompt
      });

      if (aiOutput) {
        const cleaned = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();
        const rawJson = JSON.parse(cleaned);
        const validated = aiNudgeResponseSchema.safeParse(rawJson);
        if (validated.success) {
          parsedNudge = validated.data;
        }
      }
    } catch (aiErr) {
      console.warn("AI Nudge generation failed, using coach fallback:", aiErr.message);
    }

    // High-quality contextual coach fallback
    if (!parsedNudge) {
      if (brokenHabitName !== "None") {
        parsedNudge = {
          message: `You had a ${brokenHabitPrevStreak}-day streak on ${brokenHabitName} — Kobe didn't stop shooting after one missed jumper, and you're not stopping either. Lock back in today and start a new streak with zero hesitation.`,
          tone: "firm",
          related_quote_tag: "resilience"
        };
      } else if (completionRate < 50) {
        parsedNudge = {
          message: `Your 7-day task completion sits at ${completionRate}%, ${displayName}. Elite athletes know that sluggish stretches happen, but champions reset their focus immediately. Tackle your single most important task right now and build momentum.`,
          tone: "encouraging",
          related_quote_tag: "discipline"
        };
      } else {
        parsedNudge = {
          message: `You are locking down a ${longestActiveStreak}-day streak on ${longestActiveHabitName} with a solid ${completionRate}% task rate. Consistency is what separates the contenders from the champions. Keep your foot on the gas!`,
          tone: "celebratory",
          related_quote_tag: "consistency"
        };
      }
    }

    // Find quote corresponding to related_quote_tag
    const matchingQuotes = quotes.filter(q => q.tags?.includes(parsedNudge.related_quote_tag));
    const pairedQuote = matchingQuotes.length > 0
      ? matchingQuotes[Math.floor(Math.random() * matchingQuotes.length)]
      : quotes[0];

    return res.json({
      nudge: parsedNudge,
      quote: pairedQuote,
      context_stats: {
        broken_habit: brokenHabitName,
        broken_streak: brokenHabitPrevStreak,
        completion_rate: completionRate,
        longest_streak: longestActiveStreak,
        longest_habit: longestActiveHabitName
      }
    });
  } catch (err) {
    console.error("Error generating motivational nudge:", err);
    return res.status(500).json({ error: "Failed to generate motivation" });
  }
});

export default router;
