"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle2,
  X,
  Eye,
  CalendarCheck
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen8CalendarProps {
  isCompact?: boolean;
}

export default function Screen8Calendar({ isCompact = false }: Screen8CalendarProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"Month" | "Week" | "Day">("Month");
  const [selectedDay, setSelectedDay] = useState<number>(29);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // New appointment form state
  const [newTitle, setNewTitle] = useState("Product Onboarding");
  const [newCustomer, setNewCustomer] = useState("Alex Morgan");
  const [newDate, setNewDate] = useState("Apr 29, 2025");
  const [newTime, setNewTime] = useState("3:00 PM - 3:30 PM");

  const loadAppointments = async () => {
    try {
      const res = await api.getAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error("Failed to load appointments from API", e);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAppointment({
        title: newTitle,
        customer_name: newCustomer,
        date: newDate,
        time: newTime,
        service: "Customer Onboarding",
        provider: "Google Calendar",
        status: "Confirmed"
      });

      if (res.success) {
        await loadAppointments();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error("Create appointment error", e);
    }
  };

  const daysHeader = [
    { day: "Sun", date: 27 },
    { day: "Mon", date: 28 },
    { day: "Tue", date: 29, isToday: true },
    { day: "Wed", date: 30 },
    { day: "Thu", date: 1 },
    { day: "Fri", date: 2 },
    { day: "Sat", date: 3 },
  ];

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Calendar Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 text-sm px-2">Apr 2025</span>
            <button className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDay(29)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Switcher: Month, Week, Day */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          {(["Month", "Week", "Day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-3 py-1 rounded-md transition-all ${
                activeView === v ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        {/* Left Calendar Grid */}
        <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2">
            {daysHeader.map((d, i) => (
              <div key={i} className="text-xs font-semibold text-slate-600">
                <div className="text-[10px] text-slate-400 uppercase">{d.day}</div>
                <div
                  onClick={() => setSelectedDay(d.date)}
                  className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    selectedDay === d.date
                      ? "bg-[#1677FF] text-white shadow-xs"
                      : d.isToday
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {d.date}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slot Rows & Chips */}
          <div className="p-3 space-y-2.5 min-h-[300px]">
            {/* 10:00 AM Slot */}
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 w-14 shrink-0">10:00 AM</span>
              <div className="flex-1 border-t border-slate-100 pt-1">
                <div
                  onClick={() => setSelectedAppointment(appointments[1] || appointments[0])}
                  className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold hover:bg-blue-100/70 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Client Call — Mike Wilson</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-normal">10:00 - 11:00 AM</span>
                </div>
              </div>
            </div>

            {/* 11:00 AM Slot */}
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 w-14 shrink-0">11:00 AM</span>
              <div className="flex-1 border-t border-slate-100 pt-1">
                <div
                  onClick={() => setSelectedAppointment(appointments[3] || appointments[0])}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100/70 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Team Meeting — Pipeline Review</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-normal">11:00 AM - 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* 2:00 PM Slot */}
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 w-14 shrink-0">2:00 PM</span>
              <div className="flex-1 border-t border-slate-100 pt-1">
                <div
                  onClick={() => setSelectedAppointment(appointments[0])}
                  className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold hover:bg-emerald-100/70 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Demo Call — Sarah Johnson</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-normal">2:00 - 2:30 PM</span>
                </div>
              </div>
            </div>

            {/* 4:00 PM Slot */}
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 w-14 shrink-0">4:00 PM</span>
              <div className="flex-1 border-t border-slate-100 pt-1 space-y-1.5">
                <div
                  onClick={() => setSelectedAppointment(appointments[4] || appointments[0])}
                  className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-100/70 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Product Demo — James Miller</span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-normal">4:00 - 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Upcoming Appointments & + New Appointment */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Appointments (API)
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                {appointments.length} Total
              </span>
            </div>

            <div className="space-y-2.5">
              {appointments.slice(0, 4).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-start justify-between bg-white"
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={apt.avatar}
                      alt={apt.customer_name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{apt.title}</div>
                      <div className="text-[10px] text-slate-500">{apt.date} · {apt.time.split(" - ")[0]}</div>
                      <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                        {apt.customer_name}
                      </div>
                    </div>
                  </div>

                  <button className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent + New Appointment Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 px-4 bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Appointment</span>
          </button>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                {selectedAppointment.title}
              </h4>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedAppointment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-blue-600">{selectedAppointment.date} · {selectedAppointment.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calendar:</span>
                <span className="font-medium text-slate-700">{selectedAppointment.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-emerald-600">{selectedAppointment.status}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Schedule New Appointment
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Confirm & Sync Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
