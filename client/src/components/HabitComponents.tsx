import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import {
  Flame,
  Check,
  Repeat,
  Target,
  MoreVertical,
  Pencil,
  Archive,
  X,
  Plus,
  ChevronRight,
  Calendar
} from "lucide-react";
import { habitSchema, HabitInput, Habit } from "../schemas/schemas";
import { StreakBadge } from "./StreakBadge";

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export const habitCategoryColors: Record<string, string> = {
  fitness: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  mindfulness: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  learning: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  nutrition: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  sleep: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  productivity: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  social: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

interface HabitCardProps {
  habit: Habit;
  onCheckIn: (habit: Habit) => void;
  onUndoCheckIn: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onCheckIn,
  onUndoCheckIn,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const catClass = habitCategoryColors[habit.category] || habitCategoryColors.other;

  const handleCheckInToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (habit.is_completed_today) {
      onUndoCheckIn(habit);
    } else {
      // Confetti burst!
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#FF5722']
      });
      onCheckIn(habit);
    }
  };

  const getFrequencyLabel = () => {
    if (habit.frequency_type === "daily") return "Daily";
    if (habit.frequency_type === "weekly_days" && Array.isArray(habit.frequency_value)) {
      return habit.frequency_value.map((d: number) => DAYS_OF_WEEK[d]?.label).join(", ");
    }
    if (habit.frequency_type === "times_per_week") {
      return `${habit.frequency_value}x / week`;
    }
    return "Custom";
  };

  return (
    <div className="group relative rounded-2xl glass-card border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 p-5 transition-all glass-card-hover flex flex-col justify-between">
      <div>
        {/* Top bar: Category + Menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${catClass}`}>
            {habit.category}
          </span>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 top-6 z-20 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 text-xs space-y-0.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(habit.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-rose-400" />
                    <span>Archive</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Target */}
        <Link to={`/habits/${habit.id}`} className="block group-hover:text-blue-400 transition-colors">
          <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors leading-snug">
            {habit.name}
          </h3>
        </Link>

        {habit.target_note && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <Target className="w-3.5 h-3.5 text-slate-500" />
            <span>{habit.target_note}</span>
          </div>
        )}

        {/* Frequency & Streak Summary */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <Repeat className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-[11px] text-slate-400 truncate">{getFrequencyLabel()}</span>
        </div>
      </div>

      {/* Footer: Streak Badge & Check-in Button */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800/80 mt-4">
        <div className="flex items-center gap-2">
          <StreakBadge streak={habit.current_streak} size="md" />
          <span className="text-[10px] text-slate-500">Best: {habit.longest_streak}d</span>
        </div>

        <button
          onClick={handleCheckInToggle}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md ${
            habit.is_completed_today
              ? "bg-emerald-500 text-white shadow-emerald-500/20 border border-emerald-400/50"
              : "bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-500 shadow-blue-500/10"
          }`}
          title={habit.is_completed_today ? "Completed today! Tap to undo" : "Tap to complete for today"}
        >
          {habit.is_completed_today ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Done</span>
            </>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-flame-flicker" />
              <span>Check In</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitInput) => Promise<void>;
  initialHabit?: Habit | null;
}

export const HabitFormModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HabitInput>({
    resolver: zodResolver(habitSchema),
    defaultValues: initialHabit
      ? {
          name: initialHabit.name,
          category: initialHabit.category,
          frequency_type: initialHabit.frequency_type,
          frequency_value: initialHabit.frequency_value,
          target_note: initialHabit.target_note || "",
          start_date: initialHabit.start_date,
        }
      : {
          name: "",
          category: "fitness",
          frequency_type: "daily",
          frequency_value: null,
          target_note: "",
          start_date: new Date().toISOString().slice(0, 10),
        },
  });

  const selectedFrequencyType = watch("frequency_type");

  React.useEffect(() => {
    if (initialHabit) {
      reset({
        name: initialHabit.name,
        category: initialHabit.category,
        frequency_type: initialHabit.frequency_type,
        frequency_value: initialHabit.frequency_value,
        target_note: initialHabit.target_note || "",
        start_date: initialHabit.start_date,
      });
    } else {
      reset({
        name: "",
        category: "fitness",
        frequency_type: "daily",
        frequency_value: null,
        target_note: "",
        start_date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialHabit, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-lg font-bold text-slate-100">
            {initialHabit ? "Edit Habit" : "Build New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Habit Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. 100 Pushups & Cold Shower"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
            {errors.name && (
              <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Category & Target Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                {...register("category")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all capitalize"
              >
                {["fitness", "mindfulness", "learning", "nutrition", "sleep", "productivity", "social", "other"].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Target / Goal Note
              </label>
              <input
                {...register("target_note")}
                placeholder="e.g. 30 mins or 3 sets"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
              />
              {errors.target_note && (
                <p className="text-rose-400 text-xs mt-1">{errors.target_note.message}</p>
              )}
            </div>
          </div>

          {/* Frequency Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Frequency Pattern
            </label>
            <select
              {...register("frequency_type")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="daily">Daily (Every day)</option>
              <option value="weekly_days">Specific Days of the Week</option>
              <option value="times_per_week">X Times Per Week</option>
            </select>
          </div>

          {/* Conditional: Specific Weekdays */}
          {selectedFrequencyType === "weekly_days" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Scheduled Days
              </label>
              <Controller
                name="frequency_value"
                control={control}
                render={({ field }) => {
                  const selectedDays: number[] = Array.isArray(field.value) ? field.value : [1, 3, 5];
                  const toggleDay = (dayVal: number) => {
                    if (selectedDays.includes(dayVal)) {
                      field.onChange(selectedDays.filter((d) => d !== dayVal));
                    } else {
                      field.onChange([...selectedDays, dayVal].sort());
                    }
                  };
                  return (
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = selectedDays.includes(d.value);
                        return (
                          <button
                            type="button"
                            key={d.value}
                            onClick={() => toggleDay(d.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* Conditional: Times Per Week */}
          {selectedFrequencyType === "times_per_week" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Times Per Week (1–7)
              </label>
              <input
                type="number"
                min={1}
                max={7}
                {...register("frequency_value", { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              {...register("start_date")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
            {errors.start_date && (
              <p className="text-rose-400 text-xs mt-1">{errors.start_date.message}</p>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : initialHabit ? "Update Habit" : "Start Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
