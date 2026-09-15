"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Plus,
  ArrowDown,
  ArrowRight,
  Mail,
  Phone,
  Tag,
  DollarSign,
  CheckSquare,
  Clock,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  History,
  Workflow as WorkflowIcon,
  Zap,
  Sliders,
  Send,
  Eye,
  Settings,
  Bot
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { Workflow, WorkflowExecution, initialWorkflows, initialWorkflowExecutions } from "@/lib/data";

interface Screen19WorkflowsProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen19Workflows({
  onNavigate,
  isCompact = false
}: Screen19WorkflowsProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("wf-1");
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialWorkflowExecutions);
  const [activeTab, setActiveTab] = useState<"builder" | "history" | "templates">("builder");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testContactName, setTestContactName] = useState("Sarah Johnson");
  const [testContactEmail, setTestContactEmail] = useState("sarah@company.com");
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [testResult, setTestResult] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(false);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const [wfRes, execRes] = await Promise.all([
        api.getWorkflows(),
        api.getWorkflows('executions')
      ]);
      if (wfRes && wfRes.success && Array.isArray(wfRes.data) && wfRes.data.length > 0) {
        setWorkflows(wfRes.data);
        if (!activeWorkflowId || activeWorkflowId === "wf-1") {
          setActiveWorkflowId(wfRes.data[0].id);
        }
      }
      if (execRes && execRes.success && Array.isArray(execRes.data)) {
        setExecutions(execRes.data);
      }
    } catch (err) {
      console.error("Failed to load workflows", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const handleToggleActive = (wfId: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wfId ? { ...w, isActive: !w.isActive } : w))
    );
  };

  const handleRunTestExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingTest(true);

    try {
      const res = await api.executeWorkflow(activeWorkflow.id, {
        name: testContactName,
        email: testContactEmail
      });

      if (res && res.success && res.data) {
        setTestResult(res.data);
        setExecutions([res.data, ...executions]);
      }
    } catch (e) {
      console.error("Test execution failed", e);
    } finally {
      setIsExecutingTest(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              GHL Automation Core
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Triggers, Conditions, Actions & Delay Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Workflow Automation Builder
          </h1>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "builder" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Visual Builder
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Execution Logs ({executions.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setTestResult(null);
              setIsTestModalOpen(true);
            }}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-purple-600" />
            <span>Test Run Simulator</span>
          </Button>
        </div>
      </div>

      {/* Main Builder & Workflow Switcher Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Workflows List (Col Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Active Workflows ({workflows.length})</span>
            <span className="text-blue-600 font-semibold cursor-pointer">+ New</span>
          </div>

          <div className="space-y-2.5">
            {workflows.map((wf) => {
              const isSelected = wf.id === activeWorkflowId;
              return (
                <div
                  key={wf.id}
                  onClick={() => setActiveWorkflowId(wf.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-purple-500 shadow-md ring-1 ring-purple-500"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 leading-snug">
                      {wf.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(wf.id);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        wf.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {wf.isActive ? "ACTIVE" : "PAUSED"}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {wf.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Enrolled: <strong>{wf.totalEnrolled}</strong></span>
                    <span className="text-emerald-600 font-semibold">{wf.successRate}% Success</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Visual Canvas or Execution History (Col Span 8) */}
        <div className="col-span-12 lg:col-span-8">
          
          {activeTab === "builder" ? (
            /* Visual Interactive Workflow Canvas */
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              
              {/* Canvas Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 bg-white -m-6 p-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{activeWorkflow.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activeWorkflow.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                    {activeWorkflow.nodes?.length || 4} Steps
                  </span>
                </div>
              </div>

              {/* Step 1: Trigger Node */}
              <div className="max-w-md mx-auto space-y-4">
                
                {/* TRIGGER NODE */}
                <div className="bg-white rounded-2xl border-2 border-purple-400 p-4 shadow-sm relative text-center">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto -mt-8 mb-2 shadow-sm">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    TRIGGER
                  </span>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    {activeWorkflow.trigger?.label || "New Lead Created / Form Submitted"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Fires automatically on website chat submission or inbound lead
                  </p>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center text-slate-400">
                  <ArrowDown className="w-5 h-5 animate-pulse text-purple-400" />
                </div>

                {/* Step 2: CONDITION / BRANCHING NODE */}
                <div className="bg-white rounded-2xl border-2 border-blue-400 p-4 shadow-sm relative text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto -mt-8 mb-2 shadow-sm">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    QUALIFICATION CONDITION
                  </span>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    Lead Score &gt; 70? (High Intent)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Branches between immediate sales push vs nurture sequence
                  </p>
                </div>

                {/* Branching Split */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  
                  {/* YES BRANCH (High Intent) */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>YES (Score &gt; 70)</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-[11px] shadow-2xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Create Opportunity
                      </div>
                      <div className="text-slate-500 mt-0.5">$5,000 in Qualified Stage</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-[11px] shadow-2xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600" /> Instant Twilio SMS
                      </div>
                      <div className="text-slate-500 mt-0.5">"Hi, let's schedule your 1-on-1 demo!"</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-[11px] shadow-2xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Create SDR Call Task
                      </div>
                      <div className="text-slate-500 mt-0.5">Assigned to Sarah Wilson (Urgent)</div>
                    </div>
                  </div>

                  {/* NO BRANCH (Nurture) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>NO (Score &le; 70)</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-600" /> Add Tag "Nurture"
                      </div>
                      <div className="text-slate-500 mt-0.5">Tag applied to contact record</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-purple-600" /> Welcome Value Email
                      </div>
                      <div className="text-slate-500 mt-0.5">5-day introductory series</div>
                    </div>
                  </div>

                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center text-slate-400">
                  <ArrowDown className="w-5 h-5 text-purple-400" />
                </div>

                {/* GOAL ACHIEVED */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    GOAL
                  </span>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    Demo Booked / Deal Advanced
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Live Execution Logs View */
            <Card className="border-slate-200 p-5 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" /> Workflow Execution Logs
                </h3>
                <span className="text-xs text-slate-500">Auto-logged on every trigger</span>
              </div>

              <div className="space-y-3">
                {executions.map((exec) => (
                  <div key={exec.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{exec.contactName}</span>
                        <span className="text-slate-400 font-normal">({exec.contactEmail})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                        {exec.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-purple-700 font-semibold mb-2">
                      Workflow: {exec.workflowName}
                    </div>

                    {/* Step logs */}
                    <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600">
                      {exec.logs?.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-slate-400">{l.timestamp}</span>
                          <span className="font-bold text-blue-600">[{l.step}]</span>
                          <span>{l.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

      </div>

      {/* Test Execution Simulator Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Workflow Engine Simulator"
      >
        <form onSubmit={handleRunTestExecution} className="space-y-4 text-xs">
          <p className="text-slate-600 text-xs leading-relaxed">
            Simulate an incoming contact trigger for <strong>{activeWorkflow.name}</strong> to test condition checks, opportunity creation, and follow-up dispatches.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Test Contact Name</label>
            <input
              type="text"
              required
              value={testContactName}
              onChange={(e) => setTestContactName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Test Contact Email</label>
            <input
              type="email"
              required
              value={testContactEmail}
              onChange={(e) => setTestContactEmail(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {testResult && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Test Execution Succeeded!
              </div>
              <p className="text-[11px]">Workflow completed all actions in 12ms. Execution record added to audit logs.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsTestModalOpen(false)}>
              Close
            </Button>
            <Button type="submit" variant="primary" disabled={isExecutingTest} className="bg-purple-600 hover:bg-purple-700">
              {isExecutingTest ? "Executing Steps..." : "Trigger Test Workflow"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
