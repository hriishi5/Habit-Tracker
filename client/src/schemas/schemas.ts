import { z } from "zod";

export const taskCategoryEnum = z.enum([
  "work",
  "study",
  "health",
  "personal",
  "finance",
  "chores",
  "other"
]);

export const habitCategoryEnum = z.enum([
  "fitness",
  "mindfulness",
  "learning",
  "nutrition",
  "sleep",
  "productivity",
  "social",
  "other"
]);

export const quoteTagEnum = z.enum([
  "discipline",
  "consistency",
  "resilience",
  "comebacks",
  "teamwork",
  "focus",
  "hard_work"
]);

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be at most 120 characters"),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: taskCategoryEnum.default("other"),
  is_completed: z.boolean().optional(),
});

export const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  category: habitCategoryEnum.default("other"),
  frequency_type: z.enum(["daily", "weekly_days", "times_per_week"]),
  frequency_value: z.union([
    z.array(z.number().int().min(0).max(6)),
    z.number().int().min(1).max(7)
  ]).nullable().optional(),
  target_note: z.string().max(120, "Target note must be at most 120 characters").optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").default(() => new Date().toISOString().slice(0, 10)),
});

export const checkinSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

export const aiNudgeResponseSchema = z.object({
  message: z.string().max(400),
  tone: z.enum(["encouraging", "firm", "celebratory"]),
  related_quote_tag: quoteTagEnum,
});

export const aiWeeklyReviewResponseSchema = z.object({
  summary: z.string().max(800),
  suggestions: z.array(z.string().max(200)).min(1).max(3),
  highlight_habit: z.string().max(80),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().min(1, "Display name cannot be empty").max(50, "Display name must be at most 50 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type AiNudgeResponse = z.infer<typeof aiNudgeResponseSchema>;
export type AiWeeklyReviewResponse = z.infer<typeof aiWeeklyReviewResponseSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  category: "work" | "study" | "health" | "personal" | "finance" | "chores" | "other";
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: "fitness" | "mindfulness" | "learning" | "nutrition" | "sleep" | "productivity" | "social" | "other";
  frequency_type: "daily" | "weekly_days" | "times_per_week";
  frequency_value: number[] | number | null;
  target_note: string | null;
  start_date: string;
  current_streak: number;
  longest_streak: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  is_completed_today?: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  created_at: string;
}

export interface Quote {
  id: string;
  athlete_name: string;
  quote_text: string;
  tags: string[];
  created_at?: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  summary: string;
  suggestions: string[];
  highlight_habit?: string;
  stats_snapshot: {
    tasks_completed: number;
    tasks_total: number;
    habit_count: number;
    consistency_pct: number;
    best_habit_name: string;
    best_habit_streak: number;
    worst_habit_name: string;
    worst_habit_completions: number;
  };
  generated_at: string;
}
