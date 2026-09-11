"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Sliders,
  CalendarCheck,
  ArrowRight,
  User,
  MoreVertical,
  X,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";

interface Screen6AppointmentAgentProps {
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

interface AppointmentItem {
  id: string;
  time: string;
  customer: string;
  email: string;
  appointmentType: string;
  status: "Confirmed" | "Pending" | "Rescheduled" | "Cancelled";
}

export default function Screen6AppointmentAgent({ onNavigate, isCompact = false }: Screen6AppointmentAgentProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Availability" | "Live Booking Chat" | "Settings">("Overview");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  // Appointments List loaded from real database
  const [appointments, setAppointments] = useState<AppointmentItem[]>([
    {
      id: "apt-1",
      time: "10:00 AM",
      customer: "Sarah Ahmed",
      email: "sarah@gmail.com",
      appointmentType: "Dental Cleaning",
      status: "Confirmed"
    },
    {
      id: "apt-2",
      time: "11:30 AM",
      customer: "Ali Raza",
      email: "ali.raza@acme.com",
      appointmentType: "Consultation",
      status: "Confirmed"
    },
    {
      id: "apt-3",
      time: "02:00 PM",
      customer: "Fatima Khan",
      email: "fatima@acme.com",
      appointmentType: "Follow-up",
      status: "Confirmed"
    }
  ]);

  const loadAppointments = async () => {
    try {
      const res = await api.getAppointments();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAppointments(
          res.data.map((a: any) => ({
            id: a.id || `apt-${Date.now()}`,
            time: a.time || "10:00 AM",
            customer: a.customer_name || a.customer || "Client",
            email: a.email || "client@company.com",
            appointmentType: a.service || a.title || "Consultation",
            status: (a.status as any) || "Confirmed"
          }))
        );
      }
    } catch (err) {
      console.warn("Could not load appointments from API:", err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Form state for creating appointment
  const [newCustomer, setNewCustomer] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTime, setNewTime] = useState("03:30 PM");
  const [newType, setNewType] = useState("Discovery Call");

  // Config parameters
  const [bufferTime, setBufferTime] = useState("15 minutes");
  const [meetingDuration, setMeetingDuration] = useState("30 minutes");
  const [syncedCalendar, setSyncedCalendar] = useState("Google Calendar (Primary)");

  // Interactive Live Chat Sandbox
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m-1",
      sender: "customer",
      content: "Hi, I'd like to book an appointment for dental cleaning this week.",
      time: "09:42 AM"
    },
    {
      id: "m-2",
      sender: "agent",
      content: "Hello Sarah! I'd be happy to schedule your Dental Cleaning. We have the following slots open tomorrow:\n• 10:00 AM\n• 11:30 AM\n• 02:00 PM\n\nWhich time works best for you?",
      time: "09:43 AM"
    },
    {
      id: "m-3",
      sender: "customer",
      content: "10:00 AM is great for me.",
      time: "09:45 AM"
    },
    {
      id: "m-4",
      sender: "agent",
      content: "Done! Your Dental Cleaning is confirmed for tomorrow at 10:00 AM. I've dispatched calendar invitations and an SMS confirmation.",
      time: "09:45 AM"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // 1. Immediately display user's message and reset input
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await api.chatAI({
        message: userText,
        agentType: "appointment",
        customerName: "Sarah Ahmed",
        conversationId: "conv-apt-sandbox",
        history: messages.slice(-5).map((m) => ({
          role: m.sender === "customer" ? "user" : "assistant",
          content: m.content
        }))
      });

      if (res.toolExecuted && res.toolExecuted.toolName === "create_appointment") {
        await loadAppointments();
      }

      const replyText = res.reply || "I can help check our real-time calendar availability or reschedule any confirmed slot.";
      const aiId = `ai-${Date.now()}`;

      // 2. Hide typing indicator and insert empty streaming placeholder
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
          content: "I'm having trouble syncing with the calendar service. Please retry in a moment.",
          time: "Just now"
        }
      ]);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newEmail.trim()) return;

    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      time: newTime,
      customer: newCustomer,
      email: newEmail,
      appointmentType: newType,
      status: "Confirmed"
    };

    setAppointments((prev) => [...prev, newApt]);
    try {
      await api.createAppointment({
        title: newType,
        customer_name: newCustomer,
        email: newEmail,
        date: "Tomorrow",
        time: newTime,
        service: newType,
        provider: syncedCalendar.split(" ")[0] || "Google"
      });
      loadAppointments();
    } catch (err) {
      console.warn("Could not persist appointment to API:", err);
    }

    setNewCustomer("");
    setNewEmail("");
    setIsNewBookingModalOpen(false);
  };

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setIsConfigModalOpen(false);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb & Header matching Screen 9 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Appointment Agent</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Appointment Agent
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Book and manages appointments automatically.
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
          <span>Calendar and booking rules updated successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: "Overview", label: "Overview" },
          { id: "Availability", label: "Availability & Buffer" },
          { id: "Live Booking Chat", label: "Live Booking Sandbox" },
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

      {/* TAB 1: OVERVIEW matching Screen 9 */}
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
                  "Check available slots",
                  "Book appointments",
                  "Send confirmations",
                  "Reschedule / cancel",
                  "Real-time Google & GHL Calendar synchronization"
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

            {/* Upcoming Appointments Card matching Screen 9 */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    Upcoming Appointments
                  </h2>
                  <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Booking
                  </button>
                </div>

                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                          {apt.time}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{apt.appointmentType}</div>
                          <div className="text-[11px] text-slate-500">{apt.customer}</div>
                        </div>
                      </div>
                      <StatusBadge variant="active" label={apt.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate?.(8)}
                >
                  View Full Calendar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsNewBookingModalOpen(true)}
                >
                  Create Appointment
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Action Link to Sandbox */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Simulate Booking Conversation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test autonomous booking, rescheduling, and cancellation responses in real-time.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => setActiveTab("Live Booking Chat")}
              >
                Open Booking Sandbox
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: AVAILABILITY & BUFFER */}
      {activeTab === "Availability" && (
        <Card className="p-6 space-y-6 max-w-3xl">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Booking Windows & Working Hours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Days
              </label>
              <div className="text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                Monday — Saturday (9:00 AM – 6:00 PM PKT)
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buffer Between Meetings
              </label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
              >
                <option value="10 minutes">10 minutes</option>
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: LIVE BOOKING CHAT */}
      {activeTab === "Live Booking Chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[520px]">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Appointment Agent</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      ● Active • Calendar synced
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Google Calendar Synced</span>
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
                    <span className="text-[10px] text-slate-400 ml-1">Checking calendar availability...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about slots, book, or reschedule..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                Quick Test Prompts
              </div>
              {[
                "What slots are open tomorrow?",
                "Can you reschedule my appointment to 2 PM?",
                "Cancel my reservation for dental cleaning."
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(q)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs text-slate-700 cursor-pointer block"
                >
                  "{q}"
                </button>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "Settings" && (
        <Card className="p-6 max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Calendar Integration Settings
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Calendar Provider
            </label>
            <select
              value={syncedCalendar}
              onChange={(e) => setSyncedCalendar(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="Google Calendar (Primary)">Google Calendar (Primary)</option>
              <option value="GoHighLevel Native Calendar">GoHighLevel Native Calendar</option>
              <option value="Outlook 365">Outlook 365</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Meeting Duration
            </label>
            <select
              value={meetingDuration}
              onChange={(e) => setMeetingDuration(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="15 minutes">15 minutes</option>
              <option value="30 minutes">30 minutes</option>
              <option value="45 minutes">45 minutes</option>
              <option value="60 minutes">60 minutes</option>
            </select>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => setActiveTab("Overview")}>
              Save Calendar Settings
            </Button>
          </div>
        </Card>
      )}

      {/* Create Appointment Modal */}
      <Modal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        title="Create Appointment"
        description="Manually book a time slot on the synchronized calendar."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateBooking}>
              Confirm Booking
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Usman Tariq"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Email
            </label>
            <input
              type="email"
              placeholder="usman@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Slot
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Type
              </label>
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          description={`Scheduled with ${selectedAppointment.customer}`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setAppointments((prev) =>
                    prev.filter((a) => a.id !== selectedAppointment.id)
                  );
                  setSelectedAppointment(null);
                }}
              >
                Cancel Appointment
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-900">{selectedAppointment.customer}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900">{selectedAppointment.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Time</span>
              <span className="font-semibold text-slate-900">{selectedAppointment.time}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-slate-900">{selectedAppointment.appointmentType}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Status</span>
              <StatusBadge variant="active" label={selectedAppointment.status} />
            </div>
          </div>
        </Modal>
      )}

      {/* Configure Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Appointment Agent"
        description="Adjust booking rules, durations, and calendar sync."
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
              Primary Calendar
            </label>
            <select
              value={syncedCalendar}
              onChange={(e) => setSyncedCalendar(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="Google Calendar (Primary)">Google Calendar (Primary)</option>
              <option value="GoHighLevel Native Calendar">GoHighLevel Native Calendar</option>
              <option value="Outlook 365">Outlook 365</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Slot Duration
            </label>
            <select
              value={meetingDuration}
              onChange={(e) => setMeetingDuration(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900"
            >
              <option value="15 minutes">15 minutes</option>
              <option value="30 minutes">30 minutes</option>
              <option value="45 minutes">45 minutes</option>
              <option value="60 minutes">60 minutes</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
