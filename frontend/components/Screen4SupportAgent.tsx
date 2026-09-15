"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Headphones,
  Check,
  CheckCircle2,
  Package,
  Truck,
  ExternalLink,
  Clock,
  Send,
  Sliders,
  BookOpen,
  Mic,
  Star,
  Zap,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Shield,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";

interface Screen4SupportAgentProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

interface ChatMsg {
  id: string;
  sender: "customer" | "agent";
  content: string;
  time: string;
  isStreaming?: boolean;
  toolUsed?: string;
}

interface InquiryRecord {
  id: string;
  customer: string;
  email: string;
  avatar: string;
  topic: string;
  channel: string;
  time: string;
  stars: string;
  status: "Autonomous" | "Escalated";
  summary: string;
  resolutionTimeSec: number;
}

export default function Screen4SupportAgent({ onNavigate }: Screen4SupportAgentProps) {
  const [activeTab, setActiveTab] = useState<"sandbox" | "performance" | "knowledge" | "guardrails">("sandbox");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);

  // Agent configuration state
  const [maxRefundLimit, setMaxRefundLimit] = useState(50);
  const [handoffThreshold, setHandoffThreshold] = useState("High Frustration / Repeated Query");
  const [responseTime, setResponseTime] = useState("Immediate (< 0.8s)");
  const [guardrailsSaved, setGuardrailsSaved] = useState(false);

  // Conversation Sandbox state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "sup-1",
      sender: "customer",
      content: "Where is my order #12345?",
      time: "10:14 AM"
    },
    {
      id: "sup-2",
      sender: "agent",
      content: "Let me check that for you! I found your order #12345. It's currently Out for Delivery and is expected to arrive tomorrow with FedEx Express tracking #FDX-994821.",
      time: "10:15 AM",
      toolUsed: "get_order_status"
    },
    {
      id: "sup-3",
      sender: "customer",
      content: "Can I change the delivery address to my office?",
      time: "10:17 AM"
    },
    {
      id: "sup-4",
      sender: "agent",
      content: "Yes, you can certainly change your delivery address to your office! As long as the package has not left the regional carrier distribution hub, we can redirect it.\n\nPlease provide your office address (Company name, floor/suite, street, city, state & zip) and I will submit an immediate carrier reroute request.",
      time: "10:18 AM"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeOrderContext, setActiveOrderContext] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inquiries History
  const recentInquiries: InquiryRecord[] = [
    {
      id: "inq-1",
      customer: "Sarah Ahmed",
      email: "sarah@gmail.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      topic: "Order #12345 delivery tracking status",
      channel: "Shopify Store",
      time: "38s",
      stars: "5.0",
      status: "Autonomous",
      summary: "AI looked up Shopify fulfillment via live webhook. Provided real-time tracking #FDX-994821 and scheduled delivery.",
      resolutionTimeSec: 38
    },
    {
      id: "inq-2",
      customer: "Michael Vance",
      email: "m.vance@tech.co",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      topic: "Return shipping label generation",
      channel: "Live Web Chat",
      time: "1m 14s",
      stars: "5.0",
      status: "Autonomous",
      summary: "Validated 30-day return window eligibility and automatically generated a prepaid FedEx ground return label.",
      resolutionTimeSec: 74
    },
    {
      id: "inq-3",
      customer: "Ali Raza",
      email: "ali.raza@outlook.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
      topic: "Delivery address update to office",
      channel: "WhatsApp",
      time: "45s",
      stars: "4.8",
      status: "Autonomous",
      summary: "Customer requested office reroute before regional hub departure. Reroute dispatch payload transmitted.",
      resolutionTimeSec: 45
    },
    {
      id: "inq-4",
      customer: "Emily Watson",
      email: "emily.w@design.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      topic: "Headphone warranty coverage question",
      channel: "Email Ticket",
      time: "1m 02s",
      stars: "5.0",
      status: "Autonomous",
      summary: "RAG ground knowledge search matched 2-year warranty documentation. Confirmed replacement eligibility.",
      resolutionTimeSec: 62
    }
  ];

  // Voice speech-to-text setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        setSpeechSupported(true);
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    const lower = userText.toLowerCase();

    if (lower.includes("order") || lower.includes("#") || lower.includes("track")) {
      setActiveOrderContext(true);
    }

    const newMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      sender: "customer",
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await api.chatAI({
        message: userText,
        agentType: "support",
        customerName: "Sara Jenkins",
        conversationId: "conv-support-sandbox",
        history: messages.slice(-6).map((m) => ({
          role: m.sender === "customer" ? "user" : "assistant",
          content: m.content
        }))
      });

      const replyText = res.reply || "I was unable to retrieve information for your query from the server. Please verify your connection.";
      const aiId = `ai-${Date.now()}`;
      const toolUsed = res.toolExecuted?.toolName || res.toolExecuted?.name || res.tool_executed?.toolName || res.tool_executed?.name;

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: aiId,
          sender: "agent",
          content: "",
          isStreaming: true,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          toolUsed
        }
      ]);

      await streamMessageText(replyText, (accumulated, isFinished) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: accumulated, isStreaming: !isFinished }
              : m
          )
        );
      });
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "agent",
          content: "I apologize, our support agent engine is currently reconnecting. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  };

  const handleSaveGuardrails = () => {
    setGuardrailsSaved(true);
    setTimeout(() => setGuardrailsSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1300px] mx-auto space-y-5">
      {/* 1. Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span
              onClick={() => onNavigate?.(2)}
              className="hover:text-blue-600 cursor-pointer transition-colors"
            >
              Home
            </span>
            <span>/</span>
            <span className="text-slate-700 font-medium">Support Agent</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Support Agent</h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Autonomous order tracking, checkout assistance, returns, and customer inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Clean Top Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("sandbox")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "sandbox"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Sandbox</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("performance")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "performance"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Performance &amp; History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "knowledge"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guardrails")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "guardrails"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Guardrails</span>
          </button>
        </div>
      </div>

      {guardrailsSaved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Guardrails and escalation settings saved successfully.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CHAT SANDBOX (CLEAN & SPACIOUS STUDIO) */}
      {/* ========================================================================= */}
      {activeTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Chat Conversation (8 Cols) */}
          <div className="lg:col-span-8">
            <Card className="flex flex-col h-[620px] border-slate-200/90 shadow-2xs">
              {/* Sandbox Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
                  <span className="text-xs font-bold text-slate-900">Live Agent Sandbox</span>
                  <span className="text-[11px] text-slate-400">• Customer: Sara Jenkins</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMessages([
                        {
                          id: `reset-${Date.now()}`,
                          sender: "agent",
                          content: "Hello! I'm your AI Support Copilot. I'm connected to your store catalog, live carrier tracking, and return policies. How can I help you today?",
                          time: "Just now"
                        }
                      ])
                    }
                    className="text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>

              {/* Quick Sample Inquiries */}
              <div className="px-3.5 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-medium shrink-0">Quick test:</span>
                {[
                  { label: "Track Order #12345", text: "Where is my order #12345?" },
                  { label: "Checkout Problem", text: "Can you tell me why is my order not getting placed?" },
                  { label: "Return Policy", text: "What is your 30-day return policy?" },
                  { label: "Change Address", text: "Can I change my delivery address to my office?" }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChatInput(chip.text)}
                    className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg border border-slate-200 text-[11px] transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Message Transcript */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
                {messages.map((m) => {
                  const isAgent = m.sender === "agent";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
                    >
                      {isAgent && (
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-2xs">
                          <Headphones className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                          isAgent
                            ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                            : "bg-blue-600 text-white rounded-tr-xs font-medium"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\*+/g, "")}</p>

                        {m.isStreaming && (
                          <span className="inline-block w-1.5 h-3 ml-0.5 bg-blue-600 animate-pulse align-middle" />
                        )}

                        {m.toolUsed && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <Zap className="w-3 h-3 text-emerald-600" />
                            <span>Action Executed: {m.toolUsed}</span>
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1.5 ${
                            isAgent ? "text-slate-400" : "text-blue-200"
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>

                      {!isAgent && (
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                          S
                        </div>
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-slate-400 ml-1 font-medium">Generating response...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about orders, returns, or shipping..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />

                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isListening
                        ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                    title={isListening ? "Listening... click to stop" : "Voice input"}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!chatInput.trim() || isTyping}
                  icon={Send}
                >
                  Send
                </Button>
              </form>
            </Card>
          </div>

          {/* Clean Right Sidebar: Single Unified Active Context Card (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Context Card */}
            <Card className="p-4 border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Active Customer Context</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Session
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">Sara Jenkins (sara@example.com)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Channel:</span>
                  <span className="font-semibold text-slate-800">Shopify Store Web Chat</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Carrier Sync:</span>
                  <span className="font-semibold text-blue-600">FedEx Express Ground</span>
                </div>
              </div>

              {/* Dynamic Order Status Segment */}
              {activeOrderContext && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Order #12345</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Out for Delivery
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div>Tracking: <span className="font-mono font-semibold text-slate-800">FDX-994821</span></div>
                    <div>Destination: <span className="font-semibold text-slate-800">Springfield, IL</span></div>
                    <div>Expected: <span className="font-semibold text-slate-800">Tomorrow by 2:00 PM</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="w-full text-center py-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Full Order Details
                  </button>
                </div>
              )}

              {/* Active Grounding Sources */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Referenced Knowledge Sources</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate max-w-[190px]">
                      Shipping_Delivery_Policy_2026.pdf
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      99% match
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate max-w-[190px]">
                      Return_Refund_SLA.docx
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      98% match
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERFORMANCE & INQUIRIES AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === "performance" && (
        <div className="space-y-5">
          {/* 4 Clean Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Auto-Resolution</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">98.4%</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Response Time</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">0.8s</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-violet-500" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">CSAT Score</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">4.9 / 5.0</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Orders Resolved</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">412</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Resolved Customer Inquiries Table */}
          <Card className="p-5 border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Resolved Inquiries</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit log of customer queries autonomously resolved by the AI Support Copilot.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Real-time sync</span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Inquiry Topic</th>
                    <th className="pb-2.5">Channel</th>
                    <th className="pb-2.5">Resolution Time</th>
                    <th className="pb-2.5">CSAT</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentInquiries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={row.avatar}
                            alt={row.customer}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{row.customer}</div>
                            <div className="text-[10px] text-slate-400">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-medium text-slate-800">{row.topic}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                          {row.channel}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-600">{row.time}</td>
                      <td className="py-3">
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {row.stars}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GROUNDED KNOWLEDGE BASE */}
      {/* ========================================================================= */}
      {activeTab === "knowledge" && (
        <Card className="p-6 space-y-4 border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Support Knowledge Sources</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Indexed documentation and API connectors used by the AI to answer inquiries.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigate?.(9)}>
              Manage Knowledge Base
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { title: "Shipping_Delivery_Policy_2026.pdf", chunks: "14 chunks", status: "Active Grounding", match: "99% High" },
              { title: "Return_Refund_SLA_Guidelines.docx", chunks: "9 chunks", status: "Active Grounding", match: "98% High" },
              { title: "Shopify_Order_Lookup_Webhook.json", chunks: "Live REST API", status: "Connected", match: "Real-time" }
            ].map((doc, i) => (
              <div key={i} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{doc.title}</div>
                    <div className="text-[10px] text-slate-400">{doc.chunks} • Embeddings: text-embedding-3-small</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {doc.match}
                  </span>
                  <StatusBadge variant="active" label={doc.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GUARDRAILS & ESCALATION RULES */}
      {/* ========================================================================= */}
      {activeTab === "guardrails" && (
        <Card className="p-6 max-w-2xl space-y-5 border-slate-200/90 shadow-2xs">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Safety Guardrails &amp; Human Escalation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set financial limits, tone guardrails, and triggers for handing off to human support.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Autonomous Refund Limit ($ USD)
              </label>
              <input
                type="number"
                value={maxRefundLimit}
                onChange={(e) => setMaxRefundLimit(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Refunds above this threshold will automatically be sent to a human supervisor for approval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Human Escalation Condition
              </label>
              <select
                value={handoffThreshold}
                onChange={(e) => setHandoffThreshold(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              >
                <option value="High Frustration / Repeated Query">High Frustration / Repeated Query (Recommended)</option>
                <option value="Explicit Manager Request Only">Explicit Manager Request Only</option>
                <option value="After 2 Unsuccessful Attempts">After 2 Unsuccessful Attempts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Response Latency
              </label>
              <input
                type="text"
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveGuardrails}
              >
                Save Guardrails
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* View Full Order Details Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Order Details #12345"
        description="Synchronized from Shopify & Customer CRM"
        size="md"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsOrderModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900">Sara Jenkins (sara@example.com)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination:</span>
              <span className="font-semibold text-slate-900">742 Evergreen Terrace, Springfield, IL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-semibold text-slate-900">FedEx Express Ground (#FDX-994821)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Items:</span>
              <span className="font-semibold text-slate-900">1x Wireless Noise Canceling Headphones ($149.00)</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Inquiry Audit Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Inquiry Audit: ${selectedInquiry.topic}`}
          description={`Customer: ${selectedInquiry.customer} • ${selectedInquiry.channel}`}
          size="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedInquiry(null)}>
              Close Audit
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center justify-between">
                <span>Autonomous Resolution Summary</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {selectedInquiry.time} turnaround
                </span>
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed">{selectedInquiry.summary}</p>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Rating:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> {selectedInquiry.stars} (Verified)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel Origin:</span>
                <span className="font-semibold text-slate-800">{selectedInquiry.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Safety Compliance:</span>
                <span className="font-semibold text-emerald-700">100% Guardrail Passed</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
