"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import LoginView from "@/components/LoginView";
import ChatPortal from "@/components/ChatPortal";
import AgentQueue from "@/components/AgentQueue";
import AdminDashboard from "@/components/AdminDashboard";
import KnowledgeBaseView from "@/components/KnowledgeBaseView";
import UserManagementView from "@/components/UserManagementView";

function MainContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("chat");

  useEffect(() => {
    if (user) {
      if (user.role === "handler") {
        setActiveTab("queue");
      } else if (user.role === "admin") {
        setActiveTab("dashboard");
      } else {
        setActiveTab("chat");
      }
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        Initializing AI-HAS Enterprise System...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1">
        {user.role === "user" && <ChatPortal />}

        {user.role === "handler" && <AgentQueue />}

        {user.role === "admin" && (
          <>
            {activeTab === "dashboard" && <AdminDashboard />}
            {activeTab === "queue" && <AgentQueue />}
            {activeTab === "kb" && <KnowledgeBaseView />}
            {activeTab === "users" && <UserManagementView />}
            {activeTab === "chat" && <ChatPortal />}
          </>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
