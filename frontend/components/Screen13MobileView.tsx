"use client";

import React, { useState } from "react";
import {
  Smartphone,
  MessageSquare,
  Users,
  CalendarCheck,
  Send,
  Bot,
  User,
  ArrowRight,
  Menu,
  Clock,
  ExternalLink
} from "lucide-react";

interface Screen13MobileViewProps {
  isCompact?: boolean;
}

export default function Screen13MobileView({ isCompact = false }: Screen13MobileViewProps) {
  const [mobileInput, setMobileInput] = useState("");
  const [mobileMessages, setMobileMessages] = useState([
    {
      sender: "customer",
      content: "I want to know about your premium plan.",
      time: "10:24 AM"
    },
    {
      sender: "agent",
      content: "Great! Our premium plan starts at $49/month, including all core features plus advanced analytics. Would you like me to show you a detailed comparison?",
      time: "10:25 AM"
    },
    {
      sender: "customer",
      content: "Yes, please.",
      time: "10:26 AM"
    },
    {
      sender: "agent",
      content: "Here's the comparison table:",
      hasPlanCard: true,
      time: "10:27 AM"
    }
  ]);

  const handleMobileSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileInput.trim()) return;

    const text = mobileInput;
    setMobileMessages((prev) => [
      ...prev,
      {
        sender: "customer",
        content: text,
        time: "Just now"
      }
    ]);
    setMobileInput("");

    setTimeout(() => {
      setMobileMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          content: "I've sent an interactive checkout link and invited your team to our onboarding session!",
          time: "Just now"
        }
      ]);
    }, 700);
  };

  return (
    <div className={`w-full bg-slate-100/80 rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Mobile View (Responsive)</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-600" />
              100% Adaptive Viewports
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full platform responsiveness optimized for iOS and Android web apps
          </p>
        </div>
      </div>

      {/* Two Mobile Device Mockups Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center py-6">
        
        {/* Device 1: Mobile Dashboard */}
        <div className="w-[300px] h-[520px] bg-[#071329] rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col justify-between relative overflow-hidden">
          {/* Top Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20"></div>

          {/* Screen Content */}
          <div className="bg-[#F5F8FC] rounded-[24px] h-full flex flex-col overflow-hidden text-slate-800">
            {/* Dark Navy Header */}
            <div className="bg-[#071B3A] text-white p-3 pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#1677FF] to-[#10C8C8] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold tracking-tight">AI Sales Suite</span>
              </div>
              <Menu className="w-4 h-4 text-slate-300" />
            </div>

            {/* Body */}
            <div className="p-3 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs font-bold text-slate-900">Dashboard</div>

              {/* 3 Compact KPI Cards */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500">Convs</div>
                  <div className="text-xs font-bold text-slate-900">2,847</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">+12%</div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500">Leads</div>
                  <div className="text-xs font-bold text-slate-900">642</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">+18%</div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500">Appts</div>
                  <div className="text-xs font-bold text-slate-900">186</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">+24%</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="text-[11px] font-bold text-slate-900 mb-1.5">Recent Activity</div>
                <div className="space-y-1.5">
                  {[
                    { t: "New lead from Website Chat", time: "2m" },
                    { t: "Appointment booked", time: "5m" },
                    { t: "Customer support resolved", time: "12m" }
                  ].map((act, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{act.t}</span>
                      <span className="text-slate-400 shrink-0">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device 2: Mobile Live Chat */}
        <div className="w-[300px] h-[520px] bg-[#071329] rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col justify-between relative overflow-hidden">
          {/* Top Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20"></div>

          {/* Screen Content */}
          <div className="bg-white rounded-[24px] h-full flex flex-col overflow-hidden text-slate-800 justify-between">
            {/* Chat Top Header */}
            <div className="bg-[#071B3A] text-white p-3 pt-6 flex items-center gap-2">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt="Sarah Johnson"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white/30"
                />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">Sarah Johnson</div>
                <div className="text-[9px] text-teal-300">Sales Agent Active</div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-2.5 space-y-2 overflow-y-auto flex-1 text-[11px] bg-slate-50/50">
              {mobileMessages.map((msg, i) => {
                const isCust = msg.sender === "customer";
                return (
                  <div
                    key={i}
                    className={`max-w-[85%] ${isCust ? "ml-auto" : "mr-auto"}`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        isCust
                          ? "bg-[#1677FF] text-white rounded-tr-xs"
                          : "bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-xs"
                      }`}
                    >
                      <p className="leading-tight">{msg.content}</p>

                      {msg.hasPlanCard && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => alert("Opening Premium Plan tier breakdown...")}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <span>View Plan</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Composer */}
            <form onSubmit={handleMobileSend} className="p-2 bg-white border-t border-slate-200 flex items-center gap-1">
              <input
                type="text"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-2.5 py-1.5 bg-slate-100 rounded-full text-[11px] text-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-[#1677FF] text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
