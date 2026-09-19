import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Calendar,
  Tag,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Clock,
  Plus
} from "lucide-react";
import { taskSchema, TaskInput, Task } from "../schemas/schemas";

// Priority badge colors
export const priorityBadges = {
  high: { label: "High", bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-400" },
  medium: { label: "Med", bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400" },
  low: { label: "Low", bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400" },
};

export const categoryColors: Record<string, string> = {
  work: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  study: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  health: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  personal: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  finance: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  chores: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pStyle = priorityBadges[task.priority] || priorityBadges.medium;
  const catStyle = categoryColors[task.category] || categoryColors.other;

  return (
    <div
      className={`group relative flex items-start gap-3.5 p-4 rounded-2xl glass-card border transition-all ${
        task.is_completed
          ? "border-slate-800/60 bg-slate-900/30 opacity-70"
          : "border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 shadow-sm"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task)}
        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
          task.is_completed
            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : "border-slate-600 hover:border-blue-400 bg-slate-800/60 text-transparent"
        }`}
        title={task.is_completed ? "Mark incomplete" : "Mark complete"}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={`text-sm font-semibold leading-tight transition-all ${
              task.is_completed ? "line-through text-slate-500" : "text-slate-100"
            }`}
          >
            {task.title}
          </h4>

          {/* Priority & Category Badges */}
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}
          >
            {pStyle.label}
          </span>
          <span
            className={`text-[10px] capitalize font-medium px-2 py-0.5 rounded-md border ${catStyle}`}
          >
            {task.category}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Due Date Indicator */}
        {task.due_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Due: {task.due_date}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            ></div>
            <div className="absolute right-0 top-6 z-20 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 text-xs space-y-0.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(task.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskInput) => Promise<void>;
  initialTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialTask
      ? {
          title: initialTask.title,
          description: initialTask.description || "",
          due_date: initialTask.due_date || "",
          priority: initialTask.priority,
          category: initialTask.category,
        }
      : {
          title: "",
          description: "",
          due_date: new Date().toISOString().slice(0, 10),
          priority: "medium",
          category: "other",
        },
  });

  React.useEffect(() => {
    if (initialTask) {
      reset({
        title: initialTask.title,
        description: initialTask.description || "",
        due_date: initialTask.due_date || "",
        priority: initialTask.priority,
        category: initialTask.category,
      });
    } else {
      reset({
        title: "",
        description: "",
        due_date: new Date().toISOString().slice(0, 10),
        priority: "medium",
        category: "other",
      });
    }
  }, [initialTask, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-lg font-bold text-slate-100">
            {initialTask ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Task Title *
            </label>
            <input
              {...register("title")}
              placeholder="e.g. 5 Mile Morning Tempo Run"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
            {errors.title && (
              <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Add key objectives or notes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
            {errors.description && (
              <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Row: Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                {...register("category")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all capitalize"
              >
                {["work", "study", "health", "personal", "finance", "chores", "other"].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              {...register("due_date")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
            {errors.due_date && (
              <p className="text-rose-400 text-xs mt-1">{errors.due_date.message}</p>
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
              {isSubmitting ? "Saving..." : initialTask ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
