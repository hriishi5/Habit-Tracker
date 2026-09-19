# MomentumOS — AI-Powered Habit Tracker & Productivity Assistant

> **"Discipline is choosing between what you want now and what you want most."**

MomentumOS is a unified To-Do List Manager + Habit Tracker web application built to help individuals cultivate elite consistency, organize daily execution, visualize progress on interactive heatmaps, and stay motivated using curated athlete wisdom and AI-driven coaching insights powered by Google Gemini.

---

## Key Features

1. **User Authentication & Isolation**
   - Secure email/password signup and login.
   - JWT session management with PostgreSQL Row Level Security (RLS) enforcement.
   - Strict multi-tenant data isolation — users only ever access their own data.

2. **To-Do List Management**
   - Create, edit, toggle, and delete daily tasks with priorities (`High`, `Medium`, `Low`) and categories (`Work`, `Study`, `Health`, `Personal`, `Finance`, `Chores`, `Other`).
   - Filter by status (`all`, `pending`, `completed`), priority, and category.
   - Sort by creation date, due date, or priority.

3. **Habit Consistency Engine & Streak Tracking**
   - Flexible frequency types: `daily`, `weekly_days` (e.g. Mon/Wed/Fri), and `times_per_week` (e.g. 3x/week).
   - One-tap daily check-in with celebratory confetti micro-interactions.
   - Deterministic streak calculation tracking `current_streak` and all-time `longest_streak`.
   - Automatic streak-break detection.

4. **Interactive Consistency Calendar**
   - Month view featuring a GitHub contribution-style 5-level intensity heatmap reflecting habit execution.
   - Click any day on the calendar to open a detailed drawer displaying all habits logged and to-dos due on that date.

5. **Performance Analytics & Progress Graphs**
   - Line/area chart showing task completion trends over 7, 30, or 90 days.
   - Per-habit streak history bar chart comparing current streaks against best streaks.
   - SVG Circular Discipline Gauge scoring overall habit consistency.

6. **Athlete Motivation Engine & Google Gemini AI**
   - **Quote of the Day**: Deterministic daily quote seeded by calendar date from legendary athletes (Kobe Bryant, Michael Jordan, Serena Williams, Muhammad Ali, Cristiano Ronaldo, Simone Biles, and more).
   - **Contextual AI Nudges (`POST /api/motivate`)**: When a streak drops or completion falls behind, Google Gemini generates a concise, personalized coach pep talk referencing actual statistics.
   - **AI Weekly Review (`POST /api/analytics/weekly-review`)**: Comprehensive coach retrospective synthesizing weekly task velocity and habit streaks with actionable suggestions (server-enforced 6-hour rate limit).

---

## Technology Stack

- **Frontend**: React (Vite, TypeScript), React Router v6, Tailwind CSS, TanStack Query, Recharts, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express.js REST API, CORS, Zod validation.
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth with RLS), featuring a built-in local persistence engine for instant zero-friction local development and testing.
- **AI Integration**: Google Gemini via `@google/genai` (server-side only, `gemini-3.8-flash` / `gemini-2.5-flash`).

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) and npm installed.

### 2. Environment Configuration
Copy `.env.example` to `server/.env` and `client/.env`:
```bash
# In server/.env
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
CORS_ORIGIN=http://localhost:5173

# In client/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Backend & Frontend
```bash
# Run backend
cd server
npm install
node server.js

# In a separate terminal, run frontend
cd client
npm install
npm run dev
```

Visit **http://localhost:5173** to launch MomentumOS.
