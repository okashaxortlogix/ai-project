"use client";

import React, { useState, useEffect } from "react";
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
  Calendar
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";

interface Screen3LiveChatProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen3LiveChat({ onNavigate }: Screen3LiveChatProps) {
  const [activeTab, setActiveTab] = useState<"all" | "support" | "sales" | "appointment">("all");
  const [selectedId, setSelectedId] = useState<string>("conv-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullChatModalOpen, setIsFullChatModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // New Chat Form
  const [newChatName, setNewChatName] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatAgent, setNewChatAgent] = useState("support");
  const [newChatMessage, setNewChatMessage] = useState("");

  const [conversationList, setConversationList] = useState<
    Array<{
      id: string;
      customer: string;
      email: string;
      message: string;
      agent: string;
      agentLabel: string;
      time: string;
      status: string;
      transcript: Array<{
        sender: string;
        text: string;
        time: string;
        isStreaming?: boolean;
      }>;
      orderContext: any;
    }>
  >([
    {
      id: "conv-1",
      customer: "Sarah Ahmed",
      email: "sarah@gmail.com",
      message: "I want to book an appointment for a cleaning.",
      agent: "appointment",
      agentLabel: "Appointment",
      time: "10:34 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "I want to book an appointment for a cleaning.", time: "10:24 AM" },
        { sender: "agent", text: "Sure! I can help you with that. Let me check available slots for you.", time: "10:24 AM" },
        { sender: "agent", text: "We have tomorrow at 11:30 AM and Thursday at 2:00 PM open. Which works better for you?", time: "10:25 AM" }
      ],
      orderContext: null
    },
    {
      id: "conv-2",
      customer: "Ali Raza",
      email: "ali.raza@outlook.com",
      message: "Can you tell me about your pricing?",
      agent: "sales",
      agentLabel: "Sales",
      time: "09:58 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "Can you tell me about your pricing?", time: "09:58 AM" },
        { sender: "agent", text: "Our plans start at $49/mo for Starter and $149/mo for Growth with full AI agent automation. Would you like me to share a 15% discount code?", time: "09:58 AM" }
      ],
      orderContext: null
    },
    {
      id: "conv-3",
      customer: "Fatima Khan",
      email: "fatima.khan@gmail.com",
      message: "My order hasn't arrived yet.",
      agent: "support",
      agentLabel: "Support",
      time: "09:42 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "My order hasn't arrived yet.", time: "09:40 AM" },
        { sender: "agent", text: "I found your order #12345 in Shopify. It's currently Out for Delivery via DHL Express.", time: "09:41 AM" }
      ],
      orderContext: {
        orderNumber: "#12345",
        status: "Out for Delivery",
        estimated: "Today by 4:00 PM",
        carrier: "DHL Express (Tracking: DHL-9402-US)"
      }
    },
    {
      id: "conv-4",
      customer: "Usman Tariq",
      email: "usman.tariq@yahoo.com",
      message: "Do you have any special discounts?",
      agent: "sales",
      agentLabel: "Sales",
      time: "09:17 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "Do you have any special discounts?", time: "09:15 AM" },
        { sender: "agent", text: "Yes! Use promo code SPRING20 at checkout for 20% off all catalog items.", time: "09:16 AM" }
      ],
      orderContext: null
    },
    {
      id: "conv-5",
      customer: "Ayesha Malik",
      email: "ayesha.m@gmail.com",
      message: "I need help with my account setup",
      agent: "support",
      agentLabel: "Support",
      time: "08:50 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "I need help with my account setup", time: "08:48 AM" },
        { sender: "agent", text: "I can guide you through the 3-step setup wizard or invite your team members. Which step are you on?", time: "08:49 AM" }
      ],
      orderContext: null
    },
    {
      id: "conv-6",
      customer: "Hamza Ali",
      email: "hamza.ali@corp.io",
      message: "Can I reschedule my appointment?",
      agent: "appointment",
      agentLabel: "Appointment",
      time: "08:32 AM",
      status: "active",
      transcript: [
        { sender: "customer", text: "Can I reschedule my appointment?", time: "08:30 AM" },
        { sender: "agent", text: "Certainly, Hamza! Your Dental Consultation can be moved to Friday at 3:00 PM. Should I confirm this slot?", time: "08:31 AM" }
      ],
      orderContext: null
    }
  ]);

  // Filter conversations
  const filteredConversations = conversationList.filter((c) => {
    const matchesTab = activeTab === "all" || c.agent === activeTab;
    const matchesSearch =
      searchQuery === "" ||
      c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedConv =
    conversationList.find((c) => c.id === selectedId) || conversationList[0];

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await api.getConversations();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            customer: item.customer?.name || "Customer",
            email: item.customer?.email || "customer@example.com",
            message: item.last_message || "Active conversation",
            agent: item.assigned_agent || "support",
            agentLabel: (item.assigned_agent || "Support").charAt(0).toUpperCase() + (item.assigned_agent || "support").slice(1),
            time: item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
            status: item.status || "active",
            transcript: item.messages?.map((m: any) => ({
              sender: m.sender === "customer" ? "customer" : "agent",
              text: m.content,
              time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"
            })) || [
              { sender: "customer", text: item.last_message || "Hello!", time: "Just now" }
            ],
            orderContext: item.orderContext || null
          }));
          setConversationList(mapped);
          if (mapped[0]) setSelectedId(mapped[0].id);
        }
      } catch (e) {
        console.warn("Could not load backend conversations, using initial list", e);
      }
    }
    loadConversations();
  }, []);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    const currentReply = replyText.trim();
    const newMsg = {
      sender: "agent",
      text: currentReply,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversationList((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? { ...c, transcript: [...c.transcript, newMsg] }
          : c
      )
    );
    setReplyText("");

    try {
      await api.sendMessage(selectedConv.id, currentReply, "agent");
    } catch (err) {
      console.warn("Failed to persist agent message to DB", err);
    }
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
      message: initialMsg,
      agent: newChatAgent,
      agentLabel: newChatAgent.charAt(0).toUpperCase() + newChatAgent.slice(1),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "active",
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

    // Automatically trigger intelligent AI response for the initial message
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
    switch (agent) {
      case "appointment":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "sales":
        return "bg-teal-50 text-teal-700 border-teal-200/80";
      case "support":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Live Conversations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage all active conversations across your AI agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
            <span>Live</span>
          </span>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsNewChatModalOpen(true)}
          >
            New Chat
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          {[
            { id: "all", label: "All (6)" },
            { id: "support", label: "Support (2)" },
            { id: "sales", label: "Sales (2)" },
            { id: "appointment", label: "Appointment (2)" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main 2-Column Split: List + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Conversation List (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No conversations found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try changing your search or filter tab</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`p-4 flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50/50 border-l-4 border-l-blue-600"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {conv.customer.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.customer}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                            conv.agent
                          )}`}
                        >
                          {conv.agentLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {conv.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {conv.time}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Conversation Details Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          {selectedConv ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Conversation Details
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getTagColor(
                    selectedConv.agent
                  )}`}
                >
                  {selectedConv.agentLabel}
                </span>
              </div>

              {/* Customer Profile Card */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                  {selectedConv.customer.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedConv.customer}
                  </h4>
                  <p className="text-[11px] text-slate-500">{selectedConv.email}</p>
                </div>
              </div>

              {/* Chat Message Snippets */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedConv.transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === "customer" ? "items-start" : "items-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === "customer"
                          ? "bg-slate-100 text-slate-800 border border-slate-200/70 rounded-tl-none"
                          : "bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-none"
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-400 mb-0.5">
                        {msg.sender === "customer" ? selectedConv.customer : "AI Agent"}
                      </div>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* If Order Context exists */}
              {selectedConv.orderContext && (
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                      Order Details: {selectedConv.orderContext.orderNumber}
                    </span>
                    <StatusBadge status={selectedConv.orderContext.status} variant="active" pulse={false} />
                  </div>
                  <div className="text-[11px] text-teal-800">
                    Estimated Delivery: {selectedConv.orderContext.estimated}
                  </div>
                  <div className="text-[11px] text-teal-700">
                    Tracking: {selectedConv.orderContext.carrier}
                  </div>
                </div>
              )}

              {/* View Full Conversation Button */}
              <div className="pt-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsFullChatModalOpen(true)}
                >
                  View Full Conversation
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a conversation to view details
            </div>
          )}
        </div>
      </div>

      {/* Full Conversation Modal */}
      <Modal
        isOpen={isFullChatModalOpen}
        onClose={() => setIsFullChatModalOpen(false)}
        title={
          selectedConv ? (
            <div className="flex items-center gap-2">
              <span>{selectedConv.customer}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                  selectedConv.agent
                )}`}
              >
                {selectedConv.agentLabel}
              </span>
            </div>
          ) : (
            "Conversation"
          )
        }
        subtitle={selectedConv?.email}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {selectedConv?.transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === "customer" ? "items-start" : "items-end"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl text-xs ${
                    msg.sender === "customer"
                      ? "bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none"
                      : "bg-blue-600 text-white rounded-tr-none shadow-xs"
                  }`}
                >
                  {msg.text}
                  {(msg as any).isStreaming && (
                    <span className="inline-block w-1.5 h-3 bg-blue-600 rounded-xs animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Reply Form */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
            <Button variant="primary" size="md" onClick={handleSendReply}>
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
}
