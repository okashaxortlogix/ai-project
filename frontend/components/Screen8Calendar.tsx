"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  CalendarCheck,
  CalendarDays
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen8CalendarProps {
  isCompact?: boolean;
}

// Robust helper to check if an appointment falls on a specific Date
function isAppointmentOnDate(apt: any, target: Date): boolean {
  if (!apt) return false;

  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();
  const targetDay = target.getDate();

  // 1. Try parsing apt.date (e.g. "Apr 29, 2025", "2025-04-29", "May 01, 2025")
  if (apt.date) {
    // Check direct ISO format YYYY-MM-DD to avoid UTC timezone shifts
    const isoMatch = typeof apt.date === "string" && apt.date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      if (y === targetYear && m === targetMonth && d === targetDay) {
        return true;
      }
    }

    const d = new Date(String(apt.date).replace(/-/g, "/"));
    if (!isNaN(d.getTime())) {
      if (
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        d.getDate() === targetDay
      ) {
        return true;
      }
    }
    // Also textual matching e.g. "Apr 29", "May 01", "May 1"
    const targetMonthStr = target.toLocaleDateString("en-US", { month: "short" });
    const targetDayStr = target.getDate().toString();
    const aptDateLower = String(apt.date).toLowerCase();
    const monthMatch = aptDateLower.includes(targetMonthStr.toLowerCase());
    const dayMatch =
      aptDateLower.includes(` ${targetDayStr},`) ||
      aptDateLower.includes(` 0${targetDayStr},`) ||
      aptDateLower.includes(` ${targetDayStr} `) ||
      aptDateLower.endsWith(` ${targetDayStr}`) ||
      aptDateLower.endsWith(` 0${targetDayStr}`);

    if (monthMatch && dayMatch) return true;
  }

  // 2. Try parsing apt.start_at
  if (apt.start_at) {
    const d = new Date(apt.start_at);
    if (!isNaN(d.getTime())) {
      if (
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        d.getDate() === targetDay
      ) {
        return true;
      }
    }
  }

  return false;
}

export default function Screen8Calendar({ isCompact = false }: Screen8CalendarProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"Month" | "Week" | "Day">("Month");

  // Initial base date set to Tuesday, April 29, 2025 so demo appointments are in direct view
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 3, 29));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 3, 29));

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
      if (res && res.success && Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error("Failed to load appointments from API", e);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Update new appointment date string whenever selectedDate changes
  useEffect(() => {
    const formatted = selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
    setNewDate(formatted);
  }, [selectedDate]);

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

      if (res && res.success) {
        await loadAppointments();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error("Create appointment error", e);
    }
  };

  // Compute 7 days of the week containing currentDate (Sunday through Saturday)
  const weekDays = useMemo(() => {
    const sunday = new Date(currentDate);
    const dayOfWeek = sunday.getDay(); // 0 is Sunday
    sunday.setDate(sunday.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Navigate Previous
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (activeView === "Month") {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (activeView === "Week") {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
  };

  // Navigate Next
  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (activeView === "Month") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (activeView === "Week") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
  };

  // Jump to Today / Reference default
  const handleToday = () => {
    const defaultDate = new Date(2025, 3, 29);
    setCurrentDate(defaultDate);
    setSelectedDate(defaultDate);
  };

  // Filter appointments for the currently selected date
  const selectedDayAppointments = useMemo(() => {
    return appointments.filter((apt) => isAppointmentOnDate(apt, selectedDate));
  }, [appointments, selectedDate]);

  const monthYearLabel = useMemo(() => {
    if (activeView === "Day") {
      return selectedDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });
    }
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const m1 = firstDay.toLocaleDateString("en-US", { month: "short" });
    const m2 = lastDay.toLocaleDateString("en-US", { month: "short" });
    const y1 = firstDay.getFullYear();
    const y2 = lastDay.getFullYear();

    if (m1 === m2 && y1 === y2) {
      return `${m1} ${y1}`;
    }
    if (y1 === y2) {
      return `${m1} – ${m2} ${y1}`;
    }
    return `${m1} ${y1} – ${m2} ${y2}`;
  }, [activeView, selectedDate, weekDays]);

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Color styles palette
  const colorStyles = [
    "bg-blue-50 border-blue-200 text-blue-900",
    "bg-emerald-50 border-emerald-200 text-emerald-900",
    "bg-amber-50 border-amber-200 text-amber-900",
    "bg-purple-50 border-purple-200 text-purple-900",
    "bg-rose-50 border-rose-200 text-rose-900"
  ];
  const dotColors = ["bg-blue-600", "bg-emerald-600", "bg-amber-500", "bg-purple-600", "bg-rose-500"];

  // Hours array for Day View
  const dayHours = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM"
  ];

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Calendar Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 text-sm px-2 min-w-[85px] text-center select-none">
              {monthYearLabel}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeView === v
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        {/* Left Calendar Schedule Area */}
        <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
          {/* Day Names & Dates Header Row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5">
            {weekDays.map((d, i) => {
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dateNum = d.getDate();
              const isSelected =
                d.getFullYear() === selectedDate.getFullYear() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getDate() === selectedDate.getDate();

              const isReferenceToday =
                d.getFullYear() === 2025 && d.getMonth() === 3 && d.getDate() === 29;

              // Count how many appointments on this day
              const countOnDay = appointments.filter((apt) => isAppointmentOnDate(apt, d)).length;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className="flex flex-col items-center cursor-pointer group select-none"
                >
                  <div className="text-[10px] font-semibold text-slate-400 tracking-wider">
                    {dayName}
                  </div>
                  <div
                    className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all relative ${
                      isSelected
                        ? "bg-[#1677FF] text-white shadow-xs scale-105"
                        : isReferenceToday
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "text-slate-700 group-hover:bg-slate-200/80"
                    }`}
                  >
                    {dateNum}
                  </div>

                  {/* Indicator Dot if day has scheduled appointments */}
                  <div className="h-2 flex items-center justify-center mt-0.5">
                    {countOnDay > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-blue-600" : "bg-emerald-500"
                        }`}
                        title={`${countOnDay} appointment${countOnDay > 1 ? "s" : ""}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Date Sub-Header */}
          <div className="px-4 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              {selectedDateLabel}
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedDayAppointments.length} appointment
              {selectedDayAppointments.length !== 1 ? "s" : ""} scheduled
            </span>
          </div>

          {/* Content Area - Changes according to selected date & view */}
          <div className="p-3.5 flex-1 min-h-[320px] flex flex-col justify-center">
            {activeView === "Day" ? (
              // DAY VIEW: Hourly Slots Breakdown
              <div className="space-y-2 py-1">
                {dayHours.map((hour, hIdx) => {
                  const matchingApts = selectedDayAppointments.filter((apt) => {
                    if (!apt.time) return false;
                    const aptHour = apt.time.split(" - ")[0].trim();
                    return aptHour.toLowerCase().includes(hour.toLowerCase().slice(0, 5));
                  });

                  return (
                    <div key={hIdx} className="flex items-start gap-3 border-t border-slate-100 pt-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0 pt-1">
                        {hour}
                      </span>
                      <div className="flex-1 min-h-[36px]">
                        {matchingApts.length === 0 ? (
                          <div className="h-8 rounded-lg border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center px-3 text-[11px] text-slate-400 cursor-pointer"
                            onClick={() => {
                              setNewTime(`${hour} - 30m`);
                              setIsModalOpen(true);
                            }}
                          >
                            + Open Slot (Click to reserve)
                          </div>
                        ) : (
                          matchingApts.map((apt, aIdx) => (
                            <div
                              key={apt.id || aIdx}
                              onClick={() => setSelectedAppointment(apt)}
                              className="p-2 rounded-lg border text-xs font-semibold bg-blue-50 border-blue-200 text-blue-900 flex items-center justify-between hover:shadow-xs transition-all cursor-pointer mb-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <span>{apt.title} — {apt.customer_name}</span>
                              </div>
                              <span className="text-[10px] text-blue-700 font-normal">{apt.time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // MONTH & WEEK VIEW: Day-filtered Appointments List
              <div className="space-y-2.5">
                {selectedDayAppointments.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                      <CalendarIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-xs">
                        No appointments scheduled for this date
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        There are no bookings on {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}. Click below to schedule a new call.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-1 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book on this date</span>
                    </button>
                  </div>
                ) : (
                  selectedDayAppointments.map((apt, idx) => {
                    const color = colorStyles[idx % colorStyles.length];
                    const dot = dotColors[idx % dotColors.length];

                    return (
                      <div key={apt.id || idx} className="flex items-start gap-2.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0 pt-2">
                          {apt.time ? apt.time.split(" - ")[0] : "10:00 AM"}
                        </span>
                        <div className="flex-1 border-t border-slate-100 pt-1">
                          <div
                            onClick={() => setSelectedAppointment(apt)}
                            className={`p-2.5 rounded-lg border text-xs font-semibold hover:opacity-95 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs ${color}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${dot} shrink-0`}></span>
                              <span>{apt.title} — {apt.customer_name}</span>
                            </div>
                            <span className="text-[10px] opacity-80 font-normal shrink-0">
                              {apt.time || "30 mins"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Appointments & + New Appointment */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                All Appointments
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                {appointments.length} Total
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No appointments booked yet.
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => {
                      setSelectedAppointment(apt);
                      if (apt.date) {
                        const parsed = new Date(apt.date);
                        if (!isNaN(parsed.getTime())) {
                          setCurrentDate(parsed);
                          setSelectedDate(parsed);
                        }
                      }
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-start justify-between bg-white shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={
                          apt.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            apt.customer_name || "Client"
                          )}&background=2563EB&color=fff`
                        }
                        alt={apt.customer_name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{apt.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {apt.date} · {apt.time ? apt.time.split(" - ")[0] : "10:00 AM"}
                        </div>
                        <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                          {apt.customer_name}
                        </div>
                      </div>
                    </div>

                    <button className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prominent + New Appointment Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 px-4 bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedAppointment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-blue-600">
                  {selectedAppointment.date} · {selectedAppointment.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calendar:</span>
                <span className="font-medium text-slate-700">{selectedAppointment.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service:</span>
                <span className="font-medium text-slate-700">{selectedAppointment.service || "Demo Call"}</span>
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
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
