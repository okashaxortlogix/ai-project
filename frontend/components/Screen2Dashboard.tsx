"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ShoppingBag,
  CalendarCheck,
  Bot,
  ArrowUpRight,
  PlusCircle,
  ExternalLink,
  Layers,
  LayoutTemplate,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronDown,
  Activity,
  Server,
  Database,
  Plug
} from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import { api } from "@/lib/api";

interface Screen2DashboardProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen2Dashboard({ onNavigate }: Screen2DashboardProps) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [metrics, setMetrics] = useState({
    conversations: 24,
    conversations_trend: "+12% from yesterday",
    orders: 8,
    orders_trend: "+33% from yesterday",
    appointments: 5,
    appointments_trend: "+20% from yesterday",
    active_agents: 3,
    agents_status: "All systems running"
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data?.metrics) {
          // If live data exists, dynamically adapt
          setMetrics((prev) => ({
            ...prev,
            conversations: res.data.metrics.conversations || prev.conversations,
            appointments: res.data.metrics.appointments || prev.appointments
          }));
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    loadData();
  }, []);

  const quickActions = [
    {
      id: "new-chat",
      title: "Start New Chat",
      desc: "Talk to your AI assistant",
      icon: PlusCircle,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100",
      action: () => onNavigate?.(10)
    },
    {
      id: "conversations",
      title: "View Conversations",
      desc: "Check all conversations",
      icon: MessageSquare,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
      action: () => onNavigate?.(3)
    },
    {
      id: "manage-agents",
      title: "Manage Agents",
      desc: "Configure AI agents",
      icon: Bot,
      iconColor: "text-purple-600 bg-purple-50 border-purple-100",
      action: () => onNavigate?.(4)
    },
    {
      id: "templates",
      title: "Browse Templates",
      desc: "Use pre-built templates",
      icon: LayoutTemplate,
      iconColor: "text-teal-600 bg-teal-50 border-teal-100",
      action: () => onNavigate?.(14)
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: "New appointment booked",
      subtitle: "Dental Consultation with Sarah Ahmed",
      time: "2 min ago",
      type: "appointment"
    },
    {
      id: 2,
      title: "Support ticket resolved",
      subtitle: "Order #2456 marked resolved by Support Bot",
      time: "12 min ago",
      type: "support"
    },
    {
      id: 3,
      title: "New order received",
      subtitle: "Order #12345 synced to Shopify & WooCommerce",
      time: "25 min ago",
      type: "order"
    },
    {
      id: 4,
      title: "Conversation started",
      subtitle: "Lead captured from website webchat",
      time: "45 min ago",
      type: "lead"
    }
  ];

  const systemStatus = [
    {
      name: "AI Agents Online",
      status: "3/3 Agents Active",
      badge: "Active",
      variant: "active" as const,
      icon: Bot
    },
    {
      name: "API Connection",
      status: "GHL & Webhooks Active",
      badge: "Connected",
      variant: "connected" as const,
      icon: Plug
    },
    {
      name: "Database",
      status: "Multi-tenant sync verified",
      badge: "Healthy",
      variant: "active" as const,
      icon: Database
    },
    {
      name: "E-Commerce",
      status: "Shopify & WooCommerce Live",
      badge: "Synced",
      variant: "active" as const,
      icon: ShoppingBag
    }
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, Okasha!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening with your AI agents today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateFilter(dateFilter === "Today" ? "Last 7 Days" : "Today")}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Row of 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.conversations}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{metrics.conversations_trend}</span>
          </div>
        </div>

        {/* Orders Processed */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Orders Processed</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.orders}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{metrics.orders_trend}</span>
          </div>
        </div>

        {/* Appointments Booked */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Appointments Booked</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.appointments}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{metrics.appointments_trend}</span>
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Agents</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.active_agents}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse" />
            <span>{metrics.agents_status}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <div
                key={qa.id}
                onClick={qa.action}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${qa.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {qa.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{qa.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Two-Column Section: Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate?.(3)}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition-colors cursor-pointer"
                onClick={() => onNavigate?.(3)}
              >
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">
                      {act.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.subtitle}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: System Status */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              System Status
            </h3>
            <StatusBadge status="All Healthy" variant="active" pulse />
          </div>

          <div className="space-y-3">
            {systemStatus.map((sys, idx) => {
              const Icon = sys.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200/80 flex items-center justify-center text-slate-600">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {sys.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sys.status}
                      </div>
                    </div>
                  </div>
                  <StatusBadge
                    status={sys.badge}
                    variant={sys.variant}
                    pulse={false}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">GoHighLevel Sync</span>
            <button
              onClick={() => onNavigate?.(15)}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
