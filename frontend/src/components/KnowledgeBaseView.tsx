"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";

interface KBDoc {
  id: string;
  title: string;
  file_path?: string;
  status: string;
  error_message?: string;
  metadata_json?: any;
}

export default function KnowledgeBaseView() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<KBDoc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<KBDoc | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [token]);

  const loadDocuments = async () => {
    try {
      const data = await apiRequest<KBDoc[]>("/api/v1/kb/documents", {}, token);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      await apiRequest(
        "/api/v1/kb/documents",
        {
          method: "POST",
          body: JSON.stringify({ title, content }),
        },
        token
      );
      setNotice(`Document '${title}' successfully ingested and indexed into Qdrant.`);
      setTitle("");
      setContent("");
      loadDocuments();
    } catch (err: any) {
      setNotice(`Failed to ingest document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this document and delete its vectors?")) return;
    try {
      await apiRequest(`/api/v1/kb/documents/${docId}`, { method: "DELETE" }, token);
      loadDocuments();
    } catch (err: any) {
      alert(`Error removing document: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 font-mono">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-lg font-bold text-white tracking-wider uppercase">
          Knowledge Base Management &amp; Chunk Indexer
        </h1>
        <p className="text-xs text-slate-400">
          Upload Standard Operating Procedures (SOPs), preview chunks, and manage Qdrant vector index.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-slate-800 bg-slate-950/60 p-5 rounded-lg space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
            Ingest New SOP Document
          </div>

          {notice && (
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-cyan-300">
              {notice}
            </div>
          )}

          <form onSubmit={handleCreateDocument} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SOP-IT-004: Wi-Fi Setup Guide"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Markdown / SOP Content
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste technical procedure, troubleshooting steps, and SLAs..."
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? "Ingesting into Qdrant..." : "Index Document"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 border border-slate-800 bg-slate-950/60 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Indexed Documents ({documents.length})
            </span>
            <button
              onClick={loadDocuments}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Chunks</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No documents currently indexed.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="text-slate-300 hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{doc.title}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            doc.status === "indexed"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                              : "bg-amber-950 text-amber-400 border border-amber-900"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {doc.metadata_json?.chunks_count || "N/A"}
                      </td>
                      <td className="py-2.5 px-3 flex gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-[11px] text-cyan-400 hover:underline"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleRemove(doc.id)}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {previewDoc && (
            <div className="mt-4 p-4 rounded border border-slate-700 bg-slate-900 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white">Metadata: {previewDoc.title}</span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <pre className="text-[10px] text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded">
                {JSON.stringify(previewDoc.metadata_json || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
