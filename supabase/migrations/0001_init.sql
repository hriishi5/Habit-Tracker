-- =========================================================
-- MomentumOS Database Schema & Row Level Security (RLS)
-- =========================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (mirrors auth.users, holds app-specific fields)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  category text not null default 'other' check (category in ('work','study','health','personal','finance','chores','other')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'other' check (category in ('fitness','mindfulness','learning','nutrition','sleep','productivity','social','other')),
  frequency_type text not null check (frequency_type in ('daily','weekly_days','times_per_week')),
  frequency_value jsonb,
  target_note text,
  start_date date not null default current_date,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habit check-in logs (one row per completed day per habit)
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- Motivational quotes bank
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  athlete_name text not null,
  quote_text text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- AI-generated weekly reviews (cached, rate-limited)
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  suggestions text[] not null default '{}',
  stats_snapshot jsonb not null,
  generated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, log_date);
create index if not exists idx_weekly_reviews_user_id on public.weekly_reviews(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.quotes enable row level security;

-- Profiles Policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Tasks Policies
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- Habits Policies
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- Habit Logs Policies
drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

-- Weekly Reviews Policies
drop policy if exists "weekly_reviews_select_own" on public.weekly_reviews;
create policy "weekly_reviews_select_own" on public.weekly_reviews for select using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_insert_own" on public.weekly_reviews;
create policy "weekly_reviews_insert_own" on public.weekly_reviews for insert with check (auth.uid() = user_id);

-- Quotes Policies (readable by all authenticated users)
drop policy if exists "quotes_select_all" on public.quotes;
create policy "quotes_select_all" on public.quotes for select using (auth.role() = 'authenticated');

-- Seed Quotes Bank
insert into public.quotes (athlete_name, quote_text, tags) values
('Kobe Bryant', 'I have self-doubt. I have insecurity. I have fear of failure. I have nights when I show up at the arena and I''m like, "My back hurts, my feet hurt, my knees hurt. I don''t have it. I just want to chill." We all have self-doubt. You don''t deny it, but you also don''t capitulate to it. You embrace it.', array['discipline', 'consistency', 'resilience', 'hard_work']),
('Michael Jordan', 'I''ve missed more than 9,000 shots in my career. I''ve lost almost 300 games. Twenty-six times, I''ve been trusted to take the game-winning shot and missed. I''ve failed over and over and over again in my life. And that is why I succeed.', array['resilience', 'comebacks', 'discipline']),
('Serena Williams', 'I really think a champion is defined not by their wins but by how they can recover when they fall.', array['resilience', 'comebacks', 'focus']),
('Muhammad Ali', 'I hated every minute of training, but I said, "Don''t quit. Suffer now and live the rest of your life as a champion."', array['discipline', 'hard_work', 'consistency']),
('Cristiano Ronaldo', 'Talent without working hard is nothing.', array['hard_work', 'discipline', 'consistency']),
('Simone Biles', 'I''d rather regret the risks that didn''t work out than the chances I didn''t take at all.', array['focus', 'resilience']),
('Eliud Kipchoge', 'Only the disciplined ones in life are free. If you are undisciplined, you are a slave to your moods and your passions.', array['discipline', 'consistency']),
('LeBron James', 'Nothing is given. Everything is earned. You work for what you have.', array['hard_work', 'discipline']),
('Michael Phelps', 'If you want to be the best, you have to do things that other people aren''t willing to do.', array['hard_work', 'focus', 'consistency']),
('Usain Bolt', 'I trained 4 years to run 9 seconds, and people give up when they don''t see results in 2 months.', array['consistency', 'discipline', 'resilience']),
('Tom Brady', 'To me, what really matters is what you do when no one is watching.', array['discipline', 'consistency', 'focus']),
('Megan Rapinoe', 'You have to stand up for what you believe in, even when your voice shakes and you stand alone.', array['teamwork', 'resilience', 'focus'])
on conflict do nothing;
