"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Store,
  Clock,
  UserPlus,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { recentActivities } from "@/lib/data";
import { api } from "@/lib/api";

interface Screen2DashboardProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen2Dashboard({ onNavigate, isCompact = false }: Screen2DashboardProps) {
  const [selectedRange, setSelectedRange] = useState("7D");
  const [store, setStore] = useState("Acme Store");
  const [analyticsData, setAnalyticsData] = useState<any>({
    metrics: {
      conversations: 2847,
      conversations_growth: "+12%",
      leads: 642,
      leads_growth: "+18%",
      appointments: 186,
      appointments_growth: "+24%",
      conversion_rate: "6.5%",
      conversion_growth: "+2.1%"
    },
    trend: [
      { day: "Apr 28", conversations: 2300, leads: 480 },
      { day: "Apr 29", conversations: 2450, leads: 520 },
      { day: "Apr 30", conversations: 2847, leads: 642 },
      { day: "May 1", conversations: 2700, leads: 590 },
      { day: "May 2", conversations: 3100, leads: 690 },
      { day: "May 3", conversations: 2900, leads: 630 },
      { day: "May 4", conversations: 3200, leads: 710 },
      { day: "May 5", conversations: 3350, leads: 740 }
    ]
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data) {
          setAnalyticsData(res.data);
        }
      } catch (e) {
        console.error("Failed to load analytics from API", e);
      }
    }
    loadData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <UserPlus className="w-3.5 h-3.5 text-blue-600" />;
      case "appointment":
        return <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "support":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "sale":
        return <DollarSign className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const metrics = analyticsData.metrics;
  const trendData = analyticsData.trend || [];

  return (
    <div className={`w-full bg-[#F5F8FC] rounded-xl p-4 sm:p-6 border border-slate-200 ${isCompact ? "text-xs" : ""}`}>
      {/* Top Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Connected (Laravel/REST)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">John!</span> Real-time business activity across your AI agents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Store Selector */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>{store}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Apr 29, 2025 – May 5, 2025</span>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
              alt="John Doe"
              className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-none">John Doe</div>
              <div className="text-[10px] text-slate-400">Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {/* KPI 1 */}
        <div 
          onClick={() => onNavigate && onNavigate(3)}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium group-hover:text-blue-600 transition-colors">Total Conversations</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.conversations.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.conversations_growth}
            </span>
            <span className="text-slate-400 font-normal text-[10px]">vs previous period</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => onNavigate && onNavigate(7)}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium group-hover:text-teal-600 transition-colors">Leads Generated</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.leads.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.leads_growth}
            </span>
            <span className="text-slate-400 font-normal text-[10px]">vs previous period</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div 
          onClick={() => onNavigate && onNavigate(8)}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium group-hover:text-purple-600 transition-colors">Appointments Booked</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.appointments.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.appointments_growth}
            </span>
            <span className="text-slate-400 font-normal text-[10px]">vs previous period</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => onNavigate && onNavigate(11)}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium group-hover:text-blue-600 transition-colors">Conversion Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.conversion_rate}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.conversion_growth}
            </span>
            <span className="text-slate-400 font-normal text-[10px]">vs previous period</span>
          </div>
        </div>
      </div>

      {/* Main Row: Trend Line Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
        {/* Conversations & Leads Trend Line Chart */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversations & Leads Trend</h3>
              <p className="text-[11px] text-slate-500">Live API time-series data for incoming conversations vs captured leads</p>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-4 text-[11px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]"></span>
                  <span className="text-slate-600">Conversations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10C8C8]"></span>
                  <span className="text-slate-600">Leads</span>
                </div>
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                {["7D", "30D", "90D"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRange(r)}
                    className={`px-2 py-1 rounded-md transition-all ${
                      selectedRange === r ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive SVG Trend Chart */}
          <div className="w-full h-56 sm:h-64 relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1677FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1677FF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10C8C8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10C8C8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="20" x2="700" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="700" y2="70" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="170" x2="700" y2="170" stroke="#F1F5F9" strokeDasharray="3 3" />

              <polygon
                fill="url(#convGradient)"
                points="0,110 100,100 200,60 300,75 400,35 500,55 600,30 700,20 700,180 0,180"
              />

              <polyline
                fill="none"
                stroke="#1677FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,110 100,100 200,60 300,75 400,35 500,55 600,30 700,20"
              />

              <polyline
                fill="none"
                stroke="#10C8C8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,165 100,160 200,140 300,150 400,130 500,145 600,125 700,120"
              />

              <circle cx="200" cy="60" r="4" fill="#1677FF" stroke="#fff" strokeWidth="2" />
              <circle cx="400" cy="35" r="4" fill="#1677FF" stroke="#fff" strokeWidth="2" />
              <circle cx="700" cy="20" r="4" fill="#1677FF" stroke="#fff" strokeWidth="2" />

              <circle cx="200" cy="140" r="4" fill="#10C8C8" stroke="#fff" strokeWidth="2" />
              <circle cx="400" cy="130" r="4" fill="#10C8C8" stroke="#fff" strokeWidth="2" />
              <circle cx="700" cy="120" r="4" fill="#10C8C8" stroke="#fff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
              {trendData.map((d: any) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <span className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium">View all</span>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                  onClick={() => {
                    if (act.type === "lead" && onNavigate) onNavigate(7);
                    if (act.type === "appointment" && onNavigate) onNavigate(8);
                    if (act.type === "support" && onNavigate) onNavigate(4);
                    if (act.type === "sale" && onNavigate) onNavigate(5);
                    if (act.type === "chat" && onNavigate) onNavigate(3);
                  }}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {act.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Agent activity: <strong className="text-emerald-600 font-semibold">100% operational</strong></span>
            <span className="text-blue-600 font-medium">Configure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
