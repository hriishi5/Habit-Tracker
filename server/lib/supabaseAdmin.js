import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "momentum-os-super-secret-jwt-key-2026";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Real Supabase Admin Client
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    })
  : null;

// User-scoped Supabase client helper (RLS enforced)
export function getUserSupabaseClient(token) {
  if (!isSupabaseConfigured) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

// -------------------------------------------------------------
// Built-in Local Storage Engine (Full RLS & Isolation Fallback)
// -------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, "../data");
const DB_FILE = path.join(DATA_DIR, "db.json");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Ignored in read-only / serverless environments
}

const DEFAULT_QUOTES = [
  {
    id: "q-1",
    athlete_name: "Kobe Bryant",
    quote_text: "I have self-doubt. I have insecurity. I have fear of failure. I have nights when I show up at the arena and I'm like, \"My back hurts, my feet hurt, my knees hurt. I don't have it. I just want to chill.\" We all have self-doubt. You don't deny it, but you also don't capitulate to it. You embrace it.",
    tags: ["discipline", "consistency", "resilience", "hard_work"]
  },
  {
    id: "q-2",
    athlete_name: "Michael Jordan",
    quote_text: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. Twenty-six times, I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.",
    tags: ["resilience", "comebacks", "discipline"]
  },
  {
    id: "q-3",
    athlete_name: "Serena Williams",
    quote_text: "I really think a champion is defined not by their wins but by how they can recover when they fall.",
    tags: ["resilience", "comebacks", "focus"]
  },
  {
    id: "q-4",
    athlete_name: "Muhammad Ali",
    quote_text: "I hated every minute of training, but I said, \"Don't quit. Suffer now and live the rest of your life as a champion.\"",
    tags: ["discipline", "hard_work", "consistency"]
  },
  {
    id: "q-5",
    athlete_name: "Cristiano Ronaldo",
    quote_text: "Talent without working hard is nothing.",
    tags: ["hard_work", "discipline", "consistency"]
  },
  {
    id: "q-6",
    athlete_name: "Simone Biles",
    quote_text: "I'd rather regret the risks that didn't work out than the chances I didn't take at all.",
    tags: ["focus", "resilience"]
  },
  {
    id: "q-7",
    athlete_name: "Eliud Kipchoge",
    quote_text: "Only the disciplined ones in life are free. If you are undisciplined, you are a slave to your moods and your passions.",
    tags: ["discipline", "consistency"]
  },
  {
    id: "q-8",
    athlete_name: "LeBron James",
    quote_text: "Nothing is given. Everything is earned. You work for what you have.",
    tags: ["hard_work", "discipline"]
  },
  {
    id: "q-9",
    athlete_name: "Michael Phelps",
    quote_text: "If you want to be the best, you have to do things that other people aren't willing to do.",
    tags: ["hard_work", "focus", "consistency"]
  },
  {
    id: "q-10",
    athlete_name: "Usain Bolt",
    quote_text: "I trained 4 years to run 9 seconds, and people give up when they don't see results in 2 months.",
    tags: ["consistency", "discipline", "resilience"]
  },
  {
    id: "q-11",
    athlete_name: "Tom Brady",
    quote_text: "To me, what really matters is what you do when no one is watching.",
    tags: ["discipline", "consistency", "focus"]
  },
  {
    id: "q-12",
    athlete_name: "Megan Rapinoe",
    quote_text: "You have to stand up for what you believe in, even when your voice shakes and you stand alone.",
    tags: ["teamwork", "resilience", "focus"]
  }
];

function readLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      users: [],
      profiles: [],
      tasks: [],
      habits: [],
      habit_logs: [],
      weekly_reviews: [],
      quotes: DEFAULT_QUOTES
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(content);
    if (!data.quotes || data.quotes.length === 0) {
      data.quotes = DEFAULT_QUOTES;
      writeLocalDb(data);
    }
    return data;
  } catch (err) {
    console.error("Error reading local db file, resetting:", err);
    const initial = {
      users: [],
      profiles: [],
      tasks: [],
      habits: [],
      habit_logs: [],
      weekly_reviews: [],
      quotes: DEFAULT_QUOTES
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// -------------------------------------------------------------
// Unified Database Operations
// -------------------------------------------------------------

export const db = {
  // Auth & Profiles
  async signUp({ email, password, displayName }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName }
      });
      if (error) throw error;
      const user = data.user;
      await supabaseAdmin.from("profiles").upsert({
        id: user.id,
        display_name: displayName || email.split("@")[0]
      });

      // Generate session token
      const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });
      if (sessionErr) throw sessionErr;

      return {
        user: { id: user.id, email: user.email, display_name: displayName },
        access_token: sessionData.session.access_token
      };
    }

    // Local fallback
    const local = readLocalDb();
    const existing = local.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error("User already registered with this email");
      err.status = 400;
      throw err;
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const name = displayName || email.split("@")[0];
    const newUser = { id, email: email.toLowerCase(), passwordHash, created_at: new Date().toISOString() };
    const newProfile = { id, display_name: name, created_at: new Date().toISOString() };

    local.users.push(newUser);
    local.profiles.push(newProfile);
    writeLocalDb(local);

    const token = jwt.sign({ sub: id, email: newUser.email, display_name: name }, JWT_SECRET, { expiresIn: "7d" });
    return {
      user: { id, email: newUser.email, display_name: name },
      access_token: token
    };
  },

  async login({ email, password }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .single();
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: profile?.display_name || data.user.user_metadata?.display_name || email.split("@")[0]
        },
        access_token: data.session.access_token
      };
    }

    // Local fallback
    const local = readLocalDb();
    const user = local.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    const profile = local.profiles.find(p => p.id === user.id);
    const displayName = profile?.display_name || user.email.split("@")[0];
    const token = jwt.sign({ sub: user.id, email: user.email, display_name: displayName }, JWT_SECRET, { expiresIn: "7d" });

    return {
      user: { id: user.id, email: user.email, display_name: displayName },
      access_token: token
    };
  },

  async verifyToken(token) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();

      return {
        id: data.user.id,
        email: data.user.email,
        display_name: profile?.display_name || data.user.user_metadata?.display_name || data.user.email.split("@")[0]
      };
    }

    // Local fallback
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const local = readLocalDb();
      const user = local.users.find(u => u.id === decoded.sub);
      if (!user) return null;
      const profile = local.profiles.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name || decoded.display_name || user.email.split("@")[0]
      };
    } catch {
      return null;
    }
  },

  async updateProfile(userId, { display_name }) {
    if (isSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ display_name })
        .eq("id", userId);
      if (error) throw error;
      return { id: userId, display_name };
    }

    const local = readLocalDb();
    const idx = local.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      local.profiles[idx].display_name = display_name;
      writeLocalDb(local);
    }
    return { id: userId, display_name };
  },

  // Tasks (Owner restricted)
  async getTasks(userId, filters = {}, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      let query = client.from("tasks").select("*").eq("user_id", userId);
      if (filters.status === "completed") query = query.eq("is_completed", true);
      if (filters.status === "pending") query = query.eq("is_completed", false);
      if (filters.priority) query = query.eq("priority", filters.priority);
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.from) query = query.gte("due_date", filters.from);
      if (filters.to) query = query.lte("due_date", filters.to);

      if (filters.sortBy === "due_date") {
        query = query.order("due_date", { ascending: true, nullsFirst: false });
      } else if (filters.sortBy === "priority") {
        query = query.order("priority", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    const local = readLocalDb();
    let tasks = local.tasks.filter(t => t.user_id === userId);

    if (filters.status === "completed") tasks = tasks.filter(t => t.is_completed);
    if (filters.status === "pending") tasks = tasks.filter(t => !t.is_completed);
    if (filters.priority) tasks = tasks.filter(t => t.priority === filters.priority);
    if (filters.category) tasks = tasks.filter(t => t.category === filters.category);
    if (filters.from) tasks = tasks.filter(t => t.due_date && t.due_date >= filters.from);
    if (filters.to) tasks = tasks.filter(t => t.due_date && t.due_date <= filters.to);

    if (filters.sortBy === "due_date") {
      tasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    } else if (filters.sortBy === "priority") {
      const order = { high: 3, medium: 2, low: 1 };
      tasks.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
    } else {
      tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return tasks;
  },

  async createTask(userId, taskData, token = null) {
    const task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: taskData.title,
      description: taskData.description || null,
      due_date: taskData.due_date || null,
      priority: taskData.priority || "medium",
      category: taskData.category || "other",
      is_completed: Boolean(taskData.is_completed),
      completed_at: taskData.is_completed ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client.from("tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    local.tasks.push(task);
    writeLocalDb(local);
    return task;
  },

  async updateTask(userId, taskId, updates, token = null) {
    if (updates.is_completed !== undefined) {
      updates.completed_at = updates.is_completed ? new Date().toISOString() : null;
    }
    updates.updated_at = new Date().toISOString();

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const idx = local.tasks.findIndex(t => t.id === taskId && t.user_id === userId);
    if (idx === -1) {
      const err = new Error("Task not found");
      err.status = 404;
      throw err;
    }
    local.tasks[idx] = { ...local.tasks[idx], ...updates };
    writeLocalDb(local);
    return local.tasks[idx];
  },

  async deleteTask(userId, taskId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { error } = await client.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
      if (error) throw error;
      return true;
    }

    const local = readLocalDb();
    const initialLen = local.tasks.length;
    local.tasks = local.tasks.filter(t => !(t.id === taskId && t.user_id === userId));
    writeLocalDb(local);
    return local.tasks.length < initialLen;
  },

  // Habits (Owner restricted)
  async getHabits(userId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const local = readLocalDb();
    return local.habits
      .filter(h => h.user_id === userId && !h.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getHabitById(userId, habitId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habits")
        .select("*")
        .eq("id", habitId)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const habit = local.habits.find(h => h.id === habitId && h.user_id === userId);
    if (!habit) {
      const err = new Error("Habit not found");
      err.status = 404;
      throw err;
    }
    return habit;
  },

  async createHabit(userId, habitData, token = null) {
    const habit = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: habitData.name,
      category: habitData.category || "other",
      frequency_type: habitData.frequency_type,
      frequency_value: habitData.frequency_value ?? null,
      target_note: habitData.target_note || null,
      start_date: habitData.start_date || new Date().toISOString().slice(0, 10),
      current_streak: 0,
      longest_streak: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client.from("habits").insert(habit).select().single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    local.habits.push(habit);
    writeLocalDb(local);
    return habit;
  },

  async updateHabit(userId, habitId, updates, token = null) {
    updates.updated_at = new Date().toISOString();

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habits")
        .update(updates)
        .eq("id", habitId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const idx = local.habits.findIndex(h => h.id === habitId && h.user_id === userId);
    if (idx === -1) {
      const err = new Error("Habit not found");
      err.status = 404;
      throw err;
    }
    local.habits[idx] = { ...local.habits[idx], ...updates };
    writeLocalDb(local);
    return local.habits[idx];
  },

  async deleteHabit(userId, habitId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      // Soft-delete / archive
      const { error } = await client
        .from("habits")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", habitId)
        .eq("user_id", userId);
      if (error) throw error;
      return true;
    }

    const local = readLocalDb();
    const idx = local.habits.findIndex(h => h.id === habitId && h.user_id === userId);
    if (idx !== -1) {
      local.habits[idx].is_archived = true;
      local.habits[idx].updated_at = new Date().toISOString();
      writeLocalDb(local);
    }
    return true;
  },

  // Habit Logs
  async getHabitLogs(userId, habitId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .eq("user_id", userId)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const local = readLocalDb();
    return local.habit_logs
      .filter(l => l.habit_id === habitId && l.user_id === userId)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
  },

  async getAllHabitLogsForUser(userId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    }

    const local = readLocalDb();
    return local.habit_logs.filter(l => l.user_id === userId);
  },

  async addHabitLog(userId, habitId, logDate, token = null) {
    const log = {
      id: crypto.randomUUID(),
      habit_id: habitId,
      user_id: userId,
      log_date: logDate,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("habit_logs")
        .upsert(log, { onConflict: "habit_id,log_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const exists = local.habit_logs.find(l => l.habit_id === habitId && l.log_date === logDate);
    if (!exists) {
      local.habit_logs.push(log);
      writeLocalDb(local);
      return log;
    }
    return exists;
  },

  async removeHabitLog(userId, habitId, logDate, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { error } = await client
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitId)
        .eq("user_id", userId)
        .eq("log_date", logDate);
      if (error) throw error;
      return true;
    }

    const local = readLocalDb();
    local.habit_logs = local.habit_logs.filter(
      l => !(l.habit_id === habitId && l.user_id === userId && l.log_date === logDate)
    );
    writeLocalDb(local);
    return true;
  },

  // Quotes
  async getAllQuotes() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin.from("quotes").select("*");
      if (!error && data?.length) return data;
    }
    const local = readLocalDb();
    return local.quotes;
  },

  // Weekly Reviews
  async getWeeklyReviews(userId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const local = readLocalDb();
    return local.weekly_reviews
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
  },

  async getLatestWeeklyReview(userId, token = null) {
    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const reviews = local.weekly_reviews
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    return reviews[0] || null;
  },

  async createWeeklyReview(userId, reviewData, token = null) {
    const review = {
      id: crypto.randomUUID(),
      user_id: userId,
      summary: reviewData.summary,
      suggestions: reviewData.suggestions || [],
      stats_snapshot: reviewData.stats_snapshot,
      generated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && token) {
      const client = getUserSupabaseClient(token);
      const { data, error } = await client.from("weekly_reviews").insert(review).select().single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    local.weekly_reviews.push(review);
    writeLocalDb(local);
    return review;
  }
};
