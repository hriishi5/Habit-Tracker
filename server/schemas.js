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

export const taskUpdateSchema = taskSchema.partial();

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

export const habitUpdateSchema = habitSchema.partial();

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
