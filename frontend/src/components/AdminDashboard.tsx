"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";

interface DashboardMetrics {
  kpi: {
    ticket_deflection_rate_pct: number;
    mttr_minutes: number;
    avg_latency_ms: number;
    faithfulness_score: number;
    total_conversations: number;
    total_tickets: number;
    resolved_tickets: number;
    open_tickets: number;
  };
  tickets_by_category: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  guardrail_telemetry: {
    pii_redacted_events: number;
    prompt_injection_blocked: number;
    automated_password_resets: number;
    recent_audit_events: Array<{
      id: string;
      event_type: string;
      user_id?: string;
      created_at: string;
      details?: any;
    }>;
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [token]);

  const loadMetrics = async () => {
    try {
      const data = await apiRequest<DashboardMetrics>("/api/v1/metrics/dashboard", {}, token);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-mono">
        Loading administrative telemetry and KPI metrics...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-xs text-rose-400 font-mono">
        Unable to load dashboard telemetry. Ensure backend is running.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wider uppercase">
            Executive KPI &amp; Observability Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time deflection metrics, RAG fidelity, and guardrail telemetry
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800 self-start sm:self-auto"
        >
          Refresh Telemetry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Ticket Deflection Rate
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {metrics.kpi.ticket_deflection_rate_pct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Resolved via RAG &amp; Actions
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Mean Time To Resolution (MTTR)
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {metrics.kpi.mttr_minutes} min
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Target SLA: &lt; 20 min
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Average Response Latency
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.kpi.avg_latency_ms} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            P95 Retrieval &amp; Generation
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            RAG Faithfulness Score
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {metrics.kpi.faithfulness_score} / 1.00
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Grounded Citations Index
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
            Incident Breakdown by Category
          </div>
          <div className="space-y-3">
            {metrics.tickets_by_category.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{cat.category}</span>
                  <span className="text-slate-400 font-mono">
                    {cat.count} tickets ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
            Safety Guardrails &amp; Security Telemetry
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded border border-slate-800 bg-slate-900/50">
              <div className="text-[10px] uppercase text-slate-400">PII Scrubbed</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">
                {metrics.guardrail_telemetry.pii_redacted_events}
              </div>
            </div>
            <div className="p-3 rounded border border-slate-800 bg-slate-900/50">
              <div className="text-[10px] uppercase text-slate-400">Injections Blocked</div>
              <div className="text-lg font-bold text-rose-400 mt-1">
                {metrics.guardrail_telemetry.prompt_injection_blocked}
              </div>
            </div>
            <div className="p-3 rounded border border-slate-800 bg-slate-900/50">
              <div className="text-[10px] uppercase text-slate-400">AD Resets</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {metrics.guardrail_telemetry.automated_password_resets}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-3">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
          Enterprise Security Audit Trail (Recent Events)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Event Type</th>
                <th className="py-2 px-3">User ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Payload Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.guardrail_telemetry.recent_audit_events.map((log) => (
                <tr key={log.id} className="text-slate-300 hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 font-semibold text-cyan-300">{log.event_type}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {log.user_id ? log.user_id.slice(0, 8) + "..." : "System"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{log.created_at || "Recent"}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
