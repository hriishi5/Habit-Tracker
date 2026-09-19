import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { CalendarHeatmap, DayDetailDrawer, DayData } from "../components/CalendarComponents";
import { LoadingSkeleton } from "../components/EmptyState";
import { Task, Habit } from "../schemas/schemas";

export const CalendarPage: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().slice(0, 10)
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const monthString = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  // Fetch month heatmap data
  const { data: monthData, isLoading: monthLoading } = useQuery<{
    month: string;
    total_days: number;
    days: DayData[];
  }>({
    queryKey: ["calendar", monthString],
    queryFn: () => apiRequest(`/calendar?month=${monthString}`),
  });

  // Fetch day drilldown when drawer is open
  const { data: dayDetails, isLoading: dayLoading } = useQuery<{
    date: string;
    habits: (Habit & { completed?: boolean })[];
    tasks: Task[];
    stats: any;
  }>({
    queryKey: ["calendar-day", selectedDate],
    queryFn: () => apiRequest(`/calendar/day?date=${selectedDate}`),
    enabled: drawerOpen,
  });

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDrawerOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Consistency Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visual heatmap of your habit execution and task velocity.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-200 px-3 min-w-[130px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 shadow-2xl">
        {monthLoading ? (
          <LoadingSkeleton rows={5} height="h-16" />
        ) : (
          <CalendarHeatmap
            days={monthData?.days || []}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDay}
          />
        )}
      </div>

      {/* Quick summary note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Click any date on the calendar to see tasks and habit check-ins logged for that day.</span>
        <button
          onClick={() => {
            setSelectedDate(today.toISOString().slice(0, 10));
            setDrawerOpen(true);
          }}
          className="text-blue-400 font-semibold hover:underline shrink-0 ml-3"
        >
          View Today's Details
        </button>
      </div>

      {/* Day Detail Drawer */}
      <DayDetailDrawer
        date={selectedDate}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tasks={dayDetails?.tasks || []}
        habits={dayDetails?.habits || []}
      />
    </div>
  );
};
