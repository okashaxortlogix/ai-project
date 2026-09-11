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
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

interface Screen7LeadsProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen7Leads({ onNavigate, isCompact = false }: Screen7LeadsProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("Website Chat");
  const [newStatus, setNewStatus] = useState("New");

  const loadLeads = async () => {
    try {
      const res = await api.getLeads(filter, search);
      if (res.success && res.data && res.data.length > 0) {
        setLeads(res.data);
      } else {
        // Fallback default leads if db empty
        setLeads([
          { id: "1", name: "Sarah Ahmed", email: "sarah@gmail.com", phone: "+1 (555) 234-8901", source: "Live Chat", status: "Qualified", agent: "Appointment Agent", lastActivity: "10 mins ago" },
          { id: "2", name: "Ali Raza", email: "ali.raza@acme.com", phone: "+1 (555) 789-1234", source: "Website Funnel", status: "Contacted", agent: "Sales Agent", lastActivity: "45 mins ago" },
          { id: "3", name: "Fatima Khan", email: "fatima@acme.com", phone: "+1 (555) 456-7890", source: "Shopify Store", status: "Converted", agent: "Support Agent", lastActivity: "2 hours ago" },
          { id: "4", name: "Usman Tariq", email: "usman@gmail.com", phone: "+1 (555) 890-4321", source: "Inbound SMS", status: "New", agent: "Sales Agent", lastActivity: "4 hours ago" },
          { id: "5", name: "Ayesha Malik", email: "ayesha@tech.com", phone: "+1 (555) 321-6549", source: "Facebook Ad", status: "Lost", agent: "Sales Agent", lastActivity: "1 day ago" }
        ]);
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

  const handleUpdateStatus = async (leadId: string, newStat: string) => {
    try {
      await api.updateLead(leadId, { status: newStat });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStat } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, status: newStat }));
      }
    } catch (e) {
      console.error("Failed to update lead status", e);
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newL = {
      id: `lead-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone || "+1 (555) 000-0000",
      source: newSource,
      status: newStatus,
      agent: "Sales Agent",
      lastActivity: "Just now"
    };

    setLeads((prev) => [newL, ...prev]);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setIsAddLeadModalOpen(false);
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Email,Phone,Source,Status,Agent,LastActivity", ...leads.map((l) => `${l.name},${l.email},${l.phone},${l.source},${l.status},${l.agent || "Sales Agent"},${l.lastActivity || "Today"}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ghl_leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filter === "All" || l.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

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
          <span className="text-slate-800 font-semibold">Leads Management</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Leads Management CRM
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track, qualify, and manage leads captured across all conversational channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddLeadModalOpen(true)}
            >
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          {["All", "New", "Qualified", "Contacted", "Converted", "Lost"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === st
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* CRM Table */}
      <Card className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="p-3 pl-4">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Last Activity</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No leads matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLead(l)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3 pl-4 font-bold text-slate-900">{l.name}</td>
                    <td className="p-3 text-slate-600">{l.email}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{l.phone}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {l.source}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        variant={
                          l.status === "Qualified" || l.status === "Converted"
                            ? "active"
                            : l.status === "Lost"
                            ? "error"
                            : "connected"
                        }
                        label={l.status}
                      />
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{l.agent || "Sales Agent"}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{l.lastActivity || "Today"}</td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(l);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        title="Add New Lead"
        description="Create a lead profile in GoHighLevel CRM."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsAddLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateLead}>
              Save Lead
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Hamza Ali"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="hamza@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              placeholder="+1 (555) 123-4567"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="Website Chat">Website Chat</option>
                <option value="Shopify Store">Shopify Store</option>
                <option value="Inbound SMS">Inbound SMS</option>
                <option value="Facebook Ad">Facebook Ad</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Contacted">Contacted</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* View/Edit Lead Modal */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={`Lead Profile: ${selectedLead.name}`}
          description={`Captured via ${selectedLead.source}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
                  setSelectedLead(null);
                }}
              >
                Delete Lead
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-900">{selectedLead.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Agent:</span>
                <span className="font-semibold text-slate-900">{selectedLead.agent || "Sales Agent"}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Change Pipeline Status
              </label>
              <div className="flex flex-wrap gap-2">
                {["New", "Qualified", "Contacted", "Converted", "Lost"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selectedLead.id, s)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer border ${
                      selectedLead.status === s
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
