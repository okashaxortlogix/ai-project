"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Headphones,
  Check,
  CheckCircle2,
  Package,
  Truck,
  ExternalLink,
  HelpCircle,
  Clock,
  Send,
  Sliders,
  BookOpen,
  ArrowRight,
  Sparkles,
  Paperclip,
  Mic,
  RefreshCw,
  Search,
  Star,
  Zap,
  TrendingUp,
  ShieldCheck,
  FileText,
  Layers,
  Bot,
  UserCheck,
  AlertCircle
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
}

export default function Screen4SupportAgent({ onNavigate, isCompact = false }: Screen4SupportAgentProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Conversation" | "Knowledge" | "Settings">("Overview");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Config parameters
  const [agentName, setAgentName] = useState("Support Agent");
  const [handoffThreshold, setHandoffThreshold] = useState("High Frustration / Repeated Query");
  const [responseTime, setResponseTime] = useState("Immediate (< 1.2s)");
  const [configSaved, setConfigSaved] = useState(false);

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
      content: "Let me check that for you! I found your order #12345. It's currently out for delivery and is expected to arrive tomorrow with FedEx Express tracking #FDX-994821.",
      time: "10:15 AM"
    },
    {
      id: "sup-3",
      sender: "customer",
      content: "Can I change the delivery address to my office?",
      time: "10:17 AM"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll on new messages or generation updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    const newMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      sender: "customer",
      content: userText,
      time: "Just now"
    };

    // 1. Immediately show user's message and clear input
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await api.chatAI({
        message: userText,
        agentType: "support",
        customerName: "Sara Jenkins",
        conversationId: "conv-support-sandbox",
        history: messages.slice(-5).map((m) => ({
          role: m.sender === "customer" ? "user" : "assistant",
          content: m.content
        }))
      });

      const replyText = res.reply || "I've checked our records and can assist you with your order updates and shipping inquiries.";
      const aiId = `ai-${Date.now()}`;

      // 2. Hide typing dots and insert empty streaming placeholder
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: aiId,
          sender: "agent",
          content: "",
          isStreaming: true,
          time: "Just now"
        }
      ]);

      // 3. Smooth word-by-word streaming typewriter animation
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
          time: "Just now"
        }
      ]);
    }
  };

  const handleFaqClick = (faqQuestion: string) => {
    setChatInput(faqQuestion);
  };

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setIsConfigModalOpen(false);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Header matching Screen 7 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Support Agent</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Agent</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Resolve customer questions, shipping issues and order requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant="active" label="Active" />
            <Button
              variant="primary"
              size="sm"
              icon={Sliders}
              onClick={() => setIsConfigModalOpen(true)}
            >
              Configure
            </Button>
          </div>
        </div>
      </div>

      {configSaved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Support agent configuration updated successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: "Overview", label: "Overview" },
          { id: "Conversation", label: "Live Chat Sandbox" },
          { id: "Knowledge", label: "Knowledge Base" },
          { id: "Settings", label: "Settings" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW - ENTERPRISE SUPPORT OPERATIONS WORKBENCH */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* 1. Executive Performance KPIs Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3.5 border-slate-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Auto-Resolution
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900">98.4%</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ↑ 3.2%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5 border-slate-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Avg First Response
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900">0.8s</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Instant AI
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5 border-slate-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                <Star className="w-5 h-5 fill-violet-500 text-violet-500" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  CSAT Rating
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900">4.9 / 5.0</span>
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                    98% High
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3.5 border-slate-200/80 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Orders Tracked
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900">412</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    Shopify Live
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* 2. Live Support Operations Workbench (Interactive Chat + Order Grounding) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Embedded Interactive Support Copilot */}
            <div className="lg:col-span-7">
              <Card className="flex flex-col h-[580px] border-slate-200/80 shadow-sm">
                {/* Copilot Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Live Support Copilot</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                          RAG Active
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Autonomous Agent Online
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setMessages([
                          {
                            id: `reset-${Date.now()}`,
                            sender: "agent",
                            content: "Hello! How can I help you today with your order or shipping questions?",
                            time: "Just now"
                          }
                        ])
                      }
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Quick Interactive Prompt Chips */}
                <div className="px-3.5 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 font-medium shrink-0">Try:</span>
                  {[
                    "Where is my order #12345?",
                    "What is your 30-day return policy?",
                    "Can I change my delivery address?"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFaqClick(chip)}
                      className="shrink-0 px-2.5 py-1 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-full border border-slate-200/80 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message Transcript */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]/60">
                  {messages.map((m) => {
                    const isAgent = m.sender === "agent";
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
                      >
                        {isAgent && (
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                            <Headphones className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                            isAgent
                              ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                              : "bg-blue-600 text-white rounded-tr-xs font-medium"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.isStreaming && (
                            <span className="inline-block w-1.5 h-3 ml-0.5 bg-blue-600 animate-pulse align-middle" />
                          )}
                          <div
                            className={`text-[9px] mt-1 ${
                              isAgent ? "text-slate-400" : "text-blue-200"
                            }`}
                          >
                            {m.time}
                          </div>
                        </div>

                        {!isAgent && (
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            C
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
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Interactive Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type an order question or test customer inquiry..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isListening
                          ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Speak message"}
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

            {/* Right Column: Context & Fulfillment Grounding Deck */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 1: Real-Time Shopify Order Tracker */}
              <Card className="p-4 border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Order #12345</div>
                      <div className="text-[10px] text-slate-400 font-medium">Shopify Fulfillment Sync</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Out for Delivery
                  </span>
                </div>

                {/* Timeline Stepper */}
                <div className="py-3 px-1">
                  <div className="relative pl-6 space-y-3.5 border-l-2 border-emerald-500">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"></div>
                      <div className="text-[11px] font-bold text-slate-800">Order Confirmed & Packed</div>
                      <div className="text-[10px] text-slate-400">Yesterday, 2:30 PM • Warehouse A</div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"></div>
                      <div className="text-[11px] font-bold text-slate-800">In Transit with FedEx Express</div>
                      <div className="text-[10px] text-slate-400">Tracking: #FDX-994821 • Memphis Hub</div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-200 shadow-2xs"></div>
                      <div className="text-[11px] font-bold text-blue-900">Out for Delivery</div>
                      <div className="text-[10px] text-blue-700 font-medium">Expected Tomorrow by 2:00 PM</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    Destination: <span className="font-semibold text-slate-700">Springfield, IL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    View Details <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </Card>

              {/* Card 2: Active RAG Knowledge Sources */}
              <Card className="p-4 border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-900">Grounded Knowledge Documents</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">3 Sources Synced</span>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Shipping_Delivery_Policy_2026.pdf", chunks: "14 chunks", conf: "99% match" },
                    { name: "Return_Refund_SLA_Guidelines.docx", chunks: "9 chunks", conf: "98% match" },
                    { name: "Shopify_Order_Lookup_Webhook.json", chunks: "Live API", conf: "Real-time" }
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800 text-[11px] truncate">
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">{doc.chunks}</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">
                          {doc.conf}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Card 3: AI Safety Guardrails & Escalation Rules */}
              <Card className="p-4 border-slate-200/80 shadow-xs bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">AI Guardrails & Human Handover</span>
                </div>

                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Autonomous Refund Limit:</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Up to $50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Human Escalation Trigger:</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">2 Unresolved Queries</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sentiment Guardrail:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Frustration Shield Active</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 3. Recent Autonomously Resolved Inquiries Activity Feed */}
          <Card className="p-5 border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Recent Resolved Customer Inquiries</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live activity log of queries autonomously resolved by the Support Copilot.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Auto-updated 10s ago</span>
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Inquiry Topic</th>
                    <th className="pb-2">Channel</th>
                    <th className="pb-2">Resolution Time</th>
                    <th className="pb-2">CSAT</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    {
                      customer: "Sarah Ahmed",
                      email: "sarah@gmail.com",
                      topic: "Order #12345 delivery tracking status",
                      channel: "Shopify Store",
                      time: "38s",
                      stars: "5.0 ⭐",
                      status: "Autonomous"
                    },
                    {
                      customer: "Michael Vance",
                      email: "m.vance@tech.co",
                      topic: "Return shipping label generation",
                      channel: "Live Web Chat",
                      time: "1m 14s",
                      stars: "5.0 ⭐",
                      status: "Autonomous"
                    },
                    {
                      customer: "Ali Raza",
                      email: "ali.raza@outlook.com",
                      topic: "Delivery address update to office",
                      channel: "WhatsApp",
                      time: "45s",
                      stars: "4.8 ⭐",
                      status: "Autonomous"
                    },
                    {
                      customer: "Emily Watson",
                      email: "emily.w@design.io",
                      topic: "Headphone warranty coverage question",
                      channel: "Email Ticket",
                      time: "1m 02s",
                      stars: "5.0 ⭐",
                      status: "Autonomous"
                    }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-slate-900">{row.customer}</div>
                        <div className="text-[10px] text-slate-400">{row.email}</div>
                      </td>
                      <td className="py-2.5 font-medium text-slate-800">{row.topic}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {row.channel}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-600">{row.time}</td>
                      <td className="py-2.5 font-bold text-amber-600">{row.stars}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: CONVERSATION (Two-Column Layout: Left Chat, Right Order Details & FAQs) */}
      {activeTab === "Conversation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chat Area */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[560px]">
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Support Agent</div>
                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online • Ready to assist
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setMessages([
                      {
                        id: "reset-1",
                        sender: "agent",
                        content: "Hello! How can I help you today with your order or questions?",
                        time: "Just now"
                      }
                    ])
                  }
                >
                  Clear Sandbox
                </Button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]/50">
                {messages.map((m) => {
                  const isAgent = m.sender === "agent";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
                    >
                      {isAgent && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs leading-relaxed ${
                          isAgent
                            ? "bg-white border border-slate-200/90 text-slate-800 shadow-2xs"
                            : "bg-blue-600 text-white shadow-2xs"
                        }`}
                      >
                        <div className="whitespace-pre-line">
                          {m.content}
                          {m.isStreaming && (
                            <span className="inline-block w-1.5 h-3 bg-blue-600 rounded-xs animate-pulse ml-0.5 align-middle" />
                          )}
                        </div>
                        <div
                          className={`text-[9px] mt-1 text-right ${
                            isAgent ? "text-slate-400" : "text-blue-200"
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-9 animate-in fade-in duration-200">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></span>
                    <span className="text-[10px] text-slate-400 ml-1">Generating response...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Ask support agent..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Context / Order Details */}
          <div className="space-y-4">
            {/* Order Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">Order Details</div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Live Shopify Sync
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Number</span>
                  <span className="font-semibold text-slate-900">#12345</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                    Out for Delivery
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Est. Delivery</span>
                  <span className="font-semibold text-slate-800">Tomorrow, Apr 29</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tracking</span>
                  <span className="font-mono text-[11px] text-blue-600 font-semibold">
                    FDX-994821
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center text-xs mt-2"
                onClick={() => setIsOrderModalOpen(true)}
              >
                View Full Details
              </Button>
            </Card>

            {/* Related FAQs */}
            <Card className="p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-100">
                Related FAQs
              </div>
              {[
                "Shipping Policy",
                "Return Policy",
                "Track My Order"
              ].map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleFaqClick(faq)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs text-slate-700 font-medium flex items-center justify-between group cursor-pointer"
                >
                  <span>{faq}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE */}
      {activeTab === "Knowledge" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Support Knowledge Grounding</h2>
              <p className="text-xs text-slate-500">
                Documents currently indexed to formulate real-time support answers.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigate?.(9)}>
              Manage Knowledge Base
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { title: "Standard Return Policy 2026.pdf", chunks: "14 chunks", status: "Indexed" },
              { title: "Domestic & International Shipping FAQ.docx", chunks: "9 chunks", status: "Indexed" },
              { title: "Warranty Coverage & Replacement Terms.pdf", chunks: "18 chunks", status: "Indexed" }
            ].map((doc, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{doc.title}</div>
                  <div className="text-[10px] text-slate-400">{doc.chunks} • Embeddings: text-embedding-3-small</div>
                </div>
                <StatusBadge variant="active" label={doc.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "Settings" && (
        <Card className="p-6 max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Agent Escalation & Response Parameters
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Human Escalation Trigger
            </label>
            <input
              type="text"
              value={handoffThreshold}
              onChange={(e) => setHandoffThreshold(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Response Latency
            </label>
            <input
              type="text"
              value={responseTime}
              onChange={(e) => setResponseTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            />
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => setActiveTab("Overview")}>
              Save Settings
            </Button>
          </div>
        </Card>
      )}

      {/* Configure Agent Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Support Agent"
        description="Adjust autonomous resolution thresholds and integrations."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveConfig}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Handoff Condition
            </label>
            <select
              value={handoffThreshold}
              onChange={(e) => setHandoffThreshold(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="High Frustration / Repeated Query">
                High Frustration / Repeated Query
              </option>
              <option value="Explicit Manager Request Only">
                Explicit Manager Request Only
              </option>
              <option value="After 2 Unsuccessful Attempts">
                After 2 Unsuccessful Attempts
              </option>
            </select>
          </div>
        </div>
      </Modal>

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
          <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900">Sarah Ahmed (sarah@gmail.com)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination:</span>
              <span className="font-semibold text-slate-900">742 Evergreen Terrace, Springfield</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-semibold text-slate-900">FedEx Express Ground</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Items:</span>
              <span className="font-semibold text-slate-900">1x Wireless Noise Canceling Headphones</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
