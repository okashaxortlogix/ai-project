"use client";

import React, { useState } from "react";
import {
  Bot,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen1AuthProps {
  onSuccess?: () => void;
  isCompact?: boolean;
}

export default function Screen1Auth({ onSuccess, isCompact = false }: Screen1AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("secret123");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let res;
      if (isSignUp) {
        res = await api.register({
          name: name || email.split("@")[0],
          email,
          password
        });
      } else {
        res = await api.login(email, password);
      }

      if (res && (res.success || res.token)) {
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
        }
        if (res.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          if (res.user.organization_id) {
            localStorage.setItem("organization_id", res.user.organization_id);
          }
        }
        setAuthSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setErrorMsg(res?.message || "Authentication failed. Please check your credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error. Please ensure backend is reachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const oauthEmail = `${provider.toLowerCase()}@acme.com`;
      const res = await api.login(oauthEmail, "secret123");
      if (res && (res.success || res.token)) {
        if (res.token) localStorage.setItem("auth_token", res.token);
        if (res.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          if (res.user.organization_id) localStorage.setItem("organization_id", res.user.organization_id);
        }
        setAuthSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 500);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to authenticate with ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col md:flex-row ${isCompact ? "text-xs" : ""}`}>
      {/* Left Branding Panel */}
      <div className="md:w-5/12 bg-gradient-to-br from-[#06152D] via-[#071B3A] to-[#0D2852] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
        {/* Background decorative rings */}
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-600/10 blur-2xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none"></div>

        <div>
          {/* Logo Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1677FF] to-[#10C8C8] flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
            <Bot className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            AI Conversation & Sales Suite
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed mb-6 font-normal">
            Automate Conversations, Generate Leads, Book Appointments, Grow Your Business.
          </p>

          {/* Feature List */}
          <div className="space-y-3.5 pt-2">
            {[
              { icon: Zap, text: "AI-Powered Agents", desc: "Support, Sales & Booking" },
              { icon: Globe2, text: "Integrations & Automation", desc: "Shopify, WooCommerce, Calendar" },
              { icon: BarChart3, text: "Real-time Analytics", desc: "Full funnel attribution" },
              { icon: ShieldCheck, text: "Secure & Scalable", desc: "Multi-tenant enterprise RAG" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/20">
                  <f.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{f.text}</div>
                  {!isCompact && <div className="text-[10px] text-slate-400">{f.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Enterprise Edition v2.4</span>
          <span className="text-teal-400 font-medium">99.99% Uptime</span>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isSignUp ? "Create your account" : "Welcome Back"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp
                ? "Start converting conversations into revenue today."
                : "Sign in to access your AI sales suite workspace"}
            </p>
          </div>

          {authSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authentication successful! Launching workspace...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? "Create Free Account" : "Sign In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200"></div>
            <span className="bg-white px-2.5 text-[11px] text-slate-400 uppercase tracking-wider relative">
              Or continue with
            </span>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin("Google")}
              disabled={loading}
              className="py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin("GitHub")}
              disabled={loading}
              className="py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline ml-1"
            >
              {isSignUp ? "Sign In" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
