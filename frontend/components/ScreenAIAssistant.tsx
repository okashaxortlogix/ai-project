"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  CheckCircle2,
  ArrowRight,
  Layers,
  MessageSquare,
  Package,
  Calendar as CalendarIcon,
  Play,
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AIActionPlanModal } from "@/components/ui/AIActionPlanModal";

interface ScreenAIAssistantProps {
  onNavigate?: (screen: number) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  time: string;
  actionPlan?: {
    title: string;
    trigger: string;
    actions: string[];
    status?: "pending" | "executed";
  };
}

export default function ScreenAIAssistant({ onNavigate }: ScreenAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "ai-welcome",
      sender: "ai",
      content: "Hi! I'm your AI assistant. How can I help you today?",
      time: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Plan modal state
  const [activePlanModal, setActivePlanModal] = useState<{
    isOpen: boolean;
    title: string;
    trigger: string;
    actions: string[];
  }>({
    isOpen: false,
    title: "",
    trigger: "",
    actions: []
  });

  const quickPrompts = [
    { label: "Help me with a funnel", icon: Layers, query: "Help me with a funnel" },
    { label: "Show recent conversations", icon: MessageSquare, query: "Show recent conversations" },
    { label: "Check orders", icon: Package, query: "Check orders" },
    { label: "Book an appointment", icon: CalendarIcon, query: "Book an appointment" }
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: text,
      time: "Just now"
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: "I've processed your request. How else can I assist your business today?",
        time: "Just now"
      };

      const lower = text.toLowerCase();

      if (lower.includes("funnel") || lower.includes("template")) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: "I can construct and deploy a high-converting lead nurturing funnel directly into your GoHighLevel account. Here is the proposed execution plan:",
          time: "Just now",
          actionPlan: {
            title: "Deploy Lead Nurturing Funnel",
            trigger: "New Opt-in Form Submission",
            actions: [
              "Create high-ticket landing page with VSL video block",
              "Connect conversational qualification chat widget",
              "Set up automated SMS confirmation within 60 seconds",
              "Notify sales manager if budget exceeds $1,000"
            ],
            status: "pending"
          }
        };
      } else if (lower.includes("conversation") || lower.includes("chat")) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: "You have 6 active live conversations today:\n• Sarah Ahmed (Appointment inquiry)\n• Ali Raza (Laptop pricing)\n• Fatima Khan (Order #12345 tracking)\n\nWould you like me to take you to the Live Conversations Inbox?",
          time: "Just now"
        };
      } else if (lower.includes("order")) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: "8 orders have been processed through Shopify & WooCommerce sync today. Order #12345 (Sarah Ahmed) is currently out for delivery via FedEx Express.",
          time: "Just now"
        };
      } else if (lower.includes("appointment") || lower.includes("book")) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: "I have 3 confirmed bookings for tomorrow:\n• 10:00 AM — Sarah Ahmed (Dental Cleaning)\n• 11:30 AM — Ali Raza (Consultation)\n• 02:00 PM — Fatima Khan (Follow-up)\n\nWould you like to reserve a new slot?",
          time: "Just now"
        };
      }

      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 900);
  };

  const handleExecutePlan = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionPlan
          ? {
              ...m,
              actionPlan: { ...m.actionPlan, status: "executed" }
            }
          : m
      )
    );
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header Container matching Screen 10 */}
      <Card className="flex flex-col h-[680px] shadow-sm overflow-hidden">
        {/* Top Assistant Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                Nexa AI
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                AI Assistant
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge variant="active" label="Ready" />
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() =>
                setMessages([
                  {
                    id: "ai-welcome",
                    sender: "ai",
                    content: "Hi! I'm your AI assistant. How can I help you today?",
                    time: "Just now"
                  }
                ])
              }
            >
              Reset Session
            </Button>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8FAFC]/60">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAi ? "justify-start" : "justify-end"}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className="space-y-2 max-w-xl">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? "bg-white border border-slate-200/90 text-slate-800 shadow-2xs"
                        : "bg-blue-600 text-white shadow-2xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isAi ? "text-slate-400" : "text-blue-200"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>

                  {/* AI Action Plan Card */}
                  {m.actionPlan && (
                    <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3 shadow-2xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">
                            {m.actionPlan.title}
                          </span>
                        </div>
                        {m.actionPlan.status === "executed" ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Executed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Plan Ready
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Trigger:</span>{" "}
                          {m.actionPlan.trigger}
                        </div>
                        <div className="font-semibold text-slate-700 pt-1">Steps:</div>
                        <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11px] text-slate-600">
                          {m.actionPlan.actions.map((act, idx) => (
                            <li key={idx}>{act}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {m.actionPlan.status === "executed" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={ExternalLink}
                            onClick={() => onNavigate?.(14)}
                          >
                            Open Funnels & Workflows
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setActivePlanModal({
                                  isOpen: true,
                                  title: m.actionPlan!.title,
                                  trigger: m.actionPlan!.trigger,
                                  actions: m.actionPlan!.actions
                                })
                              }
                            >
                              Review Plan
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Play}
                              onClick={() => handleExecutePlan(m.id)}
                            >
                              Execute Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></span>
              <span className="text-[11px]">Nexa AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Actions Pills matching Screen 10 */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => handleSend(p.query)}
                className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 transition-all text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5 text-blue-500" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Input Box matching Screen 10 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
        >
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Attach file or context"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <Button type="submit" variant="primary" size="md" icon={Send}>
            Send
          </Button>
        </form>
      </Card>

      {/* Global AI Action Plan Review Modal */}
      <AIActionPlanModal
        isOpen={activePlanModal.isOpen}
        onClose={() => setActivePlanModal((prev) => ({ ...prev, isOpen: false }))}
        title={activePlanModal.title}
        trigger={activePlanModal.trigger}
        actions={activePlanModal.actions}
        onExecute={() => {
          setActivePlanModal((prev) => ({ ...prev, isOpen: false }));
          alert("Workflow dispatched and deployed to your GoHighLevel sub-account!");
        }}
      />
    </div>
  );
}
