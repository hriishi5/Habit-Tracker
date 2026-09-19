import React from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-blue-400" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-100 mb-2">404</h1>
      <h2 className="text-lg font-bold text-slate-300 mb-2">Page Not Found</h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
        The route you are looking for does not exist in MomentumOS.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
