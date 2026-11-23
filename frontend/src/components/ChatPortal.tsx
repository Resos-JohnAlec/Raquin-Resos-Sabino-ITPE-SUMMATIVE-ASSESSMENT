"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { Trash2, Bot, Plus, Lock } from "lucide-react";

interface MessageItem {
  id: string;
  sender_type: "user" | "assistant" | "system";
  content: string;
  redacted_content?: string;
  citations?: Array<{
    title: string;
    doc_id: string;
    score: number;
    chunk_index: number;
    excerpt: string;
  }>;
  created_at?: string;
  action_card?: {
    type: string;
    tool_invocation_id: string;
    title: string;
    description: string;
    requires_confirmation: boolean;
  } | null;
}

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
}

interface QuickOption {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
}

const QUICK_OPTIONS: QuickOption[] = [
  {
    id: "vpn",
    category: "Network",
    title: "VPN Gateway Error",
    description: "Resolve Gateway Timeout and connection handshake issues",
    prompt: "How do I fix the VPN Gateway Not Reachable or Network Timeout error?",
  },
  {
    id: "pwd",
    category: "Identity",
    title: "Reset Domain Password",
    description: "Self-service Active Directory password reset and OTP",
    prompt: "I need to reset my Active Directory domain password",
  },
  {
    id: "soft",
    category: "Access",
    title: "Software License Request",
    description: "Approval workflow for Docker, IDEs, and developer tools",
    prompt: "What is the approval process for Docker Desktop Pro, JetBrains, or developer tools?",
  },
  {
    id: "wifi",
    category: "Network",
    title: "Wi-Fi & 802.1x Network",
    description: "Fix corporate Wi-Fi drops, authentication, and IP renewal",
    prompt: "How do I troubleshoot corporate 802.1x Wi-Fi connection and IP address conflicts?",
  },
  {
    id: "email",
    category: "App",
    title: "Outlook & Email Sync",
    description: "Recover disconnected Exchange mailbox and sync errors",
    prompt: "My Outlook client is disconnected and emails are not syncing with Exchange",
  },
  {
    id: "mfa",
    category: "Security",
    title: "MFA & Authenticator Reset",
    description: "Lost phone recovery and Temporary Access Pass (TAP)",
    prompt: "I lost my phone and need to reset my Microsoft Authenticator MFA token",
  },
  {
    id: "perf",
    category: "Hardware",
    title: "Slow PC & High CPU",
    description: "Diagnose 100% CPU spikes, memory leaks, and disk lag",
    prompt: "My workstation is freezing and experiencing 100% CPU and disk usage",
  },
  {
    id: "display",
    category: "Hardware",
    title: "Dual Monitor & Docking",
    description: "Fix external display detection and USB-C dock issues",
    prompt: "My external monitor is not detected through the USB-C / Thunderbolt docking station",
  },
  {
    id: "phish",
    category: "Security",
    title: "Report Phishing Email",
    description: "Contain suspicious messages and trigger SOC triage",
    prompt: "I received a suspicious email asking for credentials and need to report it to Security",
  },
];

export default function ChatPortal() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeCitations, setActiveCitations] = useState<any[]>([]);
  const [escalating, setEscalating] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [escalatedTicketId, setEscalatedTicketId] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  useEffect(() => {
    loadConversations();
  }, [token]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  const loadConversations = async () => {
    try {
      const data = await apiRequest<ConversationItem[]>("/api/v1/chat/conversations", {}, token);
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      } else if (data.length === 0) {
        startNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startNewConversation = async () => {
    try {
      const conv = await apiRequest<ConversationItem>(
        "/api/v1/chat/conversations",
        {
          method: "POST",
          body: JSON.stringify({ title: "IT Helpdesk Session" }),
        },
        token
      );
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setActiveCitations([]);
      setActionResult(null);
      setEscalatedTicketId(null);
      setIsResolved(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/v1/chat/conversations/${convId}`, { method: "DELETE" }, token);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConvId === convId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await apiRequest<MessageItem[]>(
        `/api/v1/chat/conversations/${convId}/messages`,
        {},
        token
      );
      setMessages(data);

      let detectedTicket: string | null = null;
      let resolvedFlag = false;

      for (const m of data) {
        if (m.content.includes("Ticket Marked Resolved") || m.content.includes("Session Closed")) {
          resolvedFlag = true;
        }
        const match = m.content.match(/(?:Ticket logged:\s*|Ticket #)(t-\d+)/i);
        if (match) {
          detectedTicket = match[1];
        }
      }

      setIsResolved(resolvedFlag);
      setEscalatedTicketId(resolvedFlag ? null : detectedTicket);

      const lastWithCitations = [...data].reverse().find((m) => m.citations && m.citations.length > 0);
      if (lastWithCitations?.citations) {
        setActiveCitations(lastWithCitations.citations);
      } else {
        setActiveCitations([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeConvId || sending || isResolved) return;

    const userText = textToSend.trim();
    setInput("");
    setSending(true);

    const tempUserMsg: MessageItem = {
      id: "temp-" + Date.now(),
      sender_type: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await apiRequest<{
        role: string;
        content: string;
        citations: any[];
        action_card: any;
        is_escalated?: boolean;
        ticket_id?: string;
      }>(
        "/api/v1/chat/message",
        {
          method: "POST",
          body: JSON.stringify({
            conversation_id: activeConvId,
            content: userText,
          }),
        },
        token
      );

      if (res.is_escalated && res.ticket_id) {
        setEscalatedTicketId(res.ticket_id);
      }

      const assistantMsg: MessageItem = {
        id: "msg-" + Date.now(),
        sender_type: "assistant",
        content: res.content,
        citations: res.citations,
        action_card: res.action_card,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.citations && res.citations.length > 0) {
        setActiveCitations(res.citations);
      }
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: "err-" + Date.now(),
        sender_type: "assistant",
        content: `Notice: ${err.message || "Failed to process message"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input);
  };

  const handleActionConfirm = async (toolInvocationId: string, confirmed: boolean) => {
    try {
      const res = await apiRequest<any>(
        "/api/v1/chat/actions/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            tool_invocation_id: toolInvocationId,
            confirmed,
          }),
        },
        token
      );
      if (confirmed && res.temporary_password) {
        setActionResult(
          `Credentials Provisioned Successfully:\nTemporary Password: ${res.temporary_password}\nExpires In: ${res.expires_in_minutes} minutes`
        );
      } else {
        setActionResult("Action was cancelled.");
      }
    } catch (err: any) {
      setActionResult(`Action failed: ${err.message}`);
    }
  };

  const handleEscalate = async () => {
    if (!activeConvId || escalating || escalatedTicketId || isResolved) return;
    setEscalating(true);
    try {
      const res = await apiRequest<any>(
        "/api/v1/chat/escalate",
        {
          method: "POST",
          body: JSON.stringify({
            conversation_id: activeConvId,
            reason: "User requested human handler in chat portal",
          }),
        },
        token
      );
      setEscalatedTicketId(res.ticket_id);
      const escalationNotice: MessageItem = {
        id: "esc-" + Date.now(),
        sender_type: "assistant",
        content: `Ticket logged: ${res.ticket_id}. Your conversation has been transferred to the active Handler Queue. An agent will respond shortly.`,
      };
      setMessages((prev) => [...prev, escalationNotice]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEscalating(false);
    }
  };

  const handleSwitchToAI = async () => {
    if (!activeConvId) return;
    try {
      const res = await apiRequest<any>(
        "/api/v1/chat/switch-to-ai",
        {
          method: "POST",
          body: JSON.stringify({
            conversation_id: activeConvId,
          }),
        },
        token
      );
      setEscalatedTicketId(null);
      const switchNotice: MessageItem = {
        id: "sw-" + Date.now(),
        sender_type: "assistant",
        content: res.message || "Switched back to AI Assistant mode.",
      };
      setMessages((prev) => [...prev, switchNotice]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden font-mono">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between hidden md:flex">
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={startNewConversation}
            className="w-full py-2 px-3 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 transition-colors text-left flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Plus size={14} /> New Session
            </span>
            <span className="text-[10px] text-slate-400">Ctrl+K</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`group w-full flex items-center justify-between p-2.5 rounded text-xs transition-colors cursor-pointer ${
                activeConvId === c.id
                  ? "bg-slate-800/80 text-cyan-300 border border-slate-700"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-300"
              }`}
            >
              <span className="truncate flex-1 mr-2">{c.title}</span>
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(e, c.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                title="Delete Session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>AI-HAS Grounded RAG</span>
          <span className="text-cyan-400 font-bold">{conversations.length} Active</span>
        </div>
      </aside>

      <section className="flex-1 flex flex-col justify-between bg-slate-900/20">
        <div className="border-b border-slate-800 px-4 py-2.5 flex items-center justify-between bg-slate-950/40">
          <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
            <span>Level-1 IT Self-Service Portal</span>
            {isResolved && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-800 bg-emerald-950/60 text-emerald-300 font-bold">
                Ticket Resolved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isResolved ? (
              <button
                onClick={startNewConversation}
                className="text-xs px-3 py-1 rounded border border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} /> Start New Session
              </button>
            ) : escalatedTicketId ? (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded border border-amber-800/80 bg-amber-950/60 text-amber-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Connected to Handler ({escalatedTicketId})
                </span>
                <button
                  onClick={handleSwitchToAI}
                  className="text-xs px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5"
                  title="Return to automated AI Assistant"
                >
                  <Bot size={13} /> Talk to AI
                </button>
              </div>
            ) : (
              <button
                onClick={handleEscalate}
                disabled={escalating}
                className="text-xs px-3 py-1 rounded border border-amber-800 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40 transition-colors disabled:opacity-50"
              >
                {escalating ? "Routing..." : "Talk to a Human"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 max-w-4xl mx-auto">
              <div className="w-9 h-9 rounded-full border border-cyan-800 bg-cyan-950/40 flex items-center justify-center mb-3 text-cyan-400 font-bold">
                &gt;_
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                Enterprise IT Support Assistant
              </h3>
              <p className="text-xs max-w-lg text-slate-400 mb-5 text-center">
                Select any common scenario below for an immediate, step-by-step grounded SOP solution, or enter your question below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full">
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => submitMessage(opt.prompt)}
                    disabled={sending}
                    className="text-left p-3 rounded border border-slate-800/90 bg-slate-950/80 hover:bg-slate-900 hover:border-cyan-800/70 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                          {opt.category}
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-cyan-300 transition-colors">
                          &rarr;
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender_type === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                  {m.sender_type === "user" ? user?.email : "AI Helpdesk"}
                </div>
                <div
                  className={`p-3.5 rounded-lg max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender_type === "user"
                      ? "bg-cyan-950/60 border border-cyan-800/80 text-cyan-50"
                      : "bg-slate-900 border border-slate-800 text-slate-200"
                  }`}
                >
                  {m.content}

                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 uppercase">Citations:</span>
                      {m.citations.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300"
                        >
                          {c.title} ({Math.round(c.score * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {m.action_card && (
                    <div className="mt-3 p-3 rounded border border-amber-900/60 bg-amber-950/30 text-slate-200">
                      <div className="text-xs font-bold text-amber-300 mb-1">
                        {m.action_card.title}
                      </div>
                      <p className="text-[11px] text-slate-300 mb-3">
                        {m.action_card.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleActionConfirm(m.action_card!.tool_invocation_id, true)
                          }
                          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors"
                        >
                          Confirm Reset
                        </button>
                        <button
                          onClick={() =>
                            handleActionConfirm(m.action_card!.tool_invocation_id, false)
                          }
                          className="px-3 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {actionResult && (
            <div className="p-3 rounded border border-emerald-900/60 bg-emerald-950/30 text-emerald-300 text-xs whitespace-pre-wrap">
              {actionResult}
            </div>
          )}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                {escalatedTicketId
                  ? "Forwarding update to assigned human handler..."
                  : "Querying knowledge base and validating guardrails..."}
              </span>
            </div>
          )}
        </div>

        {isResolved ? (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Lock size={15} className="text-amber-400 shrink-0" />
              <span>
                This incident ticket was approved and marked resolved by the IT Handler. Chat for this session is closed.
              </span>
            </div>
            <button
              onClick={startNewConversation}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Plus size={14} /> Start New Session
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-800 bg-slate-950">
            {messages.length > 0 && !escalatedTicketId && (
              <div className="px-3 pt-2 pb-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap mr-1">
                  Quick Topics:
                </span>
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => submitMessage(opt.prompt)}
                    disabled={sending}
                    className="text-[10px] px-2 py-0.5 rounded border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-cyan-300 text-slate-400 whitespace-nowrap transition-colors shrink-0"
                  >
                    {opt.title}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    escalatedTicketId
                      ? `Send update to assigned handler (Ticket #${escalatedTicketId})...`
                      : "Describe your IT issue (PII is automatically redacted)..."
                  }
                  disabled={sending}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <aside className="w-80 border-l border-slate-800 bg-slate-950 p-4 hidden lg:block overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 border-b border-slate-800 pb-2">
          Retrieved SOP Citations
        </div>

        {activeCitations.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            {isResolved
              ? "Incident resolved and session closed."
              : escalatedTicketId
              ? "Session currently connected to active Handler Queue."
              : "No active knowledge base citations retrieved for this message."}
          </div>
        ) : (
          <div className="space-y-3">
            {activeCitations.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded border border-slate-800 bg-slate-900/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate">{c.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-900/60 bg-cyan-950/40 text-cyan-300">
                    {Math.round(c.score * 100)}% Match
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "{c.excerpt}..."
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Chunk ID: {c.chunk_index}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
