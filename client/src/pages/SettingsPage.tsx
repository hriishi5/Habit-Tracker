import React, { useState } from "react";
import { User, Shield, Key, LogOut, Check, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { success, error } = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      error("Display name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile(displayName.trim());
      success("Profile name updated successfully");
    } catch (err: any) {
      error(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your athlete profile, security preferences, and session.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Athlete Profile</h3>
            <p className="text-xs text-slate-400">Your public identity in Coach Momentum reviews</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 text-sm cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Email is managed by Supabase Authentication.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Kobe Bryant"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Security & Sessions */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/70 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Security & Isolation</h3>
            <p className="text-xs text-slate-400">Row Level Security (RLS) protects your data</p>
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            Your account is secured via server-verified cryptographic JWT tokens. PostgreSQL Row Level Security enforces that your tasks, habits, and coach reviews are strictly isolated to your user ID.
          </p>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>RLS Active: Only your authenticated session can access your data.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Log out of this device</span>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
