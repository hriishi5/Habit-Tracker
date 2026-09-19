import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from "recharts";
import {
  Sparkles,
  Trophy,
  Flame,
  Clock,
  Quote as QuoteIcon,
  CheckCircle2,
  Lightbulb,
  ArrowUpRight
} from "lucide-react";
import { WeeklyReview, Quote } from "../schemas/schemas";

interface ProgressChartProps {
  data: {
    date: string;
    task_completion_rate: number | null;
    habit_consistency_rate: number;
    tasks_completed: number;
    tasks_total: number;
  }[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const formattedData = data.map((d) => ({
    ...d,
    shortDate: d.date.slice(5), // 'MM-DD'
    taskRate: d.task_completion_rate ?? 0,
    habitRate: d.habit_consistency_rate,
  }));

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="taskRateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="habitRateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="shortDate"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              borderColor: "#334155",
              borderRadius: "12px",
              color: "#F8FAFC",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            }}
          />
          <Area
            type="monotone"
            name="Task Completion"
            dataKey="taskRate"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#taskRateGrad)"
          />
          <Area
            type="monotone"
            name="Habit Consistency"
            dataKey="habitRate"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#habitRateGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StreakChartProps {
  data: {
    name: string;
    current_streak: number;
    longest_streak: number;
  }[];
}

export const StreakChart: React.FC<StreakChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              borderColor: "#334155",
              borderRadius: "12px",
              color: "#F8FAFC",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Bar name="Current Streak" dataKey="current_streak" fill="#FF5722" radius={[6, 6, 0, 0]} />
          <Bar name="Best Streak" dataKey="longest_streak" fill="#F59E0B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ConsistencyScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let title = "Champion Tier";
  let color = "text-emerald-400 stroke-emerald-500";
  if (score < 50) {
    title = "Building Foundation";
    color = "text-amber-400 stroke-amber-500";
  } else if (score < 75) {
    title = "Contender Tier";
    color = "text-blue-400 stroke-blue-500";
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-100 tabular-nums">{score}%</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Consistency</span>
        </div>
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-300">{title}</div>
    </div>
  );
};

export const QuoteOfTheDayCard: React.FC<{ quote: Quote }> = ({ quote }) => {
  return (
    <div className="relative rounded-2xl glass-card border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/20 p-6 overflow-hidden">
      <QuoteIcon className="absolute -top-2 -left-2 w-20 h-20 text-blue-500/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
            Daily Athlete Wisdom
          </span>
          {quote.tags?.map((tag) => (
            <span key={tag} className="text-[10px] text-slate-400 capitalize hidden sm:inline">
              #{tag}
            </span>
          ))}
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-100 italic leading-relaxed">
          "{quote.quote_text}"
        </p>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
          <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-300">
            {quote.athlete_name.slice(0, 1)}
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide">{quote.athlete_name}</span>
        </div>
      </div>
    </div>
  );
};

interface WeeklyReviewCardProps {
  review: WeeklyReview | null;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({
  review,
  onGenerate,
  isGenerating,
}) => {
  return (
    <div className="rounded-2xl glass-card border border-slate-800 bg-slate-900/70 p-6 relative overflow-hidden shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Coach Momentum Weekly Review</h3>
            <p className="text-xs text-slate-400">AI-generated retrospective grounded in your real weekly numbers</p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Analyzing Stats..." : "Generate AI Review"}</span>
        </button>
      </div>

      {!review ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
            Ready to review your weekly performance? Click the button above to have Coach Momentum analyze your task completion and habit consistency.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {review.summary}
            </p>
          </div>

          {/* Key Suggestions */}
          {review.suggestions && review.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Coach Action Items</span>
              </h4>
              <div className="space-y-2">
                {review.suggestions.map((sug, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-800/20 p-2.5 rounded-lg border border-slate-800">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{sug}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlighted Habit & Timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
            {review.highlight_habit && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Flame className="w-3.5 h-3.5" /> Highlight: {review.highlight_habit}
              </span>
            )}
            <span>Generated: {new Date(review.generated_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
