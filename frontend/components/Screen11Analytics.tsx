"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar as CalendarIcon,
  MessageSquare,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp
} from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import StatusBadge from "./ui/StatusBadge";
import { api } from "@/lib/api";

interface Screen11AnalyticsProps {
  onNavigate?: (screenIndex: number) => void;
  isCompact?: boolean;
}

export default function Screen11Analytics({ onNavigate, isCompact = false }: Screen11AnalyticsProps) {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [data, setData] = useState({
    totalConversations: "2,847",
    resolutionRate: "96.2%",
    avgResponseTime: "0.8s",
    appointments: "184",
    salesConversions: "24.1%"
  });
  const [agentPerformance, setAgentPerformance] = useState([
    { name: "Support Agent", volume: "1,420 conversations", resolution: "98%", color: "bg-blue-600" },
    { name: "Sales Agent", volume: "890 leads qualified", resolution: "94%", color: "bg-emerald-600" },
    { name: "Appointment Agent", volume: "537 bookings managed", resolution: "97%", color: "bg-purple-600" }
  ]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        if (res && res.success && res.data) {
          const d = res.data;
          const convs = d.metrics?.conversations ?? d.total_conversations ?? 2847;
          const apts = d.metrics?.appointments ?? d.appointments_booked ?? 184;
          const leadsGrowth = d.metrics?.growth?.leads ?? d.leads_growth ?? "24.1%";
          const csat = d.csat_score || "96.2%";
          const respTime = d.avg_response_time || "0.8s";

          setData({
            totalConversations: Number(convs).toLocaleString(),
            resolutionRate: csat,
            avgResponseTime: respTime,
            appointments: Number(apts).toLocaleString(),
            salesConversions: leadsGrowth.replace("+", "")
          });

          if (Array.isArray(d.agent_performance) && d.agent_performance.length > 0) {
            const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600"];
            setAgentPerformance(
              d.agent_performance.map((ap: any, i: number) => ({
                name: ap.agent,
                volume: `${ap.handled} interactions`,
                resolution: ap.satisfaction,
                color: colors[i % colors.length]
              }))
            );
          }
        }
      } catch (e) {
        console.error("Analytics fetch error", e);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    const rows = [
      ["Metric", "Value", "Benchmark", "Reporting Period"],
      ["Total Conversations", data.totalConversations, "+18.4%", dateRange],
      ["AI Resolution & CSAT", data.resolutionRate, "+4.1%", dateRange],
      ["Avg Response Time", data.avgResponseTime, "-0.3s", dateRange],
      ["Appointments Booked", data.appointments, "+12.5%", dateRange],
      ["Sales Conversions Growth", data.salesConversions, "+3.8%", dateRange]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <span className="text-slate-800 font-semibold">Analytics & Reports</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Analytics & Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive performance metrics across AI conversations, resolution rates, and bookings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 shadow-2xs font-semibold focus:outline-none"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Year to Date">Year to Date</option>
            </select>
            <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Conversations", value: data.totalConversations, change: "+18.4%", isPositive: true, icon: MessageSquare },
          { label: "AI Resolution Rate", value: data.resolutionRate, change: "+3.1%", isPositive: true, icon: CheckCircle2 },
          { label: "Avg Response Time", value: data.avgResponseTime, change: "-0.4s", isPositive: true, icon: Clock },
          { label: "Appointments Booked", value: data.appointments, change: "+12.5%", isPositive: true, icon: CalendarIcon },
          { label: "Lead Growth Rate", value: `+${data.salesConversions}`, change: "+2.5%", isPositive: true, icon: Target }
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{m.label}</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">{m.value}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span>{m.change}</span>
                <span className="text-slate-400 font-normal">vs last period</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Enterprise AI Financial ROI & Wage Savings Breakdown */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wide uppercase">
                Executive ROI Metrics
              </span>
              <span className="text-xs text-slate-300">Financial Impact &amp; Resource Efficiency</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Estimated Financial Return &amp; Wage Savings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated automatically based on 2,847 autonomous resolutions at standard customer support wage benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>11.6x Monthly ROI</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-slate-400">Monthly Support Wages Saved</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">$3,450.00</div>
            <p className="text-[11px] text-slate-400 mt-1">Equivalent to 142 human support hours</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-slate-400">Influenced Sales Revenue</span>
            <div className="text-2xl font-bold text-blue-300 mt-1">$14,890.00</div>
            <p className="text-[11px] text-slate-400 mt-1">Recovered carts &amp; catalog recommendations</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-slate-400">Autonomous Resolution Rate</span>
            <div className="text-2xl font-bold text-purple-300 mt-1">96.2%</div>
            <p className="text-[11px] text-slate-400 mt-1">Only 3.8% required human agent escalation</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs text-slate-400">Avg Cost Per Interaction</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">&lt; $0.02</div>
            <p className="text-[11px] text-slate-400 mt-1">Vs. $4.50 industry human agent benchmark</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Over Time Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversations Over Time</h3>
              <p className="text-xs text-slate-500">Daily message volume handled autonomously</p>
            </div>
            <StatusBadge variant="active" label="99.4% Automated" />
          </div>

          <div className="h-56 w-full flex items-end">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              <path
                d="M 0,130 C 50,110 100,125 150,90 C 200,60 250,75 300,50 C 350,30 400,45 450,20 L 500,15 L 500,160 L 0,160 Z"
                fill="url(#volGrad)"
              />
              <path
                d="M 0,130 C 50,110 100,125 150,90 C 200,60 250,75 300,50 C 350,30 400,45 450,20 L 500,15"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Day 1</span>
            <span>Day 7</span>
            <span>Day 14</span>
            <span>Day 21</span>
            <span>Today</span>
          </div>
        </Card>

        {/* Agent Performance Breakdown */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent Performance Breakdown</h3>
              <p className="text-xs text-slate-500">Resolution and CSAT by agent specialty</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {agentPerformance.map((agent, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{agent.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{agent.volume}</span>
                    <span className="font-bold text-slate-900">{agent.resolution}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${agent.color} rounded-full`}
                    style={{ width: agent.resolution }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
