"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Flame,
  Star,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  ExternalLink,
  Plus
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen7LeadsProps {
  onSelectLead?: (lead: any) => void;
  isCompact?: boolean;
}

export default function Screen7Leads({ onSelectLead, isCompact = false }: Screen7LeadsProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [activeLeadModal, setActiveLeadModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    try {
      const res = await api.getLeads(filter, search);
      if (res.success && res.data) {
        setLeads(res.data);
      }
    } catch (e) {
      console.error("Failed to load leads from API", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filter, search]);

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      await loadLeads();
      if (activeLeadModal && activeLeadModal.id === leadId) {
        setActiveLeadModal((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error("Failed to update lead status", e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hot":
        return "bg-red-100 text-red-700 border-red-200";
      case "Qualified":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Contacted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "New":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Email,Phone,Source,Status,Score", ...leads.map((l) => `${l.name},${l.email},${l.phone},${l.source},${l.status},${l.score}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Leads Management</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {leads.length} Persistent Leads (API)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-tenant lead scoring & automated intent qualification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 my-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["All", "New", "Contacted", "Qualified", "Hot"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === f
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Source</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => setActiveLeadModal(lead)}
                className="hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block truncate">
                        {lead.name}
                      </span>
                      {lead.company && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {lead.company}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]">
                  {lead.email}
                </td>

                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                  {lead.phone}
                </td>

                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                    {lead.source}
                  </span>
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                      lead.status
                    )}`}
                  >
                    {lead.status === "Hot" && <Flame className="w-2.5 h-2.5 mr-1 fill-red-500 text-red-500" />}
                    {lead.status}
                  </span>
                </td>

                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          lead.score >= 80
                            ? "bg-red-500"
                            : lead.score >= 60
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${lead.score}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {lead.score}
                    </span>
                  </div>
                </td>

                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLeadModal(lead);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail & Scoring Breakdown Modal */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeLeadModal.avatar}
                  alt={activeLeadModal.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{activeLeadModal.name}</h4>
                  <p className="text-[11px] text-slate-400">{activeLeadModal.company || "Independent Buyer"}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveLeadModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Lead Score</span>
                  <div className="text-xl font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    {activeLeadModal.score}/100
                    <span className="text-[10px] font-semibold text-emerald-600 px-1.5 py-0.2 bg-emerald-50 rounded">
                      High Intent
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Stage</span>
                  <div className="mt-1 flex items-center gap-1">
                    {["New", "Contacted", "Qualified", "Hot"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(activeLeadModal.id, st)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                          activeLeadModal.status === st ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeLeadModal.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeLeadModal.phone}</span>
                </div>
              </div>

              {/* Scoring Factors */}
              <div>
                <div className="font-semibold text-slate-800 mb-1.5">AI Scoring Breakdown:</div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>• High buying intent detected in conversation</span>
                    <span className="font-semibold text-emerald-600">+35 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Budget confirmed ($800+)</span>
                    <span className="font-semibold text-emerald-600">+25 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Appointment booked with Sales Agent</span>
                    <span className="font-semibold text-emerald-600">+25 pts</span>
                  </div>
                </div>
              </div>

              {activeLeadModal.notes && (
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900">
                  <strong>Notes:</strong> {activeLeadModal.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveLeadModal(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Assigned ${activeLeadModal.name} to Sales Director.`);
                  setActiveLeadModal(null);
                }}
                className="px-3 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Assign Representative
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
