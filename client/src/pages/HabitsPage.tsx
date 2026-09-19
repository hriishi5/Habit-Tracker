import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Repeat, Plus, Filter, Flame } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { Habit, HabitInput } from "../schemas/schemas";
import { HabitCard, HabitFormModal } from "../components/HabitComponents";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

export const HabitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => apiRequest<Habit[]>("/habits"),
  });

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
      success(`Checked in! Streak: ${res.streakInfo.current_streak} days 🔥`);
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
      success("Check-in undone");
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
      setModalOpen(false);
      setEditingHabit(null);
      success(editingHabit ? "Habit updated" : "New habit activated");
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

  const filteredHabits = habits.filter((h) => {
    if (categoryFilter === "all") return true;
    return h.category === categoryFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Habit Consistency Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily rituals, lock in streaks, and build unbreakable momentum.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {["all", "fitness", "mindfulness", "learning", "nutrition", "sleep", "productivity", "social", "other"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all shrink-0 ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Habits Grid */}
      {isLoading ? (
        <LoadingSkeleton rows={4} height="h-32" />
      ) : filteredHabits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={categoryFilter === "all" ? "No habits started yet" : "No habits in this category"}
          description="Consistent habits are the building blocks of elite performance. Create your first habit to start tracking streaks."
          actionLabel="Create First Habit"
          onAction={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onCheckIn={(h) => checkInMutation.mutate(h)}
              onUndoCheckIn={(h) => undoCheckInMutation.mutate(h)}
              onEdit={(h) => {
                setEditingHabit(h);
                setModalOpen(true);
              }}
              onDelete={(id) => deleteHabitMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <HabitFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
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
