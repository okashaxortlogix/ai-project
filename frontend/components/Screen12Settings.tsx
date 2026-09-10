"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  Users,
  CreditCard,
  Shield,
  UserPlus,
  Save,
  CheckCircle2,
  Mail,
  Clock,
  Trash2,
  X
} from "lucide-react";
import { teamMembersList, TeamMember } from "@/lib/data";

interface Screen12SettingsProps {
  isCompact?: boolean;
}

export default function Screen12Settings({ isCompact = false }: Screen12SettingsProps) {
  const [activeTab, setActiveTab] = useState<"General" | "Users" | "Billing" | "Security">("General");
  const [orgName, setOrgName] = useState("Acme Store");
  const [companyEmail, setCompanyEmail] = useState("admin@acme.com");
  const [timezone, setTimezone] = useState("UTC-05:00 (Eastern Time US & Canada)");
  const [members, setMembers] = useState<TeamMember[]>(teamMembersList);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMember["role"]>("Agent");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newM: TeamMember = {
      id: `team-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      status: "invited"
    };

    setMembers((prev) => [...prev, newM]);
    setNewMemberName("");
    setNewMemberEmail("");
    setIsInviteOpen(false);
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Settings & User Management</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise workspace rules, team permissions, and credentials
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Changes saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-3">
        {(["General", "Users", "Billing", "Security"] as const).map((tab) => (
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

      {/* Settings Body: 2 Columns (Org Details + Team Members) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        {/* Left Form: Organization Details */}
        <form onSubmit={handleSave} className="lg:col-span-6 space-y-3">
          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 mb-2">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Organization Details</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Time Zone
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="UTC-05:00 (Eastern Time US & Canada)">
                  UTC-05:00 (Eastern Time US & Canada)
                </option>
                <option value="UTC-08:00 (Pacific Time US & Canada)">
                  UTC-08:00 (Pacific Time US & Canada)
                </option>
                <option value="UTC+00:00 (London, Dublin, Lisbon)">
                  UTC+00:00 (London, Dublin, Lisbon)
                </option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-2 px-4 bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Right Section: Team Members Table */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Team Members</span>
              </div>

              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-blue-600" />
                <span>Invite Member</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-none">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        member.role === "Admin"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : member.role === "Manager"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Invite Team Member
              </h4>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Vance"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="david@company.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as TeamMember["role"])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Agent">Agent</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
