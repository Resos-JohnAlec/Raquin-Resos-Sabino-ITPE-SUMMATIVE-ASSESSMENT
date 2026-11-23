"use client";

import React from "react";
import { useAuth, Role } from "@/lib/auth-context";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleBadgeColors: Record<Role, string> = {
    admin: "border-purple-800 bg-purple-950/40 text-purple-300",
    handler: "border-amber-800 bg-amber-950/40 text-amber-300",
    user: "border-cyan-800 bg-cyan-950/40 text-cyan-300",
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-sm tracking-wider text-white">AI-HAS</span>
          </div>

          <nav className="flex items-center space-x-1 text-xs">
            {user.role === "user" && (
              <span className="px-3 py-1.5 rounded bg-slate-800 text-cyan-300 font-medium">
                User Chat Portal
              </span>
            )}

            {user.role === "handler" && (
              <span className="px-3 py-1.5 rounded bg-slate-800 text-amber-300 font-medium">
                Agent Queue (HITL Console)
              </span>
            )}

            {user.role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === "queue"
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Agent Queue
                </button>
                <button
                  onClick={() => setActiveTab("kb")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === "kb"
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Knowledge Base
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === "users"
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === "chat"
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Chat Portal
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 hidden sm:inline">{user.email}</span>
            <span
              className={`px-2 py-0.5 rounded border uppercase text-[10px] font-bold ${
                roleBadgeColors[user.role]
              }`}
            >
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="px-2.5 py-1 rounded border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
