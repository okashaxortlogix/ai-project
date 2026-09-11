"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Target
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";

interface Screen11AnalyticsProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen11Analytics({ onNavigate, isCompact = false }: Screen11AnalyticsProps) {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [data, setData] = useState({
    totalConversations: "2,847",
    resolutionRate: "92.4%",
    avgResponseTime: "1.2s",
    appointments: "186",
    salesConversions: "18.2%"
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data && res.data.metrics) {
          setData({
            totalConversations: res.data.metrics.conversations?.toLocaleString() || "2,847",
            resolutionRate: "92.4%",
            avgResponseTime: "1.2s",
            appointments: res.data.metrics.appointments?.toString() || "186",
            salesConversions: "18.2%"
          });
        }
      } catch (e) {
        console.error("Analytics fetch error", e);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    alert("Exporting clean analytics CSV summary...");
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
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards matching Page 11 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Conversations", value: data.totalConversations, change: "+14.2%", isPositive: true, icon: MessageSquare },
          { label: "AI Resolution Rate", value: data.resolutionRate, change: "+3.1%", isPositive: true, icon: CheckCircle2 },
          { label: "Avg Response Time", value: data.avgResponseTime, change: "-0.4s", isPositive: true, icon: Clock },
          { label: "Appointments Booked", value: data.appointments, change: "+24%", isPositive: true, icon: CalendarIcon },
          { label: "Sales Conversions", value: data.salesConversions, change: "+2.5%", isPositive: true, icon: Target }
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

      {/* Charts Section matching Page 11 */}
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
              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area */}
              <path
                d="M 0,130 C 50,110 100,125 150,90 C 200,60 250,75 300,50 C 350,30 400,45 450,20 L 500,15 L 500,160 L 0,160 Z"
                fill="url(#volGrad)"
              />
              {/* Curve */}
              <path
                d="M 0,130 C 50,110 100,125 150,90 C 200,60 250,75 300,50 C 350,30 400,45 450,20 L 500,15"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Apr 1</span>
            <span>Apr 8</span>
            <span>Apr 15</span>
            <span>Apr 22</span>
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
            {[
              { name: "Support Agent", volume: "1,420 conversations", resolution: "94%", color: "bg-blue-600" },
              { name: "Sales Agent", volume: "912 leads qualified", resolution: "88%", color: "bg-emerald-600" },
              { name: "Appointment Agent", volume: "515 bookings managed", resolution: "96%", color: "bg-purple-600" }
            ].map((agent, i) => (
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
