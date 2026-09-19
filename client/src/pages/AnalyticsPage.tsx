import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Flame,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { WeeklyReview } from "../schemas/schemas";
import {
  ProgressChart,
  StreakChart,
  ConsistencyScoreRing,
  WeeklyReviewCard
} from "../components/AnalyticsComponents";
import { LoadingSkeleton } from "../components/EmptyState";

export const AnalyticsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [range, setRange] = useState<number>(30); // 7, 30, 90

  // Fetch summary data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{
    range_days: number;
    stats: {
      task_completion_rate: number;
      overall_consistency: number;
      tasks_completed: number;
      tasks_total: number;
      active_habits_count: number;
    };
    daily_series: any[];
    habit_streaks: any[];
  }>({
    queryKey: ["analytics", range],
    queryFn: () => apiRequest(`/analytics/summary?range=${range}`),
  });

  // Fetch latest weekly review
  const { data: latestReview, isLoading: reviewLoading } = useQuery<WeeklyReview | null>({
    queryKey: ["weekly-review-latest"],
    queryFn: () => apiRequest<WeeklyReview | null>("/analytics/weekly-review/latest"),
  });

  // Generate Weekly Review Mutation
  const generateReviewMutation = useMutation({
    mutationFn: () =>
      apiRequest<WeeklyReview>("/analytics/weekly-review", { method: "POST" }),
    onSuccess: (newReview) => {
      queryClient.setQueryData(["weekly-review-latest"], newReview);
      success("Coach Momentum weekly review generated!");
    },
    onError: (err: any) => {
      error(err.message || "Failed to generate weekly review");
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Performance Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track completion velocity, review streak longevity, and unlock AI coach insights.
          </p>
        </div>

        {/* Range Pill Selector */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Task Completion Rate
            </span>
            <div className="text-3xl font-black text-slate-100 mt-1 tabular-nums">
              {analyticsData?.stats.task_completion_rate ?? 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {analyticsData?.stats.tasks_completed ?? 0} of {analyticsData?.stats.tasks_total ?? 0} tasks done
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Consistency
            </span>
            <div className="text-3xl font-black text-emerald-400 mt-1 tabular-nums">
              {analyticsData?.stats.overall_consistency ?? 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Habits executed vs scheduled
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Flame className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Habits Tracked
            </span>
            <div className="text-3xl font-black text-amber-400 mt-1 tabular-nums">
              {analyticsData?.stats.active_habits_count ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across all categories
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Progress Line/Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-base text-slate-100">
                Completion Trend ({range} Days)
              </h3>
            </div>
          </div>
          {analyticsLoading ? (
            <LoadingSkeleton rows={3} height="h-20" />
          ) : (
            <ProgressChart data={analyticsData?.daily_series || []} />
          )}
        </div>

        {/* Right 1 Col: Consistency Score Gauge */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 flex flex-col items-center justify-center">
          <h3 className="font-bold text-sm text-slate-200 mb-2">Discipline Score</h3>
          <ConsistencyScoreRing score={analyticsData?.stats.overall_consistency ?? 0} />
          <p className="text-[11px] text-slate-400 text-center max-w-xs mt-2">
            Higher consistency unlocks elite streak badges and stabilizes daily focus.
          </p>
        </div>
      </div>

      {/* Streak History Bar Chart */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-base text-slate-100">
            Per-Habit Streak Performance (Current vs Longest)
          </h3>
        </div>
        {analyticsLoading ? (
          <LoadingSkeleton rows={3} height="h-20" />
        ) : (
          <StreakChart data={analyticsData?.habit_streaks || []} />
        )}
      </div>

      {/* AI Weekly Review Section */}
      <WeeklyReviewCard
        review={latestReview || null}
        onGenerate={async () => {
          await generateReviewMutation.mutateAsync();
        }}
        isGenerating={generateReviewMutation.isPending}
      />
    </div>
  );
};
