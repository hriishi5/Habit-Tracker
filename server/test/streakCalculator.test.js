import assert from 'node:assert';
import { calculateHabitStreak, calculateDailyStreak } from '../utils/streakCalculator.js';

console.log('Running streak calculator unit tests...');

// Test 1: Daily habit with consecutive checkins including today
{
  const logs = ['2026-09-18', '2026-09-17', '2026-09-16'];
  const res = calculateDailyStreak(logs, '2026-09-18');
  assert.strictEqual(res.current_streak, 3, 'Consecutive streak should be 3');
  assert.strictEqual(res.longest_streak, 3, 'Longest streak should be 3');
  assert.strictEqual(res.is_completed_today, true, 'Should be completed today');
}

// Test 2: Yesterday completed, today not completed yet (streak should still be alive)
{
  const logs = ['2026-09-17', '2026-09-16', '2026-09-15'];
  const res = calculateDailyStreak(logs, '2026-09-18');
  assert.strictEqual(res.current_streak, 3, 'Streak should still be alive from yesterday');
  assert.strictEqual(res.is_completed_today, false, 'Should not be completed today');
}

// Test 3: Missed yesterday and today -> streak drops to 0, preserves longest
{
  const logs = ['2026-09-16', '2026-09-15', '2026-09-14', '2026-09-13'];
  const res = calculateDailyStreak(logs, '2026-09-18', 4);
  assert.strictEqual(res.current_streak, 0, 'Current streak should reset to 0');
  assert.strictEqual(res.longest_streak, 4, 'Longest streak should be preserved at 4');
  assert.strictEqual(res.is_completed_today, false);
}

// Test 4: Streak break detection via calculateHabitStreak
{
  const habit = {
    frequency_type: 'daily',
    current_streak: 5,
    longest_streak: 5
  };
  const logs = ['2026-09-15', '2026-09-14']; // broke on 16 and 17
  const res = calculateHabitStreak(habit, logs, '2026-09-18');
  assert.strictEqual(res.current_streak, 0);
  assert.strictEqual(res.streak_broken, true, 'Streak break should be detected when dropping from 5 to 0');
}

// Test 5: Specific weekdays (e.g. Mon=1, Wed=3, Fri=5)
{
  const habit = {
    frequency_type: 'weekly_days',
    frequency_value: [1, 3, 5], // Mon, Wed, Fri
    current_streak: 0,
    longest_streak: 0
  };
  // 2026-09-18 is Friday (5)
  // 2026-09-16 is Wednesday (3)
  // 2026-09-14 is Monday (1)
  const logs = ['2026-09-18', '2026-09-16', '2026-09-14'];
  const res = calculateHabitStreak(habit, logs, '2026-09-18');
  assert.strictEqual(res.current_streak, 3);
  assert.strictEqual(res.longest_streak, 3);
}

console.log('✓ All streak calculator unit tests passed successfully!');
