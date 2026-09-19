import React from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  X,
  Flame,
  Check,
  Clock
} from "lucide-react";
import { Task, Habit } from "../schemas/schemas";

export interface DayData {
  date: string;
  day_number: number;
  day_of_week: number;
  habits_completed: number;
  habits_scheduled: number;
  intensity: number; // 0 to 4
  tasks_count: number;
  tasks_completed: number;
}

interface CalendarHeatmapProps {
  days: DayData[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const INTENSITY_COLORS = [
  "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-500", // 0: none
  "bg-emerald-950/70 border-emerald-800/60 text-emerald-300 hover:border-emerald-500", // 1: <50%
  "bg-emerald-800/80 border-emerald-600/70 text-emerald-200 hover:border-emerald-400", // 2: >=50%
  "bg-emerald-600/90 border-emerald-400 text-white hover:border-emerald-300 shadow-sm shadow-emerald-500/20", // 3: >=75%
  "bg-emerald-500 border-emerald-300 text-white font-bold hover:border-white shadow-md shadow-emerald-500/40", // 4: 100%
];

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Determine empty padding days before day 1 of month
  const firstDay = days[0];
  const paddingBefore = firstDay ? firstDay.day_of_week : 0;

  return (
    <div className="w-full">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
        {weekDays.map((wd) => (
          <div key={wd} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Padding slots */}
        {Array.from({ length: paddingBefore }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-slate-900/20 opacity-30"></div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const isSelected = selectedDate === day.date;
          const colorClass = INTENSITY_COLORS[day.intensity] || INTENSITY_COLORS[0];

          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all relative group select-none active:scale-95 ${colorClass} ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0B0F17] scale-105 z-10" : ""
              }`}
            >
              <span className="text-xs sm:text-sm font-semibold">{day.day_number}</span>

              {/* Badges for habit logs / tasks */}
              <div className="flex items-center gap-1">
                {day.habits_completed > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${day.habits_completed} habits done`}></span>
                )}
                {day.tasks_count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      day.tasks_completed === day.tasks_count ? "bg-blue-400" : "bg-slate-400"
                    }`}
                    title={`${day.tasks_completed}/${day.tasks_count} tasks done`}
                  ></span>
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap shadow-xl z-30 transition-opacity">
                <div>{day.date}</div>
                <div>{day.habits_completed}/{day.habits_scheduled} habits</div>
                {day.tasks_count > 0 && <div>{day.tasks_completed}/{day.tasks_count} tasks</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-400">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {INTENSITY_COLORS.map((c, idx) => (
            <div key={idx} className={`w-3.5 h-3.5 rounded-md border ${c}`}></div>
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

interface DayDetailDrawerProps {
  date: string;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: (Habit & { completed?: boolean })[];
}

export const DayDetailDrawer: React.FC<DayDetailDrawerProps> = ({
  date,
  isOpen,
  onClose,
  tasks,
  habits,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Day Overview</h3>
                <p className="text-xs text-slate-400">{date}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Habits Logged */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Habits Status</span>
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                {habits.filter((h) => h.completed).length} / {habits.length}
              </span>
            </div>

            {habits.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No habits registered.</p>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      h.completed
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                        : "bg-slate-800/40 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="font-semibold">{h.name}</span>
                    {h.completed ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Done
                      </span>
                    ) : (
                      <span className="text-slate-500">Not logged</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Tasks Due */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Tasks Due This Day</span>
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                {tasks.filter((t) => t.is_completed).length} / {tasks.length}
              </span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No tasks due on this date.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      t.is_completed
                        ? "bg-slate-800/40 border-slate-800 line-through text-slate-500"
                        : "bg-slate-800/80 border-slate-700 text-slate-100 font-semibold"
                    }`}
                  >
                    <span>{t.title}</span>
                    <span className="uppercase text-[10px] font-bold text-slate-400">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors mt-6"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
