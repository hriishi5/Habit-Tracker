/**
 * Streak Calculation Engine for MomentumOS
 * Handles daily, specific weekday (weekly_days), and times_per_week habits.
 */

export function toDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDays(dateStr, numDays) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + numDays);
  return toDateString(d);
}

export function getDayOfWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

/**
 * Calculates current and longest streaks for a daily habit.
 */
export function calculateDailyStreak(logDates, referenceDate = toDateString(), existingLongest = 0) {
  const dateSet = new Set(logDates);
  const today = referenceDate;
  const yesterday = shiftDays(today, -1);

  const isTodayCompleted = dateSet.has(today);
  const isYesterdayCompleted = dateSet.has(yesterday);

  let currentStreak = 0;

  if (isTodayCompleted) {
    let curr = today;
    while (dateSet.has(curr)) {
      currentStreak++;
      curr = shiftDays(curr, -1);
    }
  } else if (isYesterdayCompleted) {
    // Today isn't over yet; streak is still alive from yesterday
    let curr = yesterday;
    while (dateSet.has(curr)) {
      currentStreak++;
      curr = shiftDays(curr, -1);
    }
  } else {
    currentStreak = 0;
  }

  // Calculate historical longest streak
  const sortedDates = Array.from(dateSet).sort();
  let maxHistoricalStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expected = shiftDays(prevDate, 1);
      if (d === expected) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxHistoricalStreak) {
      maxHistoricalStreak = tempStreak;
    }
    prevDate = d;
  }

  const longestStreak = Math.max(existingLongest, maxHistoricalStreak, currentStreak);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    is_completed_today: isTodayCompleted
  };
}

/**
 * Calculates streaks for habits scheduled on specific days of the week.
 * scheduledDays: array of numbers [0..6]
 */
export function calculateWeeklyDaysStreak(logDates, scheduledDays, referenceDate = toDateString(), existingLongest = 0) {
  if (!Array.isArray(scheduledDays) || scheduledDays.length === 0) {
    return calculateDailyStreak(logDates, referenceDate, existingLongest);
  }

  const dateSet = new Set(logDates);
  const scheduledSet = new Set(scheduledDays);
  const today = referenceDate;
  const isTodayCompleted = dateSet.has(today);

  let currentStreak = 0;
  let checkDate = today;

  // If today is a scheduled day but not completed yet, start from previous scheduled day
  const isTodayScheduled = scheduledSet.has(getDayOfWeek(today));
  if (isTodayScheduled && !isTodayCompleted) {
    checkDate = shiftDays(today, -1);
  }

  while (true) {
    const dow = getDayOfWeek(checkDate);
    if (scheduledSet.has(dow)) {
      if (dateSet.has(checkDate)) {
        currentStreak++;
        checkDate = shiftDays(checkDate, -1);
      } else {
        // Missed a scheduled day! Streak broken.
        break;
      }
    } else {
      // Not a scheduled day; skip backward
      checkDate = shiftDays(checkDate, -1);
    }

    // Safety cutoff (e.g. 10 years max)
    if (currentStreak > 3650) break;
  }

  const longestStreak = Math.max(existingLongest, currentStreak);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    is_completed_today: isTodayCompleted
  };
}

/**
 * Calculates streaks for habits that require X completions per calendar week.
 */
export function calculateTimesPerWeekStreak(logDates, targetTimes, referenceDate = toDateString(), existingLongest = 0) {
  const target = Number(targetTimes) || 1;
  const dateSet = new Set(logDates);
  const today = referenceDate;
  const isTodayCompleted = dateSet.has(today);

  // Group logs into week keys (e.g. by Monday of that week)
  function getWeekStart(dStr) {
    const [y, m, d] = dStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    return toDateString(monday);
  }

  const weekCounts = new Map();
  for (const d of dateSet) {
    const wKey = getWeekStart(d);
    weekCounts.set(wKey, (weekCounts.get(wKey) || 0) + 1);
  }

  const currentWeekKey = getWeekStart(today);
  const currentWeekCount = weekCounts.get(currentWeekKey) || 0;

  let currentStreak = 0;
  let checkWeekKey = currentWeekKey;

  // If current week has reached target, count it
  if (currentWeekCount >= target) {
    currentStreak++;
    checkWeekKey = shiftDays(currentWeekKey, -7);
  } else {
    // Check if previous week met target
    checkWeekKey = shiftDays(currentWeekKey, -7);
  }

  while (true) {
    const count = weekCounts.get(checkWeekKey) || 0;
    if (count >= target) {
      currentStreak++;
      checkWeekKey = shiftDays(checkWeekKey, -7);
    } else {
      break;
    }
    if (currentStreak > 520) break;
  }

  const longestStreak = Math.max(existingLongest, currentStreak);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    is_completed_today: isTodayCompleted
  };
}

/**
 * Main dispatcher for habit streak calculation.
 */
export function calculateHabitStreak(habit, logDates = [], referenceDate = toDateString()) {
  const cleanDates = logDates.map(l => (typeof l === 'string' ? l : l.log_date)).filter(Boolean);
  let result;

  switch (habit.frequency_type) {
    case 'weekly_days':
      result = calculateWeeklyDaysStreak(cleanDates, habit.frequency_value, referenceDate, habit.longest_streak || 0);
      break;
    case 'times_per_week':
      result = calculateTimesPerWeekStreak(cleanDates, habit.frequency_value, referenceDate, habit.longest_streak || 0);
      break;
    case 'daily':
    default:
      result = calculateDailyStreak(cleanDates, referenceDate, habit.longest_streak || 0);
      break;
  }

  const previousStreak = habit.current_streak || 0;
  const streakBroken = previousStreak >= 3 && result.current_streak === 0;

  return {
    ...result,
    streak_broken: streakBroken,
    previous_streak: previousStreak
  };
}
