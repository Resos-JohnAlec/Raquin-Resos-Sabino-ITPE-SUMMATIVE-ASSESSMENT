"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff } from "lucide-react";

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-mono">
      <div className="w-full max-w-md border border-slate-800 bg-slate-900/60 p-8 rounded-lg shadow-2xl backdrop-blur-md">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h1 className="text-lg font-bold text-white tracking-wider">AI-HAS PORTAL</h1>
          </div>
          <p className="text-xs text-slate-400">Enterprise IT Helpdesk Authentication</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@aihas.local"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2">
            Quick-Fill Role Credentials
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect("admin@aihas.local", "Admin123!")}
              className="p-2 border border-slate-800 bg-slate-950/60 rounded text-[11px] text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors text-left"
            >
              <div className="font-bold">ADMIN</div>
              <div className="text-[9px] text-slate-400">Full Access</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("handler@aihas.local", "Handler123!")}
              className="p-2 border border-slate-800 bg-slate-950/60 rounded text-[11px] text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors text-left"
            >
              <div className="font-bold">HANDLER</div>
              <div className="text-[9px] text-slate-400">Agent Queue</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("user@aihas.local", "User123!")}
              className="p-2 border border-slate-800 bg-slate-950/60 rounded text-[11px] text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors text-left"
            >
              <div className="font-bold">USER</div>
              <div className="text-[9px] text-slate-400">Chat Only</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
