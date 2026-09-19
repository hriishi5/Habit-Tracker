import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock
} from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { Task, TaskInput } from "../schemas/schemas";
import { TaskItem, TaskFormModal } from "../components/TaskComponents";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch tasks with filters
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks", statusFilter, priorityFilter, categoryFilter, sortBy],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (sortBy) params.append("sortBy", sortBy);
      return apiRequest<Task[]>(`/tasks?${params.toString()}`);
    },
  });

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
        success(`Task completed: "${updated.title}"`);
      }
    },
    onError: (err: any) => error(err.message || "Failed to toggle task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest(`/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      success("Task removed");
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
      setModalOpen(false);
      setEditingTask(null);
      success(editingTask ? "Task updated" : "Task added");
    },
    onError: (err: any) => error(err.message || "Failed to save task"),
  });

  // Client-side search filtering
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Task Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize priorities, hit deadlines, and execute with precision.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or notes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="created_at">Date Created</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 shrink-0">
            {["all", "pending", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium focus:outline-none shrink-0 capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium focus:outline-none shrink-0 capitalize"
          >
            <option value="all">All Categories</option>
            {["work", "study", "health", "personal", "finance", "chores", "other"].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <LoadingSkeleton rows={4} height="h-16" />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={searchQuery ? "No matching tasks found" : "No tasks in this view"}
          description={
            searchQuery
              ? "Try adjusting your search keywords or clearing active filters."
              : "Keep your daily workload clear and organized. Click below to add a new task."
          }
          actionLabel="Add New Task"
          onAction={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={(t) => toggleTaskMutation.mutate(t)}
              onEdit={(t) => {
                setEditingTask(t);
                setModalOpen(true);
              }}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (data) => {
          await saveTaskMutation.mutateAsync(data);
        }}
        initialTask={editingTask}
      />
    </div>
  );
};
