"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  Edit2,
  UserCheck,
  ChevronRight,
  Flame,
  Star,
  Briefcase,
  Tag,
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight,
  CheckSquare
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import Contact360Drawer from "@/components/Contact360Drawer";
import { api } from "@/lib/api";
import { initialSmartLists } from "@/lib/data";

interface Screen7LeadsProps {
  onNavigate?: (screen: number) => void;
  onOpenContact360Direct?: (contact: any) => void;
  isCompact?: boolean;
}

export default function Screen7Leads({
  onNavigate,
  onOpenContact360Direct,
  isCompact = false
}: Screen7LeadsProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [activeSmartList, setActiveSmartList] = useState<string>("list-all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [is360Open, setIs360Open] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("Website Chat");
  const [newStatus, setNewStatus] = useState("New");
  const [newScore, setNewScore] = useState("85");
  const [newCompany, setNewCompany] = useState("Apex Global Logistics");

  const loadLeads = async () => {
    try {
      const res = await api.getLeads(filter, search);
      if (res && res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
      }
    } catch (e) {
      console.error("Failed to load leads from API", e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filter, search]);

  const handleOpen360 = (lead: any) => {
    setSelectedLead(lead);
    setIs360Open(true);
    if (onOpenContact360Direct) {
      onOpenContact360Direct(lead);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (actionName: string) => {
    setBulkActionSuccess(`Applied bulk action: "${actionName}" to ${selectedLeadIds.length} contact records.`);
    setTimeout(() => setBulkActionSuccess(null), 3000);
    setSelectedLeadIds([]);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      const res = await api.createLead({
        name: newName,
        email: newEmail,
        phone: newPhone || "",
        company: newCompany,
        source: newSource,
        status: newStatus,
        score: Number(newScore) || 75,
      });
      if (res && res.data) {
        setLeads((prev) => [res.data, ...prev]);
      } else {
        await loadLeads();
      }
    } catch (err) {
      console.error("Failed to create lead", err);
      // Fallback local addition
      const newL = {
        id: `lead-${Date.now()}`,
        name: newName,
        email: newEmail,
        phone: newPhone || "+1 (555) 000-0000",
        company: newCompany,
        source: newSource,
        status: newStatus,
        score: Number(newScore) || 75,
        tags: ["Hot Lead", "Inbound"],
        agent: "Sales Agent",
        lastActivity: "Just now"
      };
      setLeads((prev) => [newL, ...prev]);
    }

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setIsAddLeadModalOpen(false);
  };

  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api.deleteLead(id);
    } catch (err) {
      console.error("Failed to delete lead from API", err);
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Name,Email,Phone,Company,Source,Status,Score",
        ...leads.map(
          (l) =>
            `${l.name},${l.email},${l.phone},${l.company || ""},${l.source},${l.status},${l.score || 70}`
        )
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "crm_contacts_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    // Smart list filtering
    if (activeSmartList === "list-hot" && (l.score || 0) < 70) return false;
    if (activeSmartList === "list-vip" && !l.tags?.includes("VIP") && !l.company?.includes("Apex") && !l.company?.includes("Solaris")) return false;
    
    // Status filter
    const matchesFilter = filter === "All" || l.status?.toLowerCase() === filter.toLowerCase();
    
    // Search filter
    const matchesSearch =
      search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase())) ||
      (l.phone && l.phone.includes(search));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      
      {/* Top Universal Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              GHL Contact Hub
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Single Customer Workspace & Dynamic Smart Lists</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Contacts & Lead 360 CRM
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddLeadModalOpen(true)}
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Smart Lists Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {initialSmartLists.map((sList) => {
          const isSelected = activeSmartList === sList.id;
          return (
            <button
              key={sList.id}
              onClick={() => setActiveSmartList(sList.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {sList.id === "list-hot" && <Flame className="w-3.5 h-3.5 text-amber-300" />}
              {sList.id === "list-opps" && <Briefcase className="w-3.5 h-3.5 text-blue-300" />}
              {sList.id === "list-vip" && <Star className="w-3.5 h-3.5 text-yellow-300" />}
              {sList.id === "list-all" && <Users className="w-3.5 h-3.5" />}
              <span>{sList.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk Action Alert Message */}
      {bulkActionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkActionSuccess}</span>
        </div>
      )}

      {/* Bulk Actions Floating Bar (When items selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center justify-between gap-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-blue-600 px-2 py-0.5 rounded text-white font-bold">{selectedLeadIds.length}</span>
            <span>contacts selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkAction("Add Tag: 'Hot Lead'")}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              + Tag
            </button>
            <button
              onClick={() => handleBulkAction("Assign to Sarah Wilson")}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              Assign Rep
            </button>
            <button
              onClick={() => handleBulkAction("Enroll in Speed-to-Lead Workflow")}
              className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-xs font-medium cursor-pointer transition-colors"
            >
              ⚡ Enroll in Workflow
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-xs text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search & Secondary Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          {["All", "New", "Qualified", "Contacted", "Won", "Lost"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filter === st
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts, company, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* CRM Contact 360 Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5 pl-4 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Contact Name</th>
                <th className="p-3.5">Company</th>
                <th className="p-3.5">Lead Score</th>
                <th className="p-3.5">Email & Phone</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 text-xs">
                    No contacts matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => {
                  const isSelected = selectedLeadIds.includes(l.id);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => handleOpen360(l)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${
                        isSelected ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <td className="p-3.5 pl-4" onClick={(e) => handleToggleSelectOne(l.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {l.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{l.source || "Website Inbound"}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {l.company || "Apex Global Logistics"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            (l.score || 75) >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {l.score || 75}/100
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-700">{l.email}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{l.phone || "+1 234 567 8901"}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(l.tags || ["Hot Lead", "Inbound"]).slice(0, 2).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge
                          variant={
                            l.status === "Qualified" || l.status === "Won"
                              ? "active"
                              : l.status === "Lost"
                              ? "error"
                              : "connected"
                          }
                          label={l.status || "New"}
                        />
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-blue-600 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen360(l);
                            }}
                          >
                            Contact 360 <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                          <button
                            type="button"
                            title="Delete contact"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={(e) => handleDeleteLead(l.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Global Contact 360 Workspace Drawer */}
      <Contact360Drawer
        contact={selectedLead}
        isOpen={is360Open}
        onClose={() => setIs360Open(false)}
        onNavigateScreen={onNavigate}
      />

      {/* Create Lead Modal */}
      <Modal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        title="Add New Contact Record"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Johnson"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="sarah@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 234 567 8901"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company</label>
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Lead Score (0-100)</label>
              <input
                type="number"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
