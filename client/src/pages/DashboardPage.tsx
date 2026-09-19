import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Repeat,
  Plus,
  Flame,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/apiClient";
import { Task, Habit, Quote, TaskInput, HabitInput } from "../schemas/schemas";
import { TaskItem, TaskFormModal } from "../components/TaskComponents";
import { HabitCard, HabitFormModal } from "../components/HabitComponents";
import { QuoteOfTheDayCard, ConsistencyScoreRing } from "../components/AnalyticsComponents";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { success, error, nudge } = useToast();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiRequest<Task[]>("/tasks"),
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => apiRequest<Habit[]>("/habits"),
  });

  const { data: dailyQuoteData } = useQuery<{ quote: Quote }>({
    queryKey: ["quote-daily"],
    queryFn: () => apiRequest<{ quote: Quote }>("/quotes/daily"),
  });

  // Task Mutations
  const toggleTaskMutation = useMutation({
    mutationFn: (task: Task) =>
      apiRequest<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: !task.is_completed }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      if (updated.is_completed) {
        success(`Task marked complete: "${updated.title}"`);
      }
    },
    onError: (err: any) => error(err.message || "Failed to update task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest(`/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      success("Task deleted");
    },
    onError: (err: any) => error(err.message || "Failed to delete task"),
  });

  const saveTaskMutation = useMutation({
    mutationFn: (data: TaskInput) => {
      if (editingTask) {
        return apiRequest<Task>(`/tasks/${editingTask.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      return apiRequest<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskModalOpen(false);
      setEditingTask(null);
      success(editingTask ? "Task updated" : "Task created");
    },
    onError: (err: any) => error(err.message || "Failed to save task"),
  });

  // Habit Mutations
  const checkInMutation = useMutation({
    mutationFn: (habit: Habit) =>
      apiRequest<{ habit: Habit; streakInfo: any }>(`/habits/${habit.id}/checkin`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      success(`Checked in! Current streak: ${res.streakInfo.current_streak} days 🔥`);
    },
    onError: (err: any) => error(err.message || "Failed to check in"),
  });

  const undoCheckInMutation = useMutation({
    mutationFn: (habit: Habit) =>
      apiRequest<{ habit: Habit; streakInfo: any }>(`/habits/${habit.id}/checkin`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      success("Check-in removed");
    },
    onError: (err: any) => error(err.message || "Failed to undo check-in"),
  });

  const saveHabitMutation = useMutation({
    mutationFn: (data: HabitInput) => {
      if (editingHabit) {
        return apiRequest<Habit>(`/habits/${editingHabit.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      return apiRequest<Habit>("/habits", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setHabitModalOpen(false);
      setEditingHabit(null);
      success(editingHabit ? "Habit updated" : "New habit started");
    },
    onError: (err: any) => error(err.message || "Failed to save habit"),
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) =>
      apiRequest(`/habits/${habitId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      success("Habit archived");
    },
    onError: (err: any) => error(err.message || "Failed to archive habit"),
  });

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysTasks = tasks.filter((t) => !t.due_date || t.due_date === todayStr);
  const completedTodayTasks = todaysTasks.filter((t) => t.is_completed).length;

  const habitsDoneToday = habits.filter((h) => h.is_completed_today).length;
  const habitsTotal = habits.length;

  const longestOverallStreak = habits.reduce(
    (max, h) => Math.max(max, h.current_streak),
    0
  );

  const consistencyRate =
    habitsTotal > 0 ? Math.round((habitsDoneToday / habitsTotal) * 100) : 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Welcome back, <span className="gradient-text-blue">{user?.display_name || "Athlete"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build discipline. Show up daily. Protect the streak.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>New Task</span>
          </button>

          <button
            onClick={() => {
              setEditingHabit(null);
              setHabitModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Tasks</span>
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 tabular-nums">
            {completedTodayTasks} <span className="text-sm font-medium text-slate-500">/ {todaysTasks.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {todaysTasks.length === 0 ? "No tasks for today" : `${Math.round((completedTodayTasks / (todaysTasks.length || 1)) * 100)}% completed`}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Habits Done</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 tabular-nums">
            {habitsDoneToday} <span className="text-sm font-medium text-slate-500">/ {habitsTotal}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {habitsTotal === 0 ? "Add your first habit" : `${consistencyRate}% logged today`}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
            {longestOverallStreak} <span className="text-sm font-medium text-slate-500">days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consistency creates champions</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Discipline Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 tabular-nums">
            {consistencyRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Today's habit completion</p>
        </div>
      </div>

      {/* Quote of the Day Card */}
      {dailyQuoteData?.quote && (
        <QuoteOfTheDayCard quote={dailyQuoteData.quote} />
      )}

      {/* Main Grid: Habit Tracker & Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Habits Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">Daily Habit Check-In</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {habits.length}
              </span>
            </div>
            <Link
              to="/habits"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {habitsLoading ? (
            <LoadingSkeleton rows={3} height="h-28" />
          ) : habits.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No habits tracked yet"
              description="Start small. Choose one high-impact habit to build your daily momentum."
              actionLabel="Create First Habit"
              onAction={() => setHabitModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onCheckIn={(h) => checkInMutation.mutate(h)}
                  onUndoCheckIn={(h) => undoCheckInMutation.mutate(h)}
                  onEdit={(h) => {
                    setEditingHabit(h);
                    setHabitModalOpen(true);
                  }}
                  onDelete={(id) => deleteHabitMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Today's Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">Today's To-Dos</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {todaysTasks.length}
              </span>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {tasksLoading ? (
            <LoadingSkeleton rows={3} height="h-16" />
          ) : todaysTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="All caught up for today"
              description="No tasks due today. Plan ahead or take on your top high-priority goal."
              actionLabel="Add a Task"
              onAction={() => setTaskModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {todaysTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={(t) => toggleTaskMutation.mutate(t)}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setTaskModalOpen(true);
                  }}
                  onDelete={(id) => deleteTaskMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (data) => {
          await saveTaskMutation.mutateAsync(data);
        }}
        initialTask={editingTask}
      />

      <HabitFormModal
        isOpen={habitModalOpen}
        onClose={() => {
          setHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={async (data) => {
          await saveHabitMutation.mutateAsync(data);
        }}
        initialHabit={editingHabit}
      />
    </div>
  );
};
