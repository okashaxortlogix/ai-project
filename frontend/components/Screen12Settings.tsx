"use client";

import React, { useState } from "react";
import {
  Settings,
  Bot,
  Bell,
  Palette,
  Users,
  CheckCircle2,
  Trash2,
  UserPlus,
  RotateCcw,
  Sparkles,
  Shield,
  Cpu,
  Check,
  Edit2,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface Screen12SettingsProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Manager" | "Agent" | "Viewer";
  status: "Active" | "Invited" | "Inactive";
  lastActive: string;
}

export default function Screen12Settings({ onNavigate, isCompact = false }: Screen12SettingsProps) {
  const [activeTab, setActiveTab] = useState<"General" | "Model" | "Notifications" | "Appearance" | "Team">("General");

  // General tab state
  const [name, setName] = useState("Nexa AI");
  const [email, setEmail] = useState("okasha@company.com");
  const [timezone, setTimezone] = useState("(GMT+5:00) Pakistan Standard Time");
  const [language, setLanguage] = useState("English");
  const [saveToast, setSaveToast] = useState(false);

  // Model tab state
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-pro");

  // Notifications tab state
  const [notifications, setNotifications] = useState({
    conversationAlerts: true,
    workflowAlerts: true,
    connectionAlerts: true,
    actionCompletion: false
  });

  // Appearance tab state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");

  // Team tab state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Okasha", email: "okasha@company.com", role: "Administrator", status: "Active", lastActive: "Just now" },
    { id: "2", name: "Sarah Ahmed", email: "sarah@acme.com", role: "Manager", status: "Active", lastActive: "12 mins ago" },
    { id: "3", name: "Ali Raza", email: "ali.raza@acme.com", role: "Agent", status: "Active", lastActive: "1 hour ago" },
    { id: "4", name: "Fatima Khan", email: "fatima@acme.com", role: "Viewer", status: "Invited", lastActive: "Never" }
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMember["role"]>("Agent");

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your local AI chat session history?")) {
      alert("Chat session history cleared.");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all settings to default configuration?")) {
      setName("Nexa AI");
      setEmail("okasha@company.com");
      setTimezone("(GMT+5:00) Pakistan Standard Time");
      setLanguage("English");
      setSelectedModel("gemini-1.5-pro");
      setThemeMode("light");
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setTeamMembers((prev) => [
      ...prev,
      {
        id: `team-${Date.now()}`,
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
        status: "Invited",
        lastActive: "Pending"
      }
    ]);
    setNewMemberName("");
    setNewMemberEmail("");
    setIsInviteModalOpen(false);
  };

  const handleRemoveMember = (id: string) => {
    if (confirm("Remove this team member?")) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Settings</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your preferences and application settings.
            </p>
          </div>

          {saveToast && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: "General", label: "General", icon: Settings },
          { id: "Model", label: "Model", icon: Cpu },
          { id: "Notifications", label: "Notifications", icon: Bell },
          { id: "Appearance", label: "Appearance", icon: Palette },
          { id: "Team", label: "Team", icon: Users }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "General" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                General Settings
              </h2>
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    The public name shown on web chat widgets and agent replies.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Notification Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="(GMT+5:00) Pakistan Standard Time">
                      (GMT+5:00) Pakistan Standard Time
                    </option>
                    <option value="(GMT-05:00) Eastern Time (US & Canada)">
                      (GMT-05:00) Eastern Time (US & Canada)
                    </option>
                    <option value="(GMT+00:00) UTC / London">
                      (GMT+00:00) UTC / London
                    </option>
                    <option value="(GMT+04:00) Dubai Standard Time">
                      (GMT+04:00) Dubai Standard Time
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="Urdu">Urdu (اردو)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                Quick Actions
              </h3>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs"
                icon={Trash2}
                onClick={handleClearHistory}
              >
                Clear Chat History
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs"
                icon={RotateCcw}
                onClick={handleResetDefaults}
              >
                Reset Settings
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL */}
      {activeTab === "Model" && (
        <div className="space-y-4 max-w-4xl">
          <Card className="p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              AI Foundation Models
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Select the primary LLM used to process customer inquiries, RAG knowledge lookups, and autonomous workflows.
            </p>

            <div className="space-y-3">
              {[
                {
                  id: "gemini-1.5-pro",
                  name: "Google Gemini 1.5 Pro",
                  tag: "Recommended",
                  desc: "Ultra-fast response latency, 1M context window, ideal for long document reasoning and automated GHL workflows.",
                  quota: "94% available (940k / 1M tokens/min)"
                },
                {
                  id: "gpt-4o",
                  name: "OpenAI GPT-4o",
                  tag: "High Accuracy",
                  desc: "Balanced multimodal intelligence for customer sentiment analysis and complex objection handling.",
                  quota: "82% available (410k / 500k tokens/min)"
                },
                {
                  id: "claude-3-5-sonnet",
                  name: "Anthropic Claude 3.5 Sonnet",
                  tag: "Advanced Reasoning",
                  desc: "High precision code and structured JSON extraction for GHL API payload formatting.",
                  quota: "89% available (350k / 400k tokens/min)"
                }
              ].map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.name}</span>
                        {m.tag === "Recommended" ? (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {m.tag}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-xl">{m.desc}</p>
                      <div className="text-[10px] text-slate-400 pt-1">Quota: {m.quota}</div>
                    </div>

                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === "Notifications" && (
        <Card className="p-6 max-w-2xl space-y-5">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              {
                key: "conversationAlerts" as const,
                title: "Live Conversation Alerts",
                desc: "Receive real-time notifications when a customer sends an urgent message or asks for human assistance."
              },
              {
                key: "workflowAlerts" as const,
                title: "GHL Workflow & Automation Alerts",
                desc: "Get notified when high-value opportunities change stage or appointment bookings fail."
              },
              {
                key: "connectionAlerts" as const,
                title: "Integration & Tunnel Health Alerts",
                desc: "Immediate alerts if ngrok tunnel drops or GHL API token expires."
              },
              {
                key: "actionCompletion" as const,
                title: "Autonomous Action Completion",
                desc: "Send a notification every time an AI agent completes a batch operation."
              }
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    notifications[item.key] ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                      notifications[item.key] ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: APPEARANCE */}
      {activeTab === "Appearance" && (
        <Card className="p-6 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 mb-1">
            Interface Theme
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Choose your preferred display theme. The Light Mode is the recommended production SaaS style.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "light" as const, label: "Light", desc: "Clean, crisp light SaaS palette (Recommended)" },
              { id: "dark" as const, label: "Dark", desc: "High contrast dark mode for low light" },
              { id: "system" as const, label: "System", desc: "Follow operating system theme settings" }
            ].map((theme) => {
              const isSelected = themeMode === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setThemeMode(theme.id)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{theme.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{theme.desc}</div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-3">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 5: TEAM */}
      {activeTab === "Team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace Team Members</h2>
              <p className="text-xs text-slate-500">
                Manage roles, seat allocation, and access permissions for your team.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="p-3 pl-4">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.email}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        variant={m.status === "Active" ? "active" : "neutral"}
                        label={m.status}
                      />
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{m.lastActive}</td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Add a teammate to collaborate on conversations and workflows."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddMember}>
              Send Invitation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Usman Tariq"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email
            </label>
            <input
              type="email"
              placeholder="usman@acme.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workspace Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Administrator">Administrator (Full Access)</option>
              <option value="Manager">Manager (Team & Workflow management)</option>
              <option value="Agent">Agent (Live Chat & Customer reply)</option>
              <option value="Viewer">Viewer (Read-only Analytics)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
