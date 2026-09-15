"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Building2,
  Tag,
  Calendar,
  DollarSign,
  CheckSquare,
  Clock,
  MessageSquare,
  FileText,
  UserCheck,
  Plus,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { ActivityTimelineEvent, Opportunity, Task } from "@/lib/data";

interface Contact360DrawerProps {
  contact: any | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateScreen?: (screen: number) => void;
}

export default function Contact360Drawer({
  contact,
  isOpen,
  onClose,
  onNavigateScreen
}: Contact360DrawerProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "tasks" | "deals">("timeline");
  const [timelineEvents, setTimelineEvents] = useState<ActivityTimelineEvent[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Custom fields mock state
  const [customFields, setCustomFields] = useState<Record<string, any>>({
    budget_range: "$15k - $50k",
    preferred_service: "Full Custom Suite",
    decision_timeframe: "Within 2 weeks"
  });

  useEffect(() => {
    if (contact && isOpen) {
      setTags(contact.tags || []);
      setAiSummary(null);

      // Fetch timeline
      api.getActivityTimeline(contact.id).then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          setTimelineEvents(res.data);
        }
      }).catch(console.error);

      // Fetch opportunities
      api.getOpportunities().then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const contactOpps = res.data.filter((o: any) => o.contact_id === contact.id || (contact.email && o.contact_email === contact.email));
          setOpportunities(contactOpps);
        }
      }).catch(console.error);

      // Fetch tasks
      api.getTasks().then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const contactTasks = res.data.filter((t: any) => t.contact_id === contact.id || (contact.name && t.contact_name === contact.name));
          setTasks(contactTasks);
        }
      }).catch(console.error);
    }
  }, [contact, isOpen]);

  if (!isOpen || !contact) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newEvent: ActivityTimelineEvent = {
      id: `tl-${Date.now()}`,
      contactId: contact.id,
      type: "note",
      title: "Note Added",
      description: newNoteText,
      timestamp: "Just now",
      author: "You (Admin)",
      badge: "Internal Note"
    };

    setTimelineEvents([newEvent, ...timelineEvents]);
    try {
      await api.addTimelineEvent({
        contact_id: contact.id,
        type: "note",
        title: "Internal Note Added",
        description: newNoteText,
        author: "You (Admin)",
        badge: "Internal Note"
      });
    } catch (e) {
      console.error(e);
    }
    setNewNoteText("");
  };

  const handleAddTag = async () => {
    if (!newTagInput.trim()) return;
    const val = newTagInput.trim();
    if (!tags.includes(val)) {
      const updatedTags = [...tags, val];
      setTags(updatedTags);
      if (contact.id) {
        try {
          await api.updateContact(contact.id, { tags: updatedTags });
        } catch (e) {
          console.error("Failed to persist tag:", e);
        }
      }
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    if (contact.id) {
      try {
        await api.updateContact(contact.id, { tags: updatedTags });
      } catch (e) {
        console.error("Failed to persist tag removal:", e);
      }
    }
  };

  const handleGenerateAiSummary = async () => {
    setIsAiSummarizing(true);
    try {
      const contextPrompt = `Generate a concise 2-sentence executive summary and recommended next action for CRM contact: ${contact.name} (${contact.company || 'Direct Inquiry'}), Email: ${contact.email || 'N/A'}, Phone: ${contact.phone || 'N/A'}, Tags: [${tags.join(', ') || 'Lead'}]. Recent notes count: ${timelineEvents.length}.`;
      const res = await api.sendMessage(contact.id || 'contact-summary', contextPrompt, 'support');
      if (res?.data?.reply || res?.data?.message) {
        setAiSummary(`🎯 **AI Contact 360 Summary**: ${res.data.reply || res.data.message}`);
      } else {
        setAiSummary(
          `🎯 **AI Contact 360 Summary**: ${contact.name} is an active prospect from ${contact.company || 'Direct Inquiry'}. Tags: [${tags.join(', ') || 'Lead'}]. Recommended Next Action: Review activity timeline and schedule follow-up.`
        );
      }
    } catch (e) {
      setAiSummary(
        `🎯 **AI Contact 360 Summary**: ${contact.name} is an active prospect from ${contact.company || 'Direct Inquiry'}. Tags: [${tags.join(', ') || 'Lead'}]. Recommended Next Action: Review activity timeline and schedule follow-up.`
      );
    } finally {
      setIsAiSummarizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#F8FAFC] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-xs">
              {contact.avatar ? (
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                contact.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{contact.name}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Contact 360
                </span>
                {contact.score && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Score {contact.score}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{contact.email}</span>
                <span>•</span>
                <span>{contact.phone || "+1 234 567 8901"}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">{contact.company || "Apex Global Logistics"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAiSummary}
              disabled={isAiSummarizing}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{isAiSummarizing ? "Analyzing History..." : "AI 360 Summary"}</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Brief Alert Banner */}
        {aiSummary && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 px-6 py-3 flex items-start gap-3 text-xs text-slate-800 animate-in slide-in-from-top-2">
            <Bot className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed whitespace-pre-line">{aiSummary}</div>
          </div>
        )}

        {/* 3-Column GHL Workspace Layout */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Profile, Tags, Custom Fields, Owner (Col Span 4) */}
          <div className="col-span-4 bg-white border-r border-slate-200 overflow-y-auto p-5 space-y-6">
            
            {/* Primary Details Card */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Profile & Affiliation
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                  </span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{contact.email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                  </span>
                  <span className="font-semibold text-slate-900">{contact.phone || "+1 234 567 8901"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Company
                  </span>
                  <span className="font-semibold text-blue-600">{contact.company || "Apex Global Logistics"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Account Owner
                  </span>
                  <span className="font-semibold text-slate-900">Sarah Wilson</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Lead Source
                  </span>
                  <span className="font-semibold text-slate-900">{contact.source || "Website Live Chat"}</span>
                </div>
              </div>
            </div>

            {/* Tags Management */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </h3>
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 group"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {isAddingTag && (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder="Enter tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddTag} className="px-2 py-1 text-xs">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingTag(false)} className="px-1.5 py-1 text-xs">
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Custom Fields (User Defined) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Custom CRM Fields
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Budget Range</label>
                  <select
                    value={customFields.budget_range}
                    onChange={(e) => setCustomFields({ ...customFields, budget_range: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                  >
                    <option>$1k - $5k</option>
                    <option>$5k - $15k</option>
                    <option>$15k - $50k</option>
                    <option>$50k+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Target Solution</label>
                  <select
                    value={customFields.preferred_service}
                    onChange={(e) => setCustomFields({ ...customFields, preferred_service: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                  >
                    <option>AI Sales Bot</option>
                    <option>Support Automation</option>
                    <option>Appointment Booking</option>
                    <option>Full Custom Suite</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Decision Timeframe</label>
                  <select
                    value={customFields.decision_timeframe}
                    onChange={(e) => setCustomFields({ ...customFields, decision_timeframe: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                  >
                    <option>Immediately</option>
                    <option>Within 2 weeks</option>
                    <option>This Quarter</option>
                    <option>Exploring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-slate-700"
                onClick={() => onNavigateScreen && onNavigateScreen(3)}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Open Chat
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onNavigateScreen && onNavigateScreen(18)}
              >
                <DollarSign className="w-3.5 h-3.5 mr-1" /> View Deal
              </Button>
            </div>
          </div>

          {/* CENTER COLUMN: Chronological Activity Timeline + Notes Stream (Col Span 5) */}
          <div className="col-span-5 bg-white flex flex-col border-r border-slate-200">
            
            {/* Timeline Filter Tabs */}
            <div className="flex border-b border-slate-200 px-4 pt-3 gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-2.5 cursor-pointer border-b-2 transition-colors ${
                  activeTab === "timeline" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`pb-2.5 cursor-pointer border-b-2 transition-colors ${
                  activeTab === "notes" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Notes & Memos
              </button>
            </div>

            {/* Note Composer Box */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Write an internal note or sales summary for this contact..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Visible to internal team members</span>
                  <Button type="submit" size="sm" className="text-xs px-3 py-1 flex items-center gap-1">
                    <Send className="w-3 h-3" /> Add Note
                  </Button>
                </div>
              </form>
            </div>

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 relative group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    {evt.type === "chat" && <MessageSquare className="w-3.5 h-3.5" />}
                    {evt.type === "note" && <FileText className="w-3.5 h-3.5" />}
                    {evt.type === "appointment" && <Calendar className="w-3.5 h-3.5" />}
                    {evt.type === "stage_change" && <TrendingUp className="w-3.5 h-3.5" />}
                    {evt.type === "task" && <CheckSquare className="w-3.5 h-3.5" />}
                    {evt.type === "workflow" && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                      <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>By: <strong className="text-slate-700">{evt.author}</strong></span>
                      {evt.badge && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                          {evt.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Linked Opportunities, Tasks, Appointments (Col Span 3) */}
          <div className="col-span-3 bg-[#F8FAFC] overflow-y-auto p-4 space-y-5">
            
            {/* Opportunities Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Opportunities
                </h3>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {opportunities.length}
                </span>
              </div>

              <div className="space-y-2">
                {opportunities.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No active opportunities
                  </div>
                ) : (
                  opportunities.map((opp) => (
                    <div key={opp.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-900 mb-1">{opp.title}</div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                        <span className="font-bold text-emerald-700">${opp.value?.toLocaleString()}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[10px]">
                          {opp.stageId || (opp as any).stage_id || "Proposal"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Linked Tasks Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Open Tasks
                </h3>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No tasks assigned
                  </div>
                ) : (
                  tasks.map((tsk) => (
                    <div key={tsk.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-medium text-slate-800 line-clamp-2">{tsk.title}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Due: {tsk.dueDate || (tsk as any).due_date}</span>
                        <span className="font-bold uppercase text-amber-600">{tsk.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Workflow Enrolled */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Active Automation
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                Speed-to-Lead Instant AI Response
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Step 3/4: Awaiting SDR follow-up call response.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
