import React, { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  Flame,
  Plus,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/apiClient";

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { nudge, error: toastError } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMotivating, setIsMotivating] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Habits", path: "/habits", icon: Repeat },
    { name: "Calendar", path: "/calendar", icon: CalendarIcon },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleQuickMotivate = async () => {
    if (isMotivating) return;
    setIsMotivating(true);
    try {
      const res = await apiRequest<{ nudge: { message: string; tone: string }; quote: { athlete_name: string; quote_text: string } }>("/motivate", {
        method: "POST",
      });
      nudge(res.nudge.message, `Coach Momentum (${res.nudge.tone.toUpperCase()})`);
    } catch (err: any) {
      toastError(err.message || "Could not fetch motivation right now");
    } finally {
      setIsMotivating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col md:flex-row text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-xl shrink-0 h-screen sticky top-0 z-30">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Momentum<span className="text-blue-500">OS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Habit & Task Engine</p>
          </div>
        </div>

        {/* Motivational Quick CTA */}
        <div className="px-4 py-4">
          <button
            onClick={handleQuickMotivate}
            disabled={isMotivating}
            className="w-full group relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 hover:border-amber-500/60 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-lg shadow-amber-950/20 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isMotivating ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
            <span>{isMotivating ? "Calling Coach..." : "Coach Pep Talk"}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 uppercase">
                {user?.display_name?.slice(0, 2) || user?.email?.slice(0, 2) || "ME"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.display_name || "Athlete"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0B0F17]/95 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Momentum<span className="text-blue-500">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickMotivate}
            disabled={isMotivating}
            className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-slate-950/95 backdrop-blur-xl z-30 p-4 flex flex-col justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    isActive ? "bg-blue-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between pb-8">
            <div>
              <p className="text-sm font-semibold text-slate-200">{user?.display_name || "Athlete"}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-lg flex items-center justify-around py-2 px-1 z-30">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
