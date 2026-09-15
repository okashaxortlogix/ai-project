"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Send,
  User,
  Bot,
  ExternalLink,
  Clock,
  CheckCircle2,
  Paperclip,
  Mic,
  MessageSquare,
  Package,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Globe,
  UserCheck,
  Shield,
  RefreshCw,
  Check,
  ChevronDown,
  Trash2,
  Download,
  ChevronLeft,
  Users
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import Contact360Drawer from "./Contact360Drawer";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";
import { playMessageChime } from "@/lib/audio";
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speech";

interface Screen3LiveChatProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

function formatDisplayTime(rawTime: any): string {
  if (!rawTime) return "Just now";
  if (typeof rawTime === "string") {
    const trimmed = rawTime.trim();
    if (
      trimmed.includes("AM") ||
      trimmed.includes("PM") ||
      trimmed.includes("ago") ||
      trimmed === "Active" ||
      trimmed === "Just now" ||
      trimmed === "Recently"
    ) {
      return trimmed;
    }
  }
  try {
    const d = new Date(rawTime);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch {
    // fallback
  }
  return "Just now";
}

export default function Screen3LiveChat({ onNavigate }: Screen3LiveChatProps) {
  const [activeTab, setActiveTab] = useState<"all" | "support" | "sales" | "appointment" | "human">("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [isContact360Open, setIsContact360Open] = useState(false);

  // New Chat Form
  const [newChatName, setNewChatName] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatAgent, setNewChatAgent] = useState("support");
  const [newChatMessage, setNewChatMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [conversationList, setConversationList] = useState<
    Array<{
      id: string;
      customer: string;
      email: string;
      phone?: string;
      message: string;
      agent: string;
      agentLabel: string;
      time: string;
      status: string;
      channel?: string;
      transcript: Array<{
        sender: string;
        text: string;
        time: string;
        isStreaming?: boolean;
      }>;
      orderContext: any;
    }>
  >([]);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await api.getConversations();
        if (res?.success && Array.isArray(res.data)) {
          if (res.data.length > 0) {
            const mapped = res.data.map((item: any) => ({
              id: item.id,
              customer: item.customer?.name || "Customer",
              email: item.customer?.email || "customer@example.com",
              phone: item.customer?.phone || "+1 (555) 019-2831",
              message: item.last_message || "Active conversation",
              agent: item.assigned_agent || "support",
              agentLabel: (item.assigned_agent || "Support").charAt(0).toUpperCase() + (item.assigned_agent || "support").slice(1),
              time: formatDisplayTime(item.last_message_at || item.updated_at || item.created_at),
              status: item.status || "active",
              channel: item.channel === "whatsapp" ? "WhatsApp" : item.channel === "sms" ? "SMS" : "Web Chat",
              transcript: item.messages?.map((m: any) => ({
                sender: m.sender === "customer" ? "customer" : m.sender === "system" ? "system" : "agent",
                text: m.content,
                time: formatDisplayTime(m.timestamp)
              })) || [
                { sender: "customer", text: item.last_message || "Hello!", time: "Just now" }
              ],
              orderContext: item.orderContext || null
            }));
            setConversationList(mapped);
            if (mapped[0]) setSelectedId(mapped[0].id);
          } else {
            setConversationList([]);
            setSelectedId("");
          }
        }
      } catch (e) {
        console.warn("Could not load backend conversations", e);
      }
    }
    loadConversations();

    const handleTenantChange = () => {
      loadConversations();
    };
    window.addEventListener("tenantChanged", handleTenantChange);
    return () => window.removeEventListener("tenantChanged", handleTenantChange);
  }, []);

  const selectedConv =
    conversationList.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.transcript]);

  // Filter conversations
  const filteredConversations = conversationList.filter((c) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "human"
        ? c.status === "human" || c.agent === "human"
        : c.agent === activeTab;

    const matchesSearch =
      searchQuery === "" ||
      c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleSendReply = async (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text || !selectedConv) return;

    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
    }

    const newMsg = {
      sender: selectedConv.status === "human" ? "agent" : "agent",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversationList((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              message: text,
              time: "Just now",
              transcript: [...c.transcript, newMsg]
            }
          : c
      )
    );
    setReplyText("");
    playMessageChime();

    try {
      await api.sendMessage(selectedConv.id, text, "agent");
    } catch (err) {
      console.warn("Failed to persist agent message to DB", err);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedConv || isAiThinking) return;
    setIsAiThinking(true);
    try {
      const lastCustomerMsg =
        [...selectedConv.transcript].reverse().find((m) => m.sender === "customer")?.text ||
        selectedConv.message;

      const res = await api.chatAI({
        message: lastCustomerMsg,
        agentType: selectedConv.agent as any,
        customerName: selectedConv.customer,
        conversationId: selectedConv.id
      });

      if (res?.reply) {
        setReplyText(res.reply);
        inputRef.current?.focus();
      }
    } catch (err) {
      console.warn("AI suggestion failed", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleToggleHandoff = async () => {
    if (!selectedConv) return;
    const isCurrentlyHuman = selectedConv.status === "human" || selectedConv.agent === "human";
    const nextStatus = isCurrentlyHuman ? "active" : "human";
    const nextAgent = isCurrentlyHuman ? "support" : "human";
    const nextLabel = isCurrentlyHuman ? "Support" : "Human";

    const systemMsg = {
      sender: "system",
      text: isCurrentlyHuman
        ? "AI Copilot re-engaged. Autonomous RAG response active."
        : "Conversation prioritized and assigned to human agent queue.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversationList((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              status: nextStatus,
              agent: nextAgent,
              agentLabel: nextLabel,
              transcript: [...c.transcript, systemMsg]
            }
          : c
      )
    );

    try {
      await api.handoffConversation(selectedConv.id);
    } catch (err) {
      console.warn("Status update error", err);
    }
  };

  const handleResolveConversation = async () => {
    if (!selectedConv) return;
    const resolveMsg = {
      sender: "system",
      text: "Conversation marked as resolved by agent.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversationList((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? { ...c, status: "resolved", transcript: [...c.transcript, resolveMsg] }
          : c
      )
    );

    try {
      await api.resolveConversation(selectedConv.id);
    } catch (err) {
      console.warn("Resolve error", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    const targetId = conversationToDelete;
    setConversationToDelete(null);

    const remaining = conversationList.filter((c) => c.id !== targetId);
    setConversationList(remaining);

    if (selectedId === targetId) {
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }

    try {
      await api.deleteConversation(targetId);
    } catch (err) {
      console.warn("Delete conversation error", err);
    }
  };

  const handleExportTranscript = () => {
    if (!selectedConv) return;
    const lines = [
      `=====================================================`,
      `CONVERSATION TRANSCRIPT: ${selectedConv.customer}`,
      `Email: ${selectedConv.email || "N/A"}`,
      `Channel: ${selectedConv.channel || "Web Chat"}`,
      `Assigned Agent: ${selectedConv.agentLabel || selectedConv.agent}`,
      `Status: ${selectedConv.status}`,
      `Export Date: ${new Date().toLocaleString()}`,
      `=====================================================\n`
    ];
    selectedConv.transcript.forEach((msg) => {
      lines.push(`[${msg.time}] ${msg.sender.toUpperCase()}: ${msg.text}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${selectedConv.customer.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      return;
    }

    const started = startSpeechRecognition({
      onResult: (transcript, isFinal) => {
        setReplyText(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false)
    });

    if (started) setIsListening(true);
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;

    const initialMsg = newChatMessage.trim() || "Hello, I need assistance.";
    const tempId = `conv-${Date.now()}`;
    const newConv = {
      id: tempId,
      customer: newChatName.trim(),
      email: newChatEmail.trim() || `${newChatName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: "+1 (555) 019-2831",
      message: initialMsg,
      agent: newChatAgent,
      agentLabel: newChatAgent.charAt(0).toUpperCase() + newChatAgent.slice(1),
      time: "Just now",
      status: "active",
      channel: "Web Chat",
      transcript: [
        {
          sender: "customer",
          text: initialMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ],
      orderContext: null
    };

    setConversationList((prev) => [newConv, ...prev]);
    setSelectedId(tempId);
    setIsNewChatModalOpen(false);
    setNewChatName("");
    setNewChatEmail("");
    setNewChatMessage("");

    try {
      const aiRes = await api.chatAI({
        message: initialMsg,
        agentType: newChatAgent as any,
        customerName: newChatName.trim(),
        conversationId: tempId
      });

      if (aiRes?.reply) {
        const aiMsg: any = {
          sender: "agent",
          text: "",
          isStreaming: true,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setConversationList((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, transcript: [...c.transcript, aiMsg] } : c))
        );

        await streamMessageText(aiRes.reply, (accumulated, isFinished) => {
          setConversationList((prev) =>
            prev.map((c) => {
              if (c.id !== tempId) return c;
              const updated = [...c.transcript];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: accumulated,
                  isStreaming: !isFinished
                };
              }
              return { ...c, transcript: updated };
            })
          );
        });
      }
    } catch (err) {
      console.warn("AI generation failed for new chat", err);
    }
  };

  const getTagColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case "appointment":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "sales":
        return "bg-teal-50 text-teal-700 border-teal-200/80";
      case "support":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "human":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const quickCopilotSuggestions = [
    { label: "📦 Check order status", text: "Let me check that for you! Could you confirm your order number?" },
    { label: "📅 Propose 11:30 AM Slot", text: "We have tomorrow at 11:30 AM open for your consultation. Would that time suit you?" },
    { label: "🏷️ Offer 15% promo code", text: "I can apply an exclusive 15% discount code (PROMO15) to your cart right now!" },
    { label: "👤 Transfer to Specialist", text: "I'm connecting you with our dedicated human specialist. They'll be right with you." }
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 flex flex-col h-[calc(100vh-80px)] min-h-[640px]">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Live Conversations</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {conversationList.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified omnichannel customer inbox with real-time AI copilot and human handoff.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
            <span>AI Copilot Active</span>
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsNewChatModalOpen(true)}
          >
            New Chat
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split: Left Compact List (3 Cols) + Right Professional Chat Workspace (9 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Compact Conversation Inbox List */}
        <div className={`lg:col-span-3 xl:col-span-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col overflow-hidden ${mobilePane === "chat" ? "hidden lg:flex" : "flex"}`}>
          {/* Top Filter Tabs & Search */}
          <div className="p-2.5 border-b border-slate-100 space-y-2 bg-slate-50/40 shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "all", label: `All (${conversationList.length})` },
                { id: "support", label: "Support" },
                { id: "sales", label: "Sales" },
                { id: "appointment", label: "Bookings" },
                { id: "human", label: "Human" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-blue-700 border border-slate-200 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inbox..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversation List Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">No conversations</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Change search or tab</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMobilePane("chat");
                    }}
                    className={`p-3 flex items-start justify-between gap-2 cursor-pointer transition-all border-l-4 group relative ${
                      isSelected
                        ? "bg-blue-50/70 border-l-blue-600 shadow-2xs"
                        : "border-l-transparent hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {/* Avatar with status indicator */}
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                          {conv.customer.charAt(0)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                            conv.status === "human" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {conv.customer}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium group-hover:hidden">
                              {conv.time}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConversationToDelete(conv.id);
                              }}
                              className="hidden group-hover:flex items-center justify-center w-4 h-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${getTagColor(
                              conv.agentLabel || conv.agent
                            )}`}
                          >
                            {conv.agentLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {conv.channel || "Web"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
                          {conv.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Conversation Workspace */}
        <div className={`lg:col-span-9 xl:col-span-9 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col overflow-hidden ${mobilePane === "list" ? "hidden lg:flex" : "flex"}`}>
          {selectedConv ? (
            <>
              {/* 1. Professional Chat Header */}
              <div className="px-3 sm:px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                {/* Left: Customer Info with Mobile Back Button */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setMobilePane("list")}
                    className="lg:hidden p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-0.5"
                    title="Back to inbox"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      {selectedConv.customer.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        {selectedConv.customer}
                      </h2>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                          selectedConv.agentLabel
                        )}`}
                      >
                        {selectedConv.agentLabel}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Positive Sentiment
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedConv.email}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {selectedConv.channel || "Web Chat"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2">
                  {/* Contact 360 Workspace Drawer */}
                  <button
                    onClick={() => setIsContact360Open(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Open Full Contact 360 CRM Workspace"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Contact 360</span>
                  </button>

                  {/* Human Takeover Toggle */}
                  <button
                    onClick={handleToggleHandoff}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedConv.status === "human"
                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Toggle Human Agent Takeover"
                  >
                    {selectedConv.status === "human" ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                        <span>Re-enable AI Copilot</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Take Over as Human</span>
                      </>
                    )}
                  </button>

                  {/* Resolve Conversation */}
                  <button
                    onClick={handleResolveConversation}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Mark conversation as resolved"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Resolve</span>
                  </button>

                  {/* Export Transcript */}
                  <button
                    onClick={handleExportTranscript}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Export transcript as text file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Export</span>
                  </button>

                  {/* Delete Conversation */}
                  <button
                    onClick={() => setConversationToDelete(selectedConv.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* 2. Scrollable Message Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#F8FAFC]">
                {/* Date Divider */}
                <div className="flex items-center justify-center my-1">
                  <span className="px-3 py-1 bg-white border border-slate-200/80 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-2xs">
                    Today · Real-time Conversation
                  </span>
                </div>

                {selectedConv.transcript.map((msg, i) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={i} className="flex justify-center my-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{msg.text}</span>
                          <span className="text-[9px] text-amber-700 ml-1">{msg.time}</span>
                        </div>
                      </div>
                    );
                  }

                  const isCustomer = msg.sender === "customer";

                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-2.5 ${
                        isCustomer ? "justify-start" : "justify-end"
                      }`}
                    >
                      {/* Customer avatar on left */}
                      {isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                          {selectedConv.customer.charAt(0)}
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                          isCustomer
                            ? "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs"
                            : "bg-blue-600 text-white rounded-br-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span
                            className={`text-[10px] font-bold ${
                              isCustomer ? "text-slate-500" : "text-blue-100"
                            }`}
                          >
                            {isCustomer
                              ? selectedConv.customer
                              : selectedConv.status === "human"
                              ? "Human Representative"
                              : "Nexa AI Copilot"}
                          </span>
                          <span
                            className={`text-[9px] ${
                              isCustomer ? "text-slate-400" : "text-blue-200"
                            }`}
                          >
                            {msg.time}
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap select-text">
                          {msg.text}
                          {(msg as any).isStreaming && (
                            <span className="inline-block w-1.5 h-3 bg-blue-300 rounded-xs animate-pulse ml-1 align-middle" />
                          )}
                        </div>
                      </div>

                      {/* Agent avatar on right */}
                      {!isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Embedded Order Tracking Context Card (if available) */}
                {selectedConv.orderContext && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2 max-w-md shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-emerald-950 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-700" />
                        Shopify Order {selectedConv.orderContext.orderNumber}
                      </span>
                      <StatusBadge
                        status={selectedConv.orderContext.status}
                        variant="active"
                        pulse={false}
                      />
                    </div>
                    <div className="text-[11px] text-emerald-900 space-y-0.5">
                      <div>
                        <strong>Estimated Arrival:</strong> {selectedConv.orderContext.estimated}
                      </div>
                      <div>
                        <strong>Carrier:</strong> {selectedConv.orderContext.carrier}
                      </div>
                    </div>
                    <div className="pt-1 text-[10px] text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Live tracking synced via Shopify Webhook HMAC</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 3. Copilot AI Suggestion Chips */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Quick Copilot:
                </span>
                {quickCopilotSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReplyText(item.text);
                      inputRef.current?.focus();
                    }}
                    className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-medium rounded-full shadow-2xs transition-all shrink-0 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 4. Professional Reply Composer Bar */}
              <div className="p-3.5 bg-white border-t border-slate-200/90 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendReply();
                  }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                >
                  {/* Attachment Button */}
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Attach file or screenshot"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Speech Dictation Button */}
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isListening
                          ? "bg-rose-500 text-white animate-pulse"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Voice speech-to-text"}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reply Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Reply to ${selectedConv.customer}... (Press Enter to send)`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
                  />

                  {/* AI Suggest / Auto-Draft Button */}
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isAiThinking}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title="Generate intelligent AI response"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">
                      {isAiThinking ? "Generating..." : "AI Draft"}
                    </span>
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>
                    ⚡ Connected to RAG Vector Base · Real-time live copilot
                  </span>
                  <span>
                    Mode:{" "}
                    <strong className="text-slate-600">
                      {selectedConv.status === "human" ? "Human Agent" : "AI Copilot Active"}
                    </strong>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No conversation selected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose a conversation from the left inbox to view the live chat thread
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start New Conversation"
        subtitle="Initiate a direct customer interaction or simulated test session"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsNewChatModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateNewChat}>
              Start Conversation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateNewChat} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zaid Khan"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Email
            </label>
            <input
              type="email"
              placeholder="e.g. zaid.khan@example.com"
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned AI Agent
            </label>
            <select
              value={newChatAgent}
              onChange={(e) => setNewChatAgent(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="support">Customer Support Agent</option>
              <option value="sales">Sales & Recommendations Agent</option>
              <option value="appointment">Appointment Booking Agent</option>
              <option value="human">Human Agent Handoff</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Initial Message
            </label>
            <textarea
              rows={3}
              placeholder="Type the opening customer question or prompt..."
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!conversationToDelete}
        onClose={() => setConversationToDelete(null)}
        title="Delete Conversation"
        subtitle="This conversation and its message transcript will be permanently removed."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConversationToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Delete Permanently
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to delete this conversation? All chat messages and transcripts will be permanently erased. This action cannot be undone.
        </p>
      </Modal>

      {/* GHL Contact 360 Workspace Drawer */}
      <Contact360Drawer
        contact={selectedConv ? { id: selectedConv.id, name: selectedConv.customer, email: selectedConv.email, phone: selectedConv.phone || "+1 234 567 8901", company: "Apex Global Logistics", tags: ["Hot Lead", "Inbound Chat"] } : null}
        isOpen={isContact360Open}
        onClose={() => setIsContact360Open(false)}
        onNavigateScreen={onNavigate}
      />
    </div>
  );
}
