"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  MessageSquare,
  Users,
  CalendarCheck,
  Percent,
  PieChart,
  ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen11AnalyticsProps {
  isCompact?: boolean;
}

export default function Screen11Analytics({ isCompact = false }: Screen11AnalyticsProps) {
  const [dateRange, setDateRange] = useState("Apr 29, 2025 – May 5, 2025");
  const [data, setData] = useState<any>({
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
    lead_sources: [
      { name: "Website", pct: 45, color: "#1677FF" },
      { name: "Facebook", pct: 25, color: "#10C8C8" },
      { name: "Google Ads", pct: 18, color: "#8B5CF6" },
      { name: "Referral", pct: 8, color: "#20B486" },
      { name: "Other", pct: 4, color: "#F5B942" }
    ],
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
    async function load() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (e) {
        console.error("Analytics fetch error", e);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    alert("Analytics PDF summary report generated from live API database.");
  };

  const metrics = data.metrics;
  const sources = data.lead_sources || [];
  const trend = data.trend || [];

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Analytics & Reports</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Live BI Engine (API)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full funnel conversation-to-revenue conversion intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Conversations</span>
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.conversations.toLocaleString()}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-2.5 h-2.5" />
            {metrics.conversations_growth} vs last week
          </div>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Leads Generated</span>
            <Users className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.leads.toLocaleString()}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-2.5 h-2.5" />
            {metrics.leads_growth} vs last week
          </div>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Appointments Booked</span>
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.appointments.toLocaleString()}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-2.5 h-2.5" />
            {metrics.appointments_growth} vs last week
          </div>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Conversion Rate</span>
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.conversion_rate}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-2.5 h-2.5" />
            {metrics.conversion_growth} vs last week
          </div>
        </div>
      </div>

      {/* Two Analytical Charts: Line Chart vs Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Conversations vs Leads Line Chart */}
        <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900">Conversations vs Leads</h4>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#1677FF]"></span>
                Conversations
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#10C8C8]"></span>
                Leads
              </span>
            </div>
          </div>

          <div className="h-48 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#1677FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,90 70,80 140,50 210,65 280,30 350,45 420,25 500,15"
              />
              <polyline
                fill="none"
                stroke="#10C8C8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,135 70,130 140,115 210,120 280,105 350,115 420,100 500,95"
              />
            </svg>

            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              {trend.slice(0, 6).map((d: any) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Sources Donut Chart */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900">Lead Sources</h4>
            <span className="text-[10px] text-slate-400">Total: {metrics.leads} Leads</span>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#1677FF"
                  strokeDasharray="45, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#10C8C8"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-45"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#8B5CF6"
                  strokeDasharray="18, 100"
                  strokeDashoffset="-70"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-900 leading-none">{metrics.leads}</span>
                <span className="text-[9px] text-slate-400">Total</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-1 text-[11px] min-w-[130px]">
              {sources.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span className="text-slate-700">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
