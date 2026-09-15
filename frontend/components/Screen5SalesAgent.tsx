"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  Check,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Sliders,
  Sparkles,
  Send,
  Star,
  Target,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { productsList, Product } from "@/lib/data";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";

interface Screen5SalesAgentProps {
  onAddToCart?: (product: Product) => void;
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

export default function Screen5SalesAgent({
  onAddToCart,
  onNavigate,
  isCompact = false
}: Screen5SalesAgentProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Lead Scoring" | "Live Sales Chat" | "Settings">("Overview");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Sales config
  const [agentTone, setAgentTone] = useState("Consultative & Persuasive");
  const [autoDiscountPercent, setAutoDiscountPercent] = useState("10%");
  const [leadThreshold, setLeadThreshold] = useState("80");
  const [minBudget, setMinBudget] = useState("$500");
  const [autoDiscount, setAutoDiscount] = useState("10% Welcome Promo (CODE: NEXA10)");
  const [pitchAggressiveness, setPitchAggressiveness] = useState("Consultative (Value-first)");

  // Live Chat Sandbox state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "ai-1",
      sender: "agent",
      content: "Hi there! I'm your AI Sales Specialist. Looking for laptop recommendations, team hardware bundles, or discount pricing?",
      time: "10:14 AM"
    },
    {
      id: "usr-1",
      sender: "customer",
      content: "I need a fast laptop with all-day battery under $800.",
      time: "10:15 AM"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const newMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      sender: "customer",
      content: userText,
      time: "Just now"
    };

    // 1. Immediately show user's message and clear input
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.chatAI({
        message: userText,
        agentType: "sales",
        customerName: "Alex Mercer",
        conversationId: "conv-sales-sandbox",
        history: messages.slice(-5).map((m) => ({
          role: m.sender === "customer" ? "user" : "assistant",
          content: m.content
        }))
      });

      // If user confirms buy/add and onAddToCart is provided
      const lower = userText.toLowerCase();
      if ((lower.includes("buy") || lower.includes("add") || lower.includes("cart")) && onAddToCart) {
        if (lower.includes("macbook") || lower.includes("m1")) {
          const item = productsList.find((p) => p.id.includes("macbook")) || productsList[0];
          onAddToCart(item);
          setAddedItem(item.id);
          setTimeout(() => setAddedItem(null), 2500);
        } else if (lower.includes("dell")) {
          const item = productsList.find((p) => p.id.includes("dell")) || productsList[1];
          onAddToCart(item);
          setAddedItem(item.id);
          setTimeout(() => setAddedItem(null), 2500);
        }
      }

      const replyText = res.reply || "I am currently unable to retrieve product recommendations. Please check back shortly.";
      const aiId = `ai-${Date.now()}`;

      // 2. Hide typing indicator and insert streaming placeholder
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

      // 3. Stream text smoothly word by word
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
          content: "I'm having a brief issue retrieving catalog pricing. Please give me a second and try again!",
          time: "Just now"
        }
      ]);
    }
  };

  const handleAddToCartClick = (prod: Product) => {
    if (onAddToCart) onAddToCart(prod);
    setAddedItem(prod.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setIsConfigModalOpen(false);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Header matching Screen 8 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Sales Agent</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Agent</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualify leads, handle objections and close sales.
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
          <span>Sales agent parameters updated successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: "Overview", label: "Overview" },
          { id: "Lead Scoring", label: "Lead Scoring" },
          { id: "Live Sales Chat", label: "Live Sales Sandbox" },
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

      {/* TAB 1: OVERVIEW matching Screen 8 */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capabilities Card */}
            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Capabilities
              </h2>
              <ul className="space-y-3 text-xs text-slate-700">
                {[
                  "Qualify incoming leads",
                  "Answer product questions",
                  "Handle objections",
                  "Schedule appointments",
                  "Cross-sell & upsell relevant accessories"
                ].map((cap, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Performance Card with Chart matching Screen 8 */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Performance
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Leads Handled</span>
                    <span className="text-xl font-bold text-slate-900">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Conversion Rate</span>
                    <span className="text-xl font-bold text-emerald-600">18%</span>
                  </div>
                </div>
              </div>

              {/* Minimal SVG Sparkline Chart */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="text-[10px] text-slate-400 font-medium mb-1">Sales Value Trend</div>
                <div className="h-16 w-full flex items-end">
                  <svg viewBox="0 0 300 60" className="w-full h-full overflow-visible">
                    <path
                      d="M 0,50 Q 50,45 80,35 T 160,25 T 220,15 T 300,5"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 0,50 Q 50,45 80,35 T 160,25 T 220,15 T 300,5 L 300,60 L 0,60 Z"
                      fill="url(#salesGrad)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Action Row */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Test Live Sales Discovery
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Engage the sales agent with budget inquiries, objection scenarios, and 1-click cart adds.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => setActiveTab("Live Sales Chat")}
              >
                Open Sales Sandbox
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: LEAD SCORING */}
      {activeTab === "Lead Scoring" && (
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Automated Lead Scoring Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                tier: "High Intent (Score 80-100)",
                badge: "Qualified",
                criteria: "Budget confirmed > $500, timeline < 7 days, requested live booking or checkout.",
                action: "Route directly to Appointment Agent or Senior Closer."
              },
              {
                tier: "Medium Intent (Score 50-79)",
                badge: "Nurture",
                criteria: "Comparing products, budget flexible, requested pricing sheet.",
                action: "Send automated email sequence with customer reviews and 10% coupon."
              },
              {
                tier: "Low Intent (Score 0-49)",
                badge: "Browsing",
                criteria: "General questions, no budget specified, high silence intervals.",
                action: "Log conversation, trigger gentle 24h follow-up check-in."
              }
            ].map((tier, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{tier.badge}</span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {tier.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{tier.criteria}</p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                  <span className="font-semibold text-slate-700">Action:</span> {tier.action}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: LIVE SALES CHAT */}
      {activeTab === "Live Sales Chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[520px]">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Sales Copilot</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse" />
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Specialized Domain: Laptops &amp; Hardware Catalog (Apple MacBook &amp; Dell Inspiron Systems)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Promo: NEXA10 active
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMessages([
                          {
                            id: `reset-${Date.now()}`,
                            sender: "agent",
                            content: "Hi there! I'm your AI Sales Specialist. Looking for laptop recommendations, team hardware bundles, or discount pricing?",
                            time: "Just now"
                          }
                        ])
                      }
                      className="text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Topic Exploration Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 border-t border-slate-200/50">
                  <span className="text-slate-400 font-medium shrink-0">Explore:</span>
                  {[
                    { label: "MacBook Air M1", text: "i am looking for a macbook" },
                    { label: "MacBook Battery Life", text: "How long does the MacBook battery last?" },
                    { label: "MacBook for Coding", text: "Is the MacBook Air good for programming?" },
                    { label: "Dell Inspiron 15", text: "Tell me about the Dell Inspiron 15" },
                    { label: "Compare Both", text: "Compare the MacBook Air M1 vs Dell Inspiron 15" }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInput(chip.text)}
                      className="shrink-0 px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded border border-slate-200 text-[10.5px] transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]/50">
                {messages.map((m) => {
                  const isAgent = m.sender === "agent";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
                    >
                      {isAgent && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs leading-relaxed ${
                          isAgent
                            ? "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                            : "bg-blue-600 text-white shadow-2xs"
                        }`}
                      >
                        <div className="whitespace-pre-line">
                          {m.content.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\*+/g, "")}
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

              <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask product recommendation or objection..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Recommended Catalog */}
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                Recommended Catalog
              </div>
              {productsList.slice(0, 2).map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">{prod.category}</div>
                    </div>
                    <span className="text-xs font-bold text-blue-600">${prod.price}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs"
                    icon={ShoppingCart}
                    onClick={() => handleAddToCartClick(prod)}
                  >
                    {addedItem === prod.id ? "Added to Cart!" : "Add to Order"}
                  </Button>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "Settings" && (
        <Card className="p-6 max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Sales Triggers & Promo Settings
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Budget Qualifying Threshold
            </label>
            <input
              type="text"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Promo Code
            </label>
            <input
              type="text"
              value={autoDiscount}
              onChange={(e) => setAutoDiscount(e.target.value)}
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

      {/* Configure Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Sales Agent"
        description="Set lead qualification thresholds and closing prompts."
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sales Approach Strategy
            </label>
            <select
              value={pitchAggressiveness}
              onChange={(e) => setPitchAggressiveness(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="Consultative (Value-first)">Consultative (Value-first)</option>
              <option value="Direct Closer (Promo & Urgency)">Direct Closer (Promo & Urgency)</option>
              <option value="Passive Advisor (Inbound support only)">Passive Advisor (Inbound support only)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Auto-Offer Welcome Promo
            </label>
            <input
              type="text"
              value={autoDiscount}
              onChange={(e) => setAutoDiscount(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
