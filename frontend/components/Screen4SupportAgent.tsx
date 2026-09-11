"use client";

import React, { useState } from "react";
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
  Search
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface Screen4SupportAgentProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
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
  const [messages, setMessages] = useState([
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg = {
      id: `usr-${Date.now()}`,
      sender: "customer",
      content: userText,
      time: "Just now"
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "I've checked our database. I can assist you with your order updates and shipping questions.";
      const lower = userText.toLowerCase();

      if (lower.includes("address") || lower.includes("office")) {
        replyText = "Because package #12345 is already in final dispatch with FedEx, direct rerouting must be authorized via FedEx Delivery Manager. I've sent a 1-click update link to your registered mobile number!";
      } else if (lower.includes("return") || lower.includes("refund")) {
        replyText = "We offer 30-day hassle-free returns. Items must be in original condition with tags attached. You can generate a prepaid shipping label directly from your customer portal.";
      } else if (lower.includes("human") || lower.includes("agent") || lower.includes("manager")) {
        replyText = "I understand! I'm transferring this conversation to our senior human support supervisor, Sarah. She will be with you shortly.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "agent",
          content: replyText,
          time: "Just now"
        }
      ]);
      setIsTyping(false);
    }, 900);
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

      {/* TAB 1: OVERVIEW matching Screen 7 */}
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
                  "Answer common questions",
                  "Resolve support tickets",
                  "Search knowledge base",
                  "Hand over to human agent",
                  "Automated live order tracking & delivery status"
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

            {/* Knowledge Base Card */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Knowledge Base
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Articles</div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">24</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Last Updated</div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      Apr 28, 2026
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                  icon={BookOpen}
                  onClick={() => onNavigate?.(9)}
                >
                  Manage Knowledge Base
                </Button>
              </div>
            </Card>
          </div>

          {/* Performance & Quick Launch Row */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Try Support Agent Live
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test conversational order resolution and FAQ matching in the interactive two-column workspace.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => setActiveTab("Conversation")}
              >
                Open Live Chat Sandbox
              </Button>
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
                        <div className="whitespace-pre-line">{m.content}</div>
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-9">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-200"></span>
                    <span className="text-[10px] text-slate-400 ml-1">Support agent is replying...</span>
                  </div>
                )}
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
        description="Synchronized from Shopify & GoHighLevel CRM"
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
