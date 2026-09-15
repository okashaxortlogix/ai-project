"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Plus,
  Filter,
  Layers,
  Kanban,
  List as ListIcon,
  Search,
  MoreVertical,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { Opportunity, Pipeline, initialPipelines, initialOpportunities } from "@/lib/data";

interface Screen18OpportunitiesProps {
  onNavigate?: (screen: number) => void;
  onOpenContact360?: (contact: any) => void;
  isCompact?: boolean;
}

export default function Screen18Opportunities({
  onNavigate,
  onOpenContact360,
  isCompact = false
}: Screen18OpportunitiesProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [activePipelineId, setActivePipelineId] = useState<string>("pipe-sales");
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Opportunity Form state
  const [newTitle, setNewTitle] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newCompany, setNewCompany] = useState("Apex Global Logistics");
  const [newValue, setNewValue] = useState("15000");
  const [newStage, setNewStage] = useState("stg-new");
  const [newProbability, setNewProbability] = useState("50");
  const [newOwner, setNewOwner] = useState("Sarah Wilson");

  const loadData = async () => {
    setLoading(true);
    try {
      const [pipeRes, oppRes] = await Promise.all([
        api.getPipelines(),
        api.getOpportunities(activePipelineId)
      ]);
      if (pipeRes && pipeRes.success && Array.isArray(pipeRes.data) && pipeRes.data.length > 0) {
        setPipelines(pipeRes.data);
      }
      if (oppRes && oppRes.success && Array.isArray(oppRes.data)) {
        setOpportunities(oppRes.data);
      }
    } catch (e) {
      console.error("Failed to load pipelines/opportunities", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePipelineId]);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0] || initialPipelines[0];

  // Pipeline summary statistics
  const filteredOpps = opportunities.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.title.toLowerCase().includes(q) ||
      o.contactName.toLowerCase().includes(q) ||
      (o.companyName && o.companyName.toLowerCase().includes(q))
    );
  });

  const totalValue = filteredOpps.reduce((acc, o) => acc + (Number(o.value) || 0), 0);
  const weightedValue = filteredOpps.reduce(
    (acc, o) => acc + (Number(o.value) || 0) * ((Number(o.probability) || 50) / 100),
    0
  );
  const wonCount = filteredOpps.filter((o) => o.status === "won" || o.stageId === "stg-won").length;
  const winRate = filteredOpps.length > 0 ? Math.round((wonCount / filteredOpps.length) * 100) : 0;

  const handleStageChange = async (oppId: string, targetStageId: string) => {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;

    const newStatus = targetStageId === "stg-won" ? "won" : targetStageId === "stg-lost" ? "lost" : "open";
    
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stageId: targetStageId, status: newStatus } : o))
    );

    try {
      await api.updateOpportunity(oppId, { stage_id: targetStageId, status: newStatus });
    } catch (e) {
      console.error("Failed to update opportunity stage", e);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContactName.trim()) return;

    const newOppPayload: Partial<Opportunity> = {
      id: `opp-${Date.now()}`,
      title: newTitle,
      pipelineId: activePipelineId,
      stageId: newStage,
      contactName: newContactName,
      contactEmail: newContactEmail || `${newContactName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      companyName: newCompany,
      value: Number(newValue) || 10000,
      probability: Number(newProbability) || 50,
      owner: newOwner,
      source: "Direct Web Inbound",
      tags: ["High Priority", "New Deal"],
      status: newStage === "stg-won" ? "won" : "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOpportunities([newOppPayload as Opportunity, ...opportunities]);
    setIsAddModalOpen(false);

    try {
      await api.createOpportunity({
        title: newTitle,
        pipeline_id: activePipelineId,
        stage_id: newStage,
        contact_name: newContactName,
        contact_email: newContactEmail,
        company_name: newCompany,
        value: Number(newValue) || 10000,
        probability: Number(newProbability) || 50,
        owner: newOwner
      });
    } catch (e) {
      console.error("Failed to save opportunity", e);
    }

    setNewTitle("");
    setNewContactName("");
    setNewContactEmail("");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      
      {/* Top Banner / Pipeline Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              GHL Sales & CRM
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Deal Forecasting & Multi-Pipeline</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Opportunities & Pipelines
          </h1>
        </div>

        {/* Pipeline Selector + Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={activePipelineId}
              onChange={(e) => setActivePipelineId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "kanban" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Opportunity</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Total Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Across {filteredOpps.length} active opportunities
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Weighted Revenue (Forecast)</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">
            ${Math.round(weightedValue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Based on stage win probabilities
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Pipeline Win Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {winRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {wonCount} deals won this cycle
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Average Deal Size</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${filteredOpps.length > 0 ? Math.round(totalValue / filteredOpps.length).toLocaleString() : "0"}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            Enterprise tier standard
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals by contact, company, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Stages ({activePipeline.stages.length})</span>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD VIEW */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start overflow-x-auto pb-4">
          {activePipeline.stages.map((stage) => {
            const stageOpps = filteredOpps.filter(
              (o) => o.stageId === stage.id || (!o.stageId && stage.id === "stg-new")
            );
            const stageTotal = stageOpps.reduce((acc, o) => acc + (Number(o.value) || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-100/90 rounded-xl border border-slate-200/90 flex flex-col min-w-[240px] max-w-[320px] shadow-2xs"
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color || "#3B82F6" }}
                      />
                      <h3 className="font-bold text-xs text-slate-900 truncate">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {stageOpps.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="font-semibold text-emerald-700">${stageTotal.toLocaleString()}</span>
                    <span>{stage.probability}% Win Prob</span>
                  </div>
                </div>

                {/* Stage Cards Container */}
                <div className="p-2 space-y-2.5 min-h-[320px] max-h-[640px] overflow-y-auto">
                  {stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:shadow-md transition-all hover:border-blue-300 group cursor-pointer"
                      onClick={() => {
                        if (onOpenContact360) {
                          onOpenContact360({
                            id: opp.contactId || "cust-1",
                            name: opp.contactName,
                            email: opp.contactEmail,
                            company: opp.companyName,
                            tags: opp.tags
                          });
                        }
                      }}
                    >
                      {/* Deal Title */}
                      <div className="font-bold text-xs text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {opp.title}
                      </div>

                      {/* Contact & Company */}
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">{opp.contactName}</span>
                        {opp.companyName && <span>• {opp.companyName}</span>}
                      </div>

                      {/* Value & Probability */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-emerald-700">
                          ${Number(opp.value || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {opp.owner}
                        </span>
                      </div>

                      {/* Stage Move Controls */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-400">Move:</span>
                        <div className="flex items-center gap-1">
                          {activePipeline.stages
                            .filter((s) => s.id !== stage.id)
                            .slice(0, 2)
                            .map((target) => (
                              <button
                                key={target.id}
                                onClick={() => handleStageChange(opp.id, target.id)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                              >
                                → {target.name.slice(0, 8)}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageOpps.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      No deals in stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: LIST / TABLE VIEW */
        <Card className="border-slate-200 overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Opportunity Title</th>
                  <th className="px-4 py-3">Contact / Company</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Deal Value</th>
                  <th className="px-4 py-3">Win Prob</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpps.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {opp.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{opp.contactName}</div>
                      <div className="text-[11px] text-slate-400">{opp.companyName || opp.contactEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {opp.stageId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700 text-sm">
                      ${Number(opp.value || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-semibold">
                      {opp.probability || 50}%
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {opp.owner}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (onOpenContact360) {
                            onOpenContact360({
                              id: opp.contactId || "cust-1",
                              name: opp.contactName,
                              email: opp.contactEmail,
                              company: opp.companyName,
                              tags: opp.tags
                            });
                          }
                        }}
                      >
                        Contact 360
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New CRM Opportunity"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Opportunity / Deal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise AI Bot Annual Package"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="John Smith"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                placeholder="john@company.com"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Deal Value ($ USD) *</label>
              <input
                type="number"
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Initial Pipeline Stage</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                {activePipeline.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Associated Company</label>
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Opportunity Owner</label>
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option>Sarah Wilson</option>
                <option>John Doe</option>
                <option>Mike Johnson</option>
                <option>Emily Davis</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Opportunity
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
