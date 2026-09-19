import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, ArrowRight, Lock, Mail, User } from "lucide-react";
import { signupSchema, SignupInput } from "../schemas/schemas";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthLayout } from "../components/AuthLayout";

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      display_name: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      await signup(data.email, data.password, data.display_name);
      success("Account created successfully! Welcome aboard.");
      navigate("/", { replace: true });
    } catch (err: any) {
      error(err.message || "Failed to create account");
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-3xl glass-card border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Join Momentum<span className="text-blue-500">OS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build habits with athlete-grade discipline and streak tracking
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register("display_name")}
                placeholder="e.g. Kobe Bryant"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
              />
            </div>
            {errors.display_name && (
              <p className="text-rose-400 text-xs mt-1">{errors.display_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register("email")}
                placeholder="athlete@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
              />
            </div>
            {errors.email && (
              <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password (min. 6 chars) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
              />
            </div>
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
