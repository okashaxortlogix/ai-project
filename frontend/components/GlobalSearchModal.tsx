"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  DollarSign,
  MessageSquare,
  CheckSquare,
  Sparkles,
  ArrowRight,
  X,
  Command,
  Building2,
  Calendar
} from "lucide-react";
import { api } from "@/lib/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: number) => void;
  onSelectContact?: (contact: any) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigate,
  onSelectContact
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    contacts: any[];
    opportunities: any[];
    conversations: any[];
    tasks: any[];
    workflows: any[];
  }>({
    contacts: [],
    opportunities: [],
    conversations: [],
    tasks: [],
    workflows: []
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchResults("");
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.globalSearch(q);
      if (res && res.success && res.data) {
        setResults({
          contacts: res.data.contacts || [],
          opportunities: res.data.opportunities || [],
          conversations: res.data.conversations || [],
          tasks: res.data.tasks || [],
          workflows: res.data.workflows || []
        });
      }
    } catch (e) {
      console.error("Failed to perform global search", e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    fetchResults(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 p-4">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Omnisearch Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search contacts, deals, chats, tasks, workflows..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
            ESC
          </span>
        </div>

        {/* Results List Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Contacts & Leads */}
          {results.contacts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-blue-500" /> Contacts & Leads
              </div>
              <div className="space-y-1 mt-1">
                {results.contacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onSelectContact) onSelectContact(c);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {c.name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.email} • {c.company || "Apex Logistics"}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      Open 360 <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities & Deals */}
          {results.opportunities.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-500" /> Deals & Opportunities
              </div>
              <div className="space-y-1 mt-1">
                {results.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => {
                      onNavigate(18);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        $
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700">{opp.title}</div>
                        <div className="text-[11px] text-slate-500">{opp.contact_name} • ${Number(opp.value || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      Pipelines <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {results.conversations.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-purple-500" /> Live Conversations
              </div>
              <div className="space-y-1 mt-1">
                {results.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onNavigate(3);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-purple-700 truncate max-w-[360px]">
                          {conv.last_message || "Chat conversation"}
                        </div>
                        <div className="text-[11px] text-slate-500">Status: {conv.status} • Channel: {conv.channel}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-purple-700 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      Go to Chat <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflows */}
          {results.workflows.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Automations & Workflows
              </div>
              <div className="space-y-1 mt-1">
                {results.workflows.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => {
                      onNavigate(19);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-700">{wf.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[360px]">{wf.description}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-indigo-700 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      Open Builder <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Tip */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">K</kbd> anywhere</span>
            <span>•</span>
            <span>Instant GHL Search Across CRM</span>
          </div>
          <button onClick={onClose} className="hover:text-slate-800 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}
