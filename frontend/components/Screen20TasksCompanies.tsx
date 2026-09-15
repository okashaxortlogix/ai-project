"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Building2,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  DollarSign,
  Phone,
  Globe,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { Task, Company, initialTasks, initialCompanies } from "@/lib/data";

interface Screen20TasksCompaniesProps {
  onNavigate?: (screen: number) => void;
  onOpenContact360?: (contact: any) => void;
  isCompact?: boolean;
}

export default function Screen20TasksCompanies({
  onNavigate,
  onOpenContact360,
  isCompact = false
}: Screen20TasksCompaniesProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "companies">("tasks");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

  // New Task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Sarah Wilson");
  const [newTaskContact, setNewTaskContact] = useState("Sarah Johnson");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("high");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2025-05-02");

  // New Company state
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("Software & Technology");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("https://example.com");
  const [newCompanyPhone, setNewCompanyPhone] = useState("+1 (555) 000-0000");

  const loadData = async () => {
    try {
      const [taskRes, compRes] = await Promise.all([
        api.getTasks(),
        api.getCompanies()
      ]);
      if (taskRes && taskRes.success && Array.isArray(taskRes.data)) {
        setTasks(taskRes.data);
      }
      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        setCompanies(compRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
    );

    try {
      await api.updateTask(taskId, { status: nextStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskObj: Task = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle,
      assignedTo: newTaskAssignee,
      contactName: newTaskContact,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    setTasks([taskObj, ...tasks]);
    setIsAddTaskModalOpen(false);

    try {
      await api.createTask({
        title: newTaskTitle,
        assigned_to: newTaskAssignee,
        contact_name: newTaskContact,
        due_date: newTaskDueDate,
        priority: newTaskPriority
      });
    } catch (e) {
      console.error(e);
    }

    setNewTaskTitle("");
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const compObj: Company = {
      id: `comp-${Date.now()}`,
      name: newCompanyName,
      industry: newCompanyIndustry,
      website: newCompanyWebsite,
      phone: newCompanyPhone,
      address: "100 Enterprise Way",
      contactCount: 1,
      totalDealValue: 15000,
      openDealsCount: 1,
      owner: "Sarah Wilson",
      createdAt: new Date().toISOString()
    };

    setCompanies([compObj, ...companies]);
    setIsAddCompanyModalOpen(false);

    try {
      await api.createCompany({
        name: newCompanyName,
        industry: newCompanyIndustry,
        website: newCompanyWebsite,
        phone: newCompanyPhone
      });
    } catch (e) {
      console.error(e);
    }

    setNewCompanyName("");
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "pending" && t.status === "completed") return false;
    if (taskFilter === "completed" && t.status !== "completed") return false;
    if (taskFilter === "urgent" && t.priority !== "urgent") return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.contactName && t.contactName.toLowerCase().includes(q)) ||
      t.assignedTo.toLowerCase().includes(q)
    );
  });

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.owner.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Operations & Accounts
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">GHL Task Matrix & Company CRM</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Tasks & Company Accounts
          </h1>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tasks" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("companies")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "companies" ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Companies ({companies.length})
            </button>
          </div>

          {activeTab === "tasks" ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddTaskModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: TASKS MATRIX VIEW */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks by title, contact, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {["all", "pending", "urgent", "completed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setTaskFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                    taskFilter === st ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List Table */}
          <Card className="border-slate-200 overflow-hidden bg-white shadow-xs">
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                      isCompleted ? "opacity-60 bg-slate-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleTaskStatus(t.id, t.status)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-blue-500 text-transparent"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <div>
                        <div
                          className={`text-xs font-bold text-slate-900 ${
                            isCompleted ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Due: <strong className="text-slate-700">{t.dueDate || (t as any).due_date}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Assigned: <strong className="text-slate-700">{t.assignedTo || (t as any).assigned_to}</strong>
                          </span>
                          {t.contactName && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-semibold">{t.contactName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.priority === "urgent"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : t.priority === "high"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.priority}
                      </span>
                      {t.contactName && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                          onClick={() => {
                            if (onOpenContact360) {
                              onOpenContact360({ name: t.contactName, email: "sarah@company.com" });
                            }
                          }}
                        >
                          360 View
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tasks matching the selected filters.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: COMPANIES DIRECTORY VIEW */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((c) => (
              <Card key={c.id} className="p-5 border-slate-200 bg-white hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ${(c.totalDealValue || (c as any).total_deal_value || 0).toLocaleString()} Pipeline
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{c.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-3">{c.industry}</p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</span>
                    <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      {c.website.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Contacts</span>
                    <span className="font-semibold text-slate-800">{c.contactCount || (c as any).contact_count || 1} linked records</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Open Deals</span>
                    <span className="font-bold text-blue-600">{c.openDealsCount || (c as any).open_deals_count || 0} active</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Owner: {c.owner}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => onNavigate && onNavigate(18)}
                  >
                    View Deals
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Create Follow-up CRM Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Send updated pricing proposal to Sarah"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option>Sarah Wilson</option>
                <option>John Doe</option>
                <option>Mike Johnson</option>
                <option>Emily Davis</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Associated Contact</label>
              <input
                type="text"
                value={newTaskContact}
                onChange={(e) => setNewTaskContact(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Company Modal */}
      <Modal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        title="Add Company Account"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global Logistics"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Industry</label>
              <select
                value={newCompanyIndustry}
                onChange={(e) => setNewCompanyIndustry(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option>Software & Technology</option>
                <option>Healthcare & Clinics</option>
                <option>Supply Chain & Logistics</option>
                <option>Real Estate & Property</option>
                <option>E-commerce & Retail</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={newCompanyPhone}
                onChange={(e) => setNewCompanyPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Website URL</label>
            <input
              type="url"
              value={newCompanyWebsite}
              onChange={(e) => setNewCompanyWebsite(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Company
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
