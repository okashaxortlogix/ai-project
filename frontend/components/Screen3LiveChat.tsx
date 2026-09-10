"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Phone,
  Info,
  MoreVertical,
  CheckCircle,
  Send,
  Paperclip,
  Smile,
  Bot,
  User,
  CheckCheck
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen3LiveChatProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen3LiveChat({ onNavigate, isCompact = false }: Screen3LiveChatProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>("conv-1");
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load live conversations from API
  const loadConversations = async () => {
    try {
      const res = await api.getConversations(filter, searchQuery);
      if (res.success && res.data) {
        setConversations(res.data);
        if (!activeId && res.data.length > 0) {
          setActiveId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations from API", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [filter, searchQuery]);

  const currentConv = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentConv) return;

    const sentText = inputText;
    setInputText("");
    setIsTyping(true);

    // Optimistic local push
    const optimisticMsg = {
      id: `m-opt-${Date.now()}`,
      sender: "customer",
      content: sentText,
      timestamp: "Just now"
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConv.id
          ? {
              ...c,
              last_message: sentText,
              last_message_at: "Just now",
              messages: [...c.messages, optimisticMsg]
            }
          : c
      )
    );

    try {
      // Real backend API call which routes through AI Orchestrator & writes to DB
      const res = await api.sendMessage(currentConv.id, sentText, "customer");
      if (res.success && res.data) {
        // Refresh conversations to sync state
        await loadConversations();
      }
    } catch (err) {
      console.error("Error calling live message API", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResolve = async () => {
    if (!currentConv) return;
    try {
      await api.resolveConversation(currentConv.id);
      await loadConversations();
    } catch (e) {
      console.error("Resolve error", e);
    }
  };

  const handleHandoff = async () => {
    if (!currentConv) return;
    try {
      await api.handoffConversation(currentConv.id);
      await loadConversations();
      alert(`Conversation with ${currentConv.customer.name} handed off to human support queue.`);
    } catch (e) {
      console.error("Handoff error", e);
    }
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[560px] ${isCompact ? "text-xs" : ""}`}>
      {/* Left Sidebar - Conversation List */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        {/* Header & Filter Tabs */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conversations (API)</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {conversations.length} Active
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg mb-2">
            {(["all", "active", "pending"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-1 rounded text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                  filter === tab ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map((conv) => {
            const isSelected = conv.id === activeId;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`p-3 flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected ? "bg-blue-50/70 border-l-3 border-blue-600" : "hover:bg-slate-50"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.customer.avatar}
                    alt={conv.customer.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  {conv.customer.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {conv.customer.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{conv.last_message_at}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {conv.last_message}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                        conv.assigned_agent === "support"
                          ? "bg-blue-100 text-blue-700"
                          : conv.assigned_agent === "sales"
                          ? "bg-teal-100 text-teal-700"
                          : conv.assigned_agent === "appointment"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {conv.assigned_agent} Agent
                    </span>
                    {conv.status === "pending" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    )}
                    {conv.status === "waiting_for_human" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                        Human Queue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentConv ? (
        <div className="flex-1 flex flex-col bg-slate-50/40">
          {/* Chat Header */}
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentConv.customer.avatar}
                  alt={currentConv.customer.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                />
                {currentConv.customer.online && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  {currentConv.customer.name}
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
                    {currentConv.customer.online ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Assigned: <span className="text-slate-600 font-medium capitalize">{currentConv.assigned_agent} Agent (AI)</span>
                </p>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <button
                onClick={handleHandoff}
                title="Handoff to human agent"
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                Handoff
              </button>
              <button
                title="Call customer"
                onClick={() => alert(`Initiating audio call with ${currentConv.customer.name}...`)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                title="Customer information"
                onClick={() => onNavigate && onNavigate(7)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={handleResolve}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors ml-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {currentConv.messages.map((msg: any) => {
              const isCustomer = msg.sender === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isCustomer ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isCustomer
                        ? "bg-blue-600 text-white"
                        : msg.agent_type === "sales"
                        ? "bg-teal-600 text-white"
                        : msg.agent_type === "appointment"
                        ? "bg-purple-600 text-white"
                        : "bg-[#071B3A] text-white"
                    }`}
                  >
                    {isCustomer ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isCustomer
                          ? "bg-[#1677FF] text-white rounded-tr-xs"
                          : "bg-white text-slate-800 border border-slate-200/90 shadow-xs rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 ${
                        isCustomer ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isCustomer && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Bot className="w-3.5 h-3.5 animate-bounce text-blue-500" />
                <span>AI Orchestrator processing & grounding reply...</span>
              </div>
            )}
          </div>

          {/* Message Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Type a message (e.g. 'Can I get a discount?', 'Book demo for 2 PM')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-[#1677FF] hover:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Loading conversations from backend API...
        </div>
      )}
    </div>
  );
}
