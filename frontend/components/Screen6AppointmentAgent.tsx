"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarDays,
  Send,
  CalendarCheck,
  RotateCcw,
  Ban,
  Share2,
  Check
} from "lucide-react";

interface Screen6AppointmentAgentProps {
  isCompact?: boolean;
}

export default function Screen6AppointmentAgent({ isCompact = false }: Screen6AppointmentAgentProps) {
  const [selectedSlot, setSelectedSlot] = useState("2:00 PM");
  const [appointmentStatus, setAppointmentStatus] = useState<"Confirmed" | "Rescheduled" | "Cancelled">("Confirmed");
  const [syncedCalendar, setSyncedCalendar] = useState<"Google" | "Outlook" | null>("Google");
  const [messages, setMessages] = useState([
    {
      id: "apt-1",
      sender: "customer",
      content: "I want to book a demo.",
      time: "10:20 AM"
    },
    {
      id: "apt-2",
      sender: "agent",
      content: "Sure! I'd be happy to help you book a demo. What day works best for you?",
      time: "10:21 AM"
    },
    {
      id: "apt-3",
      sender: "customer",
      content: "Tomorrow works for me.",
      time: "10:22 AM"
    },
    {
      id: "apt-4",
      sender: "agent",
      content: "Here are the available slots for tomorrow:\n• 10:00 AM\n• 11:30 AM\n• 2:00 PM\n• 4:30 PM\n\nWhich one would you like to choose?",
      hasSlots: true,
      time: "10:23 AM"
    },
    {
      id: "apt-5",
      sender: "customer",
      content: "2:00 PM",
      time: "10:24 AM"
    },
    {
      id: "apt-6",
      sender: "agent",
      content: "Perfect! Your demo is booked for tomorrow at 2:00 PM. You will receive a calendar invite shortly.",
      time: "10:25 AM"
    }
  ]);

  const [input, setInput] = useState("");

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setAppointmentStatus("Confirmed");

    setMessages((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        sender: "customer",
        content: `I'd prefer ${slot}, please.`,
        time: "Just now"
      },
      {
        id: `a-${Date.now() + 1}`,
        sender: "agent",
        content: `Excellent! I have locked in ${slot} for tomorrow, Apr 29, 2025. Synced with Google Calendar & Outlook.`,
        time: "Just now"
      }
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "customer",
        content: userText,
        time: "Just now"
      }
    ]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "agent",
          content: "I have updated your scheduling preferences. A calendar invite with Google Meet link has been dispatched to your email.",
          time: "Just now"
        }
      ]);
    }, 700);
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Banner */}
      <div className="p-3.5 bg-[#1E143A] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 text-white">
              Appointment Agent
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-purple-200">
              Calendar Booking & Two-Way Real-time Synchronization
            </p>
          </div>
        </div>

        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-medium">
          Live Calendar Sync
        </span>
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Left Chat Window */}
        <div className="md:col-span-7 p-4 flex flex-col justify-between border-r border-slate-200 bg-slate-50/50">
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {messages.map((m) => {
              const isCust = m.sender === "customer";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    isCust ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isCust ? "bg-blue-600 text-white" : "bg-[#8B5CF6] text-white"
                    }`}
                  >
                    {isCust ? "U" : <Calendar className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isCust
                          ? "bg-[#1677FF] text-white rounded-tr-xs"
                          : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>

                      {/* Interactive Time Slot Pills if applicable */}
                      {m.hasSlots && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <div className="text-[10px] text-slate-500 font-semibold mb-1.5">
                            Click to select a slot:
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"].map((slot) => (
                              <button
                                key={slot}
                                onClick={() => handleSelectSlot(slot)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  selectedSlot === slot
                                    ? "bg-[#8B5CF6] text-white shadow-xs"
                                    : "bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{slot}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Chat Input */}
          <form onSubmit={handleSend} className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask appointment agent (e.g. 'Can we reschedule to Friday?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-[#8B5CF6] hover:bg-purple-700 text-white transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Appointment Details & Calendar Integrations */}
        <div className="md:col-span-5 p-4 bg-white flex flex-col justify-between space-y-4">
          {/* Appointment Details Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span>Appointment Details</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  appointmentStatus === "Confirmed"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : appointmentStatus === "Rescheduled"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {appointmentStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Appointment:</span>
                <span className="font-semibold text-slate-800">Demo Call</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Date:</span>
                <span className="font-semibold text-slate-800">Tomorrow, Apr 29, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Time:</span>
                <span className="font-semibold text-purple-700">
                  {selectedSlot} - {selectedSlot === "2:00 PM" ? "2:30 PM" : "End"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Calendar:</span>
                <span className="font-medium text-slate-700">Google Calendar</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/80">
              <button
                onClick={() => {
                  setAppointmentStatus("Rescheduled");
                  alert("Rescheduling mode enabled! Choose a new slot from the options above.");
                }}
                className="py-1.5 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reschedule</span>
              </button>

              <button
                onClick={() => {
                  setAppointmentStatus("Cancelled");
                  alert("Appointment cancelled. Customer and team notified.");
                }}
                className="py-1.5 px-2.5 bg-white hover:bg-red-50 border border-slate-200 text-red-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Ban className="w-3 h-3 text-red-500" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Add to Calendar Section */}
          <div>
            <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Add to Calendar</span>
              <span className="text-[10px] text-slate-400 font-normal">One-click sync</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSyncedCalendar("Google");
                  alert("Added to Google Calendar with Meet link!");
                }}
                className={`w-full p-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  syncedCalendar === "Google"
                    ? "bg-blue-50/60 border-blue-300 text-blue-900"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    G
                  </div>
                  <span>Google Calendar</span>
                </div>
                {syncedCalendar === "Google" && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              <button
                onClick={() => {
                  setSyncedCalendar("Outlook");
                  alert("Added to Outlook 365 calendar!");
                }}
                className={`w-full p-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  syncedCalendar === "Outlook"
                    ? "bg-blue-50/60 border-blue-300 text-blue-900"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#0078D4] text-white flex items-center justify-center text-[10px] font-bold">
                    O
                  </div>
                  <span>Outlook</span>
                </div>
                {syncedCalendar === "Outlook" && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
