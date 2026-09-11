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
  Trash2,
  RefreshCw,
  Eye,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

interface Screen9KnowledgeBaseProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen9KnowledgeBase({ onNavigate, isCompact = false }: Screen9KnowledgeBaseProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Form state
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Policy");
  const [docAgent, setDocAgent] = useState("Support Agent");
  const [docContent, setDocContent] = useState("");

  const loadDocs = async () => {
    try {
      const res = await api.getKnowledgeDocs();
      if (res.success && res.data && res.data.length > 0) {
        setDocs(res.data);
      } else {
        setDocs([
          { id: "1", title: "Standard Return Policy 2026.pdf", type: "Policy", agent: "Support Agent", chunks: 14, lastUpdated: "Apr 28, 2026", status: "Indexed" },
          { id: "2", title: "Product Catalog & Pricing Guide.xlsx", type: "Catalog", agent: "Sales Agent", chunks: 32, lastUpdated: "Apr 26, 2026", status: "Indexed" },
          { id: "3", title: "Calendar Booking & Reschedule FAQ.docx", type: "FAQ", agent: "Appointment Agent", chunks: 8, lastUpdated: "Apr 25, 2026", status: "Indexed" },
          { id: "4", title: "VIP Client Warranty Coverage.pdf", type: "Terms", agent: "Support Agent", chunks: 19, lastUpdated: "Apr 22, 2026", status: "Indexed" },
          { id: "5", title: "Q2 Promotional Campaign Rules.pdf", type: "Marketing", agent: "Sales Agent", chunks: 6, lastUpdated: "Apr 20, 2026", status: "Indexed" }
        ]);
      }
    } catch (e) {
      console.error("Failed to load knowledge docs", e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newD = {
      id: `doc-${Date.now()}`,
      title: docTitle.endsWith(".pdf") ? docTitle : `${docTitle}.pdf`,
      type: docType,
      agent: docAgent,
      chunks: Math.floor(Math.random() * 15) + 5,
      lastUpdated: "Just now",
      status: "Indexed",
      content: docContent || "Document indexed into vector store with chunk size 500."
    };

    setDocs((prev) => [newD, ...prev]);
    setDocTitle("");
    setDocContent("");
    setIsUploadOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this document and remove its embeddings from vector database?")) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc && selectedDoc.id === id) setSelectedDoc(null);
    }
  };

  const handleReindex = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Processing" } : d))
    );
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Indexed", lastUpdated: "Just now" } : d))
      );
    }, 1200);
  };

  const filteredDocs = docs.filter(
    (d) =>
      search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      d.agent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Knowledge Base</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage information and documents used by AI agents for RAG grounding.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            onClick={() => setIsUploadOpen(true)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title, agent or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Showing <span className="font-semibold text-slate-800">{filteredDocs.length}</span> indexed documents
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="p-3 pl-4">Document</th>
                <th className="p-3">Type</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Chunks</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No documents found. Click "Upload Document" to index your first PDF or FAQ.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 pl-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{doc.agent}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{doc.chunks}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{doc.lastUpdated}</td>
                    <td className="p-3">
                      <StatusBadge
                        variant={
                          doc.status === "Indexed"
                            ? "active"
                            : doc.status === "Processing"
                            ? "connected"
                            : "error"
                        }
                        label={doc.status}
                      />
                    </td>
                    <td className="p-3 pr-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="text-slate-500 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleReindex(doc.id)}
                        className="text-slate-500 hover:text-emerald-600 p-1 transition-colors cursor-pointer"
                        title="Re-index vector chunks"
                      >
                        <RefreshCw className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Knowledge Document"
        description="Index new materials into RAG embeddings for autonomous AI agent answers."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpload}>
              Index Document
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              placeholder="e.g. Return Policy 2026.pdf"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="Policy">Policy / Legal</option>
                <option value="Catalog">Product Catalog</option>
                <option value="FAQ">FAQ Questions</option>
                <option value="Manual">Support Manual</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Agent</label>
              <select
                value={docAgent}
                onChange={(e) => setDocAgent(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="Support Agent">Support Agent</option>
                <option value="Sales Agent">Sales Agent</option>
                <option value="Appointment Agent">Appointment Agent</option>
                <option value="All Agents">All Agents</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Raw Text / Snippet</label>
            <textarea
              rows={4}
              placeholder="Paste policy text or document excerpts to generate vector chunks..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900"
            />
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          description={`Assigned to ${selectedDoc.agent}`}
          size="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedDoc(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-semibold text-slate-900">{selectedDoc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Chunks:</span>
                <span className="font-semibold text-slate-900">{selectedDoc.chunks} vectors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Embedding Model:</span>
                <span className="font-semibold text-slate-900">text-embedding-3-small</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge variant="active" label={selectedDoc.status} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
