import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Flame,
  Check,
  Calendar as CalendarIcon,
  Target,
  Repeat,
  Trophy,
  History,
  Archive
} from "lucide-react";
import confetti from "canvas-confetti";
import { apiRequest } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { Habit, HabitLog } from "../schemas/schemas";
import { StreakBadge } from "../components/StreakBadge";
import { habitCategoryColors } from "../components/HabitComponents";
import { LoadingSkeleton } from "../components/EmptyState";

export const HabitDetailPage: React.FC = () => {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = useQuery<{
    habit: Habit;
    logs: HabitLog[];
    streakInfo: { current_streak: number; longest_streak: number; is_completed_today: boolean };
  }>({
    queryKey: ["habit", habitId],
    queryFn: () => apiRequest(`/habits/${habitId}`),
    enabled: Boolean(habitId),
  });

  const checkInMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ habit: Habit; streakInfo: any }>(`/habits/${habitId}/checkin`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      success(`Checked in! Streak: ${res.streakInfo.current_streak} days 🔥`);
    },
    onError: (err: any) => error(err.message || "Check-in failed"),
  });

  const undoMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ habit: Habit }>(`/habits/${habitId}/checkin`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      success("Check-in undone");
    },
    onError: (err: any) => error(err.message || "Failed to undo check-in"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiRequest(`/habits/${habitId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      success("Habit archived");
      navigate("/habits");
    },
    onError: (err: any) => error(err.message || "Failed to archive habit"),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingSkeleton rows={4} height="h-32" />
      </div>
    );
  }

  if (!data?.habit) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-slate-100">Habit not found</h3>
        <Link to="/habits" className="text-sm text-blue-400 hover:underline mt-2 inline-block">
          Return to Habits
        </Link>
      </div>
    );
  }

  const { habit, logs = [] } = data;
  const catClass = habitCategoryColors[habit.category] || habitCategoryColors.other;

  // Build 30-day streak mini heatmap
  const today = new Date();
  const past30Days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    past30Days.push(d.toISOString().slice(0, 10));
  }

  const logDatesSet = new Set(logs.map((l) => l.log_date));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Back button */}
      <Link
        to="/habits"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Habits</span>
      </Link>

      {/* Main Habit Header Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${catClass}`}>
                {habit.category}
              </span>
              <span className="text-xs text-slate-500 font-medium capitalize">
                Started {habit.start_date}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">{habit.name}</h2>
            {habit.target_note && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Target: {habit.target_note}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                habit.is_completed_today
                  ? undoMutation.mutate()
                  : checkInMutation.mutate()
              }
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
                habit.is_completed_today
                  ? "bg-emerald-500 text-white shadow-emerald-500/25 border border-emerald-400"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25"
              }`}
            >
              {habit.is_completed_today ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Completed Today</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Check In Today</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (confirm("Archive this habit?")) {
                  archiveMutation.mutate();
                }
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
              title="Archive Habit"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Current Streak
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-400 tabular-nums">
              {habit.current_streak} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Longest Streak
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
              {habit.longest_streak} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" /> Total Check-ins
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 tabular-nums">
              {logs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Trailing 30-Day Activity Strip */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Trailing 30 Days Activity</h3>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 sm:gap-2">
          {past30Days.map((dateStr) => {
            const isCompleted = logDatesSet.has(dateStr);
            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-[10px] font-semibold transition-all relative group select-none ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/25"
                    : "bg-slate-800/60 border-slate-700/50 text-slate-500"
                }`}
              >
                <span>{dateStr.slice(8)}</span>
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[9px] text-slate-200 whitespace-nowrap shadow-xl z-20 transition-opacity">
                  {dateStr}: {isCompleted ? "Completed" : "Missed"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Log Table */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-200">Check-In History Logs</h3>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No historical check-ins logged yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 text-xs text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{log.log_date}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
