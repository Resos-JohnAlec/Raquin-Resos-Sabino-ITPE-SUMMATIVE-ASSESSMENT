"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { CheckCircle, Send, Sparkles, Lock, RefreshCw, Trash2 } from "lucide-react";

interface TicketItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  escalation_reason?: string;
  requester_id: string;
  created_at: string;
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  escalation_reason?: string;
  requester_id: string;
  created_at: string;
  transcript: Array<{ sender: string; text: string; created_at: string }>;
  suggested_reply: string;
}

export default function AgentQueue() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [counts, setCounts] = useState<{ all: number; open: number; resolved: number }>({
    all: 0,
    open: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [token, filter]);

  useEffect(() => {
    if (activeTicketId) {
      loadTicketDetail(activeTicketId);
    }
  }, [activeTicketId]);

  const loadTickets = async () => {
    try {
      const allTickets = await apiRequest<TicketItem[]>("/api/v1/tickets", {}, token);
      const openCount = allTickets.filter((t) => t.status.toLowerCase() === "open").length;
      const resolvedCount = allTickets.filter((t) => t.status.toLowerCase() === "resolved").length;
      setCounts({
        all: allTickets.length,
        open: openCount,
        resolved: resolvedCount,
      });

      let filtered = allTickets;
      if (filter === "open") {
        filtered = allTickets.filter((t) => t.status.toLowerCase() === "open");
      } else if (filter === "resolved") {
        filtered = allTickets.filter((t) => t.status.toLowerCase() === "resolved");
      }

      setTickets(filtered);

      if (filtered.length > 0) {
        if (!activeTicketId || !filtered.some((t) => t.id === activeTicketId)) {
          setActiveTicketId(filtered[0].id);
        }
      } else {
        setActiveTicketId(null);
        setTicketDetail(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTicketDetail = async (id: string) => {
    try {
      const data = await apiRequest<TicketDetail>(`/api/v1/tickets/${id}`, {}, token);
      setTicketDetail(data);
      setReplyText(data.suggested_reply || "");
      setActionNotice(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/v1/tickets/${ticketId}`, { method: "DELETE" }, token);
      const remaining = tickets.filter((t) => t.id !== ticketId);
      setTickets(remaining);

      const openRemaining = remaining.filter((t) => t.status.toLowerCase() === "open").length;
      const resolvedRemaining = remaining.filter((t) => t.status.toLowerCase() === "resolved").length;
      setCounts({
        all: remaining.length,
        open: openRemaining,
        resolved: resolvedRemaining,
      });

      if (activeTicketId === ticketId) {
        if (remaining.length > 0) {
          setActiveTicketId(remaining[0].id);
        } else {
          setActiveTicketId(null);
          setTicketDetail(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      setActionNotice(`Failed to delete ticket: ${err.message}`);
    }
  };

  const handleResolveAndReply = async (markResolved: boolean) => {
    if (!activeTicketId || !replyText.trim()) return;
    setLoading(true);
    try {
      await apiRequest(
        `/api/v1/tickets/${activeTicketId}/reply`,
        {
          method: "POST",
          body: JSON.stringify({
            reply_text: replyText,
            mark_resolved: markResolved,
          }),
        },
        token
      );
      setActionNotice(
        markResolved
          ? "Approved & Resolved: Message dispatched to user and session chat is now closed."
          : "Response dispatched. Ticket remains open."
      );
      await loadTickets();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggested = () => {
    if (ticketDetail?.suggested_reply) {
      setReplyText(ticketDetail.suggested_reply);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden font-mono">
      <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col justify-between">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">
              Escalated Incidents
            </span>
            <button
              onClick={loadTickets}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Refresh queue"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="flex gap-1 text-[11px]">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 rounded capitalize ${
                filter === "all"
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-2 py-1 rounded capitalize ${
                filter === "open"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-900 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Open ({counts.open})
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-2 py-1 rounded capitalize ${
                filter === "resolved"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-900 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Resolved ({counts.resolved})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tickets.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">
              No tickets found in &apos;{filter}&apos; filter.
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`group w-full text-left p-3 rounded border text-xs transition-colors cursor-pointer ${
                  activeTicketId === t.id
                    ? "border-amber-700 bg-amber-950/20 text-slate-100"
                    : "border-slate-800/80 bg-slate-900/30 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] text-amber-400 uppercase">
                    {t.priority}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        t.status === "resolved"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                          : "bg-amber-950 text-amber-400 border border-amber-900"
                      }`}
                    >
                      {t.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTicket(e, t.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete ticket"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="font-medium text-xs truncate text-slate-200 mb-1">
                  {t.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {t.description}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Active View: {filter.toUpperCase()}</span>
          <span className="text-amber-400 font-bold">
            {counts.open} Open Pending
          </span>
        </div>
      </aside>

      <section className="flex-1 flex flex-col justify-between bg-slate-900/20">
        {!ticketDetail ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Select an incident ticket from the queue to diagnose and resolve.
          </div>
        ) : (
          <>
            <div className="border-b border-slate-800 px-5 py-3 flex items-center justify-between bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded border border-amber-900/80 bg-amber-950/40 text-amber-300 font-bold uppercase">
                    Incident #{ticketDetail.id}
                  </span>
                  <h2 className="text-xs font-bold text-white tracking-wide truncate max-w-md">
                    {ticketDetail.title}
                  </h2>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Requester: <span className="text-slate-300">{ticketDetail.requester_id}</span>
                  {ticketDetail.escalation_reason && (
                    <span className="ml-2 text-amber-300">
                      &bull; {ticketDetail.escalation_reason}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded uppercase font-bold border border-slate-700 bg-slate-900 text-slate-300">
                  {ticketDetail.priority}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded uppercase font-bold flex items-center gap-1.5 ${
                    ticketDetail.status === "resolved"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {ticketDetail.status === "resolved" ? (
                    <>
                      <CheckCircle size={12} /> Resolved
                    </>
                  ) : (
                    "Active Triage"
                  )}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteTicket(e, ticketDetail.id)}
                  className="text-xs px-2.5 py-1 rounded border border-slate-800 bg-slate-900 hover:border-rose-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                  title="Delete ticket"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>Conversation Transcript (Presidio PII Scrubbed)</span>
                <span className="text-emerald-400">Live Transcript View</span>
              </div>

              {ticketDetail.transcript.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-10">
                  No previous messages logged for this ticket.
                </div>
              ) : (
                ticketDetail.transcript.map((item, idx) => {
                  const isUser = item.sender === "user";
                  const isHandler = item.sender === "handler" || item.text.startsWith("[Technician Response]");

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        isUser
                          ? "items-start"
                          : isHandler
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                        {isUser
                          ? "End-User (Employee)"
                          : isHandler
                          ? `Technician (${user?.email || "Handler"})`
                          : "AI Helpdesk Bot"}
                      </div>
                      <div
                        className={`p-3.5 rounded-lg max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-cyan-950/40 border border-cyan-800/80 text-cyan-100"
                            : isHandler
                            ? "bg-amber-950/40 border border-amber-800/80 text-amber-100"
                            : "bg-slate-900 border border-slate-800 text-slate-300"
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                })
              )}

              {actionNotice && (
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-emerald-300">
                  {actionNotice}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3">
              {ticketDetail.status === "resolved" ? (
                <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-emerald-400" />
                    <span>
                      This ticket has been approved and marked resolved. The employee chat session is closed.
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Session Inactive
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                      Technician Resolution Response
                    </span>

                    {ticketDetail.suggested_reply && (
                      <button
                        type="button"
                        onClick={handleUseSuggested}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <Sparkles size={12} /> Use Copilot Suggestion
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official technician response or guidance for the user..."
                    disabled={loading}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400">
                      Approving resolves the incident and closes user chat for this session.
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolveAndReply(false)}
                        disabled={loading || !replyText.trim()}
                        className="px-3.5 py-1.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs uppercase font-medium tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <Send size={13} /> Send Reply (Keep Open)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResolveAndReply(true)}
                        disabled={loading || !replyText.trim()}
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase font-medium tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Approve &amp; Resolve Ticket
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
