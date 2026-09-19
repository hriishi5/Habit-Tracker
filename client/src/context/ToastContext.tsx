import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, Flame, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning" | "nudge";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  nudge: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: "success", title: title || "Success", message });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: "error", title: title || "Error", message });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: "info", title: title || "Info", message });
  }, [addToast]);

  const nudge = useCallback((message: string, title?: string) => {
    addToast({ type: "nudge", title: title || "Coach Nudge", message, duration: 6000 });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, nudge }}
    >
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = "bg-slate-900 border-slate-700 text-slate-100";
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

          if (toast.type === "success") {
            bgClass = "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === "error") {
            bgClass = "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50";
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (toast.type === "nudge") {
            bgClass = "bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/20";
            icon = <Flame className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bgClass}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                {toast.title && <div className="font-semibold text-sm leading-snug">{toast.title}</div>}
                <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
