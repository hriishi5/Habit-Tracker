import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const PrivateRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute font-bold text-xs text-blue-400">M</div>
        </div>
        <p className="text-slate-400 text-sm mt-4 tracking-wide font-medium">Loading MomentumOS...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
