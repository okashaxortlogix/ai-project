"use client";

import React, { useState } from "react";
import {
  Smartphone,
  MessageSquare,
  Phone,
  MessageCircle,
  Volume2,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Bot,
  Send,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

interface Screen13MobileViewProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

interface ChannelItem {
  id: string;
  name: string;
  icon: any;
  status: "Enabled" | "Disabled" | "Connected";
  description: string;
  settings: {
    primaryNumber?: string;
    greetingText?: string;
    widgetPosition?: string;
  };
}

export default function Screen13MobileView({ onNavigate, isCompact = false }: Screen13MobileViewProps) {
  const [channels, setChannels] = useState<ChannelItem[]>([
    {
      id: "webchat",
      name: "Web Chat",
      icon: MessageSquare,
      status: "Enabled",
      description: "Lightweight floating widget deployed on your store and marketing funnels.",
      settings: {
        greetingText: "Hi! Need help with your order or appointment?",
        widgetPosition: "Bottom Right"
      }
    },
    {
      id: "sms",
      name: "SMS",
      icon: Phone,
      status: "Enabled",
      description: "Direct 2-way SMS conversations through your connected Twilio phone number.",
      settings: {
        primaryNumber: "+1 (555) 019-2831",
        greetingText: "Thanks for reaching out! Nexa AI is here to help."
      }
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      status: "Connected",
      description: "Official WhatsApp Cloud API integration for global customer outreach.",
      settings: {
        primaryNumber: "+1 (555) 987-6543",
        greetingText: "Hello! Welcome to our verified WhatsApp channel."
      }
    },
    {
      id: "voice",
      name: "Voice",
      icon: Volume2,
      status: "Enabled",
      description: "Interactive voice response (IVR) and real-time AI speech agent for call routing.",
      settings: {
        primaryNumber: "+1 (800) 555-0199",
        greetingText: "Thank you for calling. Please tell me how I can assist you."
      }
    }
  ]);

  const [configuringChannel, setConfiguringChannel] = useState<ChannelItem | null>(null);
  const [configGreeting, setConfigGreeting] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Mobile Preview Simulation
  const [mobileMessages, setMobileMessages] = useState([
    { sender: "ai", text: "Hi! I'm your AI assistant. How can I help you today?", time: "10:00 AM" }
  ]);
  const [mobileInput, setMobileInput] = useState("");
  const [isMobileTyping, setIsMobileTyping] = useState(false);

  const handleOpenConfig = (channel: ChannelItem) => {
    setConfiguringChannel(channel);
    setConfigGreeting(channel.settings.greetingText || "");
  };

  const handleSaveConfig = () => {
    if (!configuringChannel) return;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === configuringChannel.id
          ? { ...c, settings: { ...c.settings, greetingText: configGreeting } }
          : c
      )
    );
    setSavedSuccess(true);
    setConfiguringChannel(null);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleMobileSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileInput.trim() || isMobileTyping) return;

    const userText = mobileInput.trim();
    setMobileMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, time: "Just now" }
    ]);
    setMobileInput("");
    setIsMobileTyping(true);

    try {
      const res = await api.chatAI({
        message: userText,
        customerName: "Mobile User"
      });

      setMobileMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res?.reply || "Thanks for reaching out! I've logged your request.",
          time: "Just now"
        }
      ]);
    } catch (err) {
      setMobileMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm experiencing a temporary network connection error. Please try again.",
          time: "Just now"
        }
      ]);
    } finally {
      setIsMobileTyping(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Mobile Experience</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Mobile Experience & Omnichannel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage communication channels and customize the responsive customer mobile interface.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Channel settings saved successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Channel Cards, Right Live Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Channels List matching Page 13 */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Active Communication Channels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {channels.map((chan) => {
              const Icon = chan.icon;
              return (
                <Card key={chan.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <StatusBadge variant="active" label={chan.status} />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{chan.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {chan.description}
                      </p>
                    </div>

                    {chan.settings.primaryNumber && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        Number: {chan.settings.primaryNumber}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Sliders}
                      onClick={() => handleOpenConfig(chan)}
                    >
                      Configure
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Mobile Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <h2 className="text-sm font-bold text-slate-900 mb-4 self-start">
            Live Mobile Widget Preview
          </h2>

          <div className="w-[310px] h-[520px] bg-white rounded-[36px] border-4 border-slate-300 shadow-xl flex flex-col overflow-hidden relative">
            {/* Phone Speaker Notch */}
            <div className="h-5 bg-slate-100 flex items-center justify-center">
              <div className="w-16 h-1 bg-slate-300 rounded-full"></div>
            </div>

            {/* Mobile Header */}
            <div className="p-3 bg-blue-600 text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold leading-tight">Nexa Assistant</div>
                <div className="text-[9px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Always online
                </div>
              </div>
            </div>

            {/* Mobile Chat Thread */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50 text-xs">
              {mobileMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "ai" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed text-[11px] ${
                      m.sender === "ai"
                        ? "bg-white border border-slate-200/90 text-slate-800 shadow-2xs"
                        : "bg-blue-600 text-white shadow-2xs"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div
                      className={`text-[8px] mt-0.5 text-right ${
                        m.sender === "ai" ? "text-slate-400" : "text-blue-200"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Input */}
            <form
              onSubmit={handleMobileSend}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 text-[11px] text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Configure Channel Modal */}
      {configuringChannel && (
        <Modal
          isOpen={!!configuringChannel}
          onClose={() => setConfiguringChannel(null)}
          title={`Configure ${configuringChannel.name}`}
          description="Update welcome messaging and routing behaviors."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfiguringChannel(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveConfig}>
                Save Channel
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Channel Greeting Message
              </label>
              <textarea
                rows={3}
                value={configGreeting}
                onChange={(e) => setConfigGreeting(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Channel Status
              </label>
              <div className="flex items-center gap-2">
                <StatusBadge variant="active" label="Enabled & Synced" />
                <span className="text-[11px] text-slate-500">
                  Ready to process incoming mobile interactions
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
