"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  Layers,
  ArrowRight,
  X,
  FileUp,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen9KnowledgeBaseProps {
  isCompact?: boolean;
}

export default function Screen9KnowledgeBase({ isCompact = false }: Screen9KnowledgeBaseProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Documents" | "FAQs" | "Settings">("Documents");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [ragQuery, setRagQuery] = useState("What is the return policy window?");
  const [ragResult, setRagResult] = useState<any>({
    chunk: "We offer a 30-day hassle-free return window for all unblemished hardware and unopened software packages. Full refunds are processed within 48 hours of return receipt.",
    source: "Return Policy.pdf#section=policy",
    similarity: 0.94
  });

  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<string>("Policy");
  const [newDocContent, setNewDocContent] = useState("");

  const loadDocs = async () => {
    try {
      const res = await api.getKnowledgeDocs();
      if (res.success && res.data) {
        setDocs(res.data);
      }
    } catch (e) {
      console.error("Failed to load knowledge docs from API", e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const res = await api.uploadKnowledgeDoc({
        title: newDocName.endsWith(".pdf") ? newDocName : `${newDocName}.pdf`,
        type: newDocType,
        content: newDocContent || `Parsed document contents for ${newDocName}.`
      });

      if (res.success) {
        await loadDocs();
        setNewDocName("");
        setNewDocContent("");
        setIsUploadOpen(false);
      }
    } catch (e) {
      console.error("Failed to upload doc", e);
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the knowledge base and vector index?`)) return;
    try {
      const res = await api.deleteKnowledgeDoc(id);
      if (res.success) {
        await loadDocs();
      }
    } catch (e) {
      console.error("Failed to delete doc", e);
    }
  };

  const handleTestRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.queryKnowledge(ragQuery);
      if (res.success && res.data) {
        setRagResult(res.data);
      }
    } catch (e) {
      console.error("RAG query failed", e);
    }
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Knowledge Base</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-600" />
              Live Vector RAG API
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            RAG knowledge indexing that powers real-time AI agent grounding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-3">
        {(["Documents", "FAQs", "Settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Last Updated</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>{doc.title}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium">
                    {doc.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-500">{doc.last_updated}</td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    {doc.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right space-x-2">
                  <button
                    onClick={() => alert(`Reindexing ${doc.title} with 380-char chunks into vector store...`)}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Reindex
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                    className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RAG Interactive Test Simulator */}
      <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive RAG Semantic Search (API)</span>
          </div>
          <span className="text-[10px] text-slate-500">Live Vector Retrieval Test</span>
        </div>

        <form onSubmit={handleTestRAG} className="flex gap-2 mb-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Query knowledge base (e.g. 'What is the return window?')..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Run RAG
          </button>
        </form>

        {ragResult && (
          <div className={`p-2.5 bg-white rounded-lg border text-xs shadow-2xs ${ragResult.match !== false ? "border-blue-200/70" : "border-amber-200 bg-amber-50/20"}`}>
            <div className="flex items-center justify-between text-[11px] pb-1.5 mb-1.5 border-b border-slate-100">
              <span className={`font-semibold flex items-center gap-1 ${ragResult.match !== false ? "text-blue-600" : "text-amber-700"}`}>
                <FileText className="w-3 h-3" />
                Source: {ragResult.source}
              </span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                ragResult.match !== false 
                  ? "text-emerald-600 bg-emerald-50" 
                  : "text-amber-700 bg-amber-100"
              }`}>
                {ragResult.match !== false 
                  ? `${Math.round(ragResult.similarity * 100)}% Cosine Match` 
                  : "Rejected (< 65% Threshold)"}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {ragResult.chunk}
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-blue-600" />
                Upload Knowledge Document (API)
              </h4>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Employee Guidelines 2025"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Policy">Policy</option>
                  <option value="Product">Product</option>
                  <option value="FAQ">FAQ</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Text / Rules</label>
                <textarea
                  placeholder="Paste document text or policies to chunk and vectorize..."
                  rows={3}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Parse & Vectorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
