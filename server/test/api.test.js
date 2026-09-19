import assert from "node:assert";
import { createApp } from "../app.js";

async function runTests() {
  console.log("Starting MomentumOS Backend API test suite...");
  const app = createApp();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, "ok");
    console.log("✓ Health check passed");

    // 2. User 1 Signup
    const signup1Res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "athlete1@momentum.os",
        password: "password123",
        display_name: "Kobe Fan"
      })
    });
    assert.strictEqual(signup1Res.status, 201);
    const auth1 = await signup1Res.json();
    assert.ok(auth1.access_token, "Auth response must have access_token");
    assert.strictEqual(auth1.user.display_name, "Kobe Fan");
    const token1 = auth1.access_token;
    console.log("✓ User 1 signup passed");

    // 3. User 2 Signup (for data isolation testing)
    const signup2Res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "athlete2@momentum.os",
        password: "password456",
        display_name: "Jordan Fan"
      })
    });
    assert.strictEqual(signup2Res.status, 201);
    const auth2 = await signup2Res.json();
    const token2 = auth2.access_token;
    console.log("✓ User 2 signup passed");

    // 4. Tasks CRUD & Validation
    // Create task for User 1
    const createTaskRes = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: "Morning 5 Mile Run",
        description: "Focus on pace and breathing",
        priority: "high",
        category: "health",
        due_date: "2026-09-18"
      })
    });
    assert.strictEqual(createTaskRes.status, 201);
    const task1 = await createTaskRes.json();
    assert.strictEqual(task1.title, "Morning 5 Mile Run");
    assert.strictEqual(task1.is_completed, false);
    console.log("✓ Task creation passed");

    // User 2 cannot see User 1's tasks (Data isolation)
    const user2TasksRes = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const user2Tasks = await user2TasksRes.json();
    assert.strictEqual(user2Tasks.length, 0, "User 2 must not see User 1 tasks");
    console.log("✓ Data isolation (tasks) verified");

    // Toggle complete
    const patchTaskRes = await fetch(`${baseUrl}/tasks/${task1.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ is_completed: true })
    });
    assert.strictEqual(patchTaskRes.status, 200);
    const updatedTask = await patchTaskRes.json();
    assert.strictEqual(updatedTask.is_completed, true);
    assert.ok(updatedTask.completed_at);
    console.log("✓ Task update & completion toggle passed");

    // 5. Habits & Streak Tracking
    const createHabitRes = await fetch(`${baseUrl}/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        name: "Read 20 pages",
        category: "learning",
        frequency_type: "daily",
        target_note: "20 pages"
      })
    });
    assert.strictEqual(createHabitRes.status, 201);
    const habit1 = await createHabitRes.json();
    assert.strictEqual(habit1.name, "Read 20 pages");
    assert.strictEqual(habit1.current_streak, 0);
    console.log("✓ Habit creation passed");

    // Check-in habit for today
    const checkinRes = await fetch(`${baseUrl}/habits/${habit1.id}/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ log_date: "2026-09-18" })
    });
    assert.strictEqual(checkinRes.status, 200);
    const checkinData = await checkinRes.json();
    assert.strictEqual(checkinData.streakInfo.current_streak, 1);
    assert.strictEqual(checkinData.habit.is_completed_today, true);
    console.log("✓ Habit check-in and streak increment passed");

    // User 2 cannot see User 1's habit
    const user2HabitsRes = await fetch(`${baseUrl}/habits`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const user2Habits = await user2HabitsRes.json();
    assert.strictEqual(user2Habits.length, 0, "User 2 must not see User 1 habits");
    console.log("✓ Data isolation (habits) verified");

    // 6. Calendar Heatmap
    const calRes = await fetch(`${baseUrl}/calendar?month=2026-09`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(calRes.status, 200);
    const calData = await calRes.json();
    assert.strictEqual(calData.month, "2026-09");
    const day18 = calData.days.find(d => d.date === "2026-09-18");
    assert.ok(day18);
    assert.ok(day18.intensity > 0, "Intensity should reflect habit completion");
    console.log("✓ Calendar heatmap data verified");

    // 7. Deterministic Quote of the Day
    const quoteRes1 = await fetch(`${baseUrl}/quotes/daily?date=2026-09-18`);
    const quoteRes2 = await fetch(`${baseUrl}/quotes/daily?date=2026-09-18`);
    assert.strictEqual(quoteRes1.status, 200);
    const q1 = await quoteRes1.json();
    const q2 = await quoteRes2.json();
    assert.strictEqual(q1.quote.athlete_name, q2.quote.athlete_name, "Same day must yield identical quote");
    assert.ok(q1.quote.quote_text);
    console.log("✓ Deterministic Quote of the Day verified");

    // 8. AI Motivate Contextual Nudge
    const motivateRes = await fetch(`${baseUrl}/motivate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(motivateRes.status, 200);
    const motivateData = await motivateRes.json();
    assert.ok(motivateData.nudge.message, "Nudge message must be present");
    assert.ok(["encouraging", "firm", "celebratory"].includes(motivateData.nudge.tone));
    assert.ok(motivateData.quote, "Paired athlete quote must be present");
    console.log("✓ AI Contextual Motivation Nudge verified");

    // 9. Analytics Summary
    const analyticsRes = await fetch(`${baseUrl}/analytics/summary?range=30`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(analyticsRes.status, 200);
    const analyticsData = await analyticsRes.json();
    assert.ok(analyticsData.stats);
    assert.strictEqual(analyticsData.daily_series.length, 30);
    console.log("✓ Analytics 30-day summary verified");

    // 10. AI Weekly Review
    const reviewRes = await fetch(`${baseUrl}/analytics/weekly-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      }
    });
    assert.strictEqual(reviewRes.status, 201);
    const reviewData = await reviewRes.json();
    assert.ok(reviewData.summary);
    assert.ok(Array.isArray(reviewData.suggestions) && reviewData.suggestions.length > 0);
    console.log("✓ AI Weekly Review generation & persistence verified");

    // Rate limit test on weekly review (2nd immediate request within 6 hours must return 429)
    const rateLimitRes = await fetch(`${baseUrl}/analytics/weekly-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      }
    });
    assert.strictEqual(rateLimitRes.status, 429, "Immediate subsequent review request must be rate limited");
    console.log("✓ AI Weekly Review 6-hour rate limit enforced");

    console.log("\n==========================================");
    console.log("ALL BACKEND API TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================\n");
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error("API Tests failed:", err);
  process.exit(1);
});
