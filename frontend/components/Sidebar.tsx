"use client";

import React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  Calendar,
  Headphones,
  TrendingUp,
  Database,
  Plug,
  BarChart3,
  Settings,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface NavItem {
  id: number;
  label: string;
  icon: any;
  dot?: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeScreen: number;
  setActiveScreen: (screen: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { id: 2, label: "Dashboard", icon: LayoutDashboard },
        { id: 3, label: "Live Conversations", icon: MessageSquare, badge: "6 Live", badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      ]
    },
    {
      title: "Autonomous AI Agents",
      items: [
        { id: 4, label: "Support Agent", icon: Headphones, dot: "bg-blue-400" },
        { id: 5, label: "Sales & Commerce", icon: TrendingUp, dot: "bg-teal-400" },
        { id: 6, label: "Appointment Agent", icon: Calendar, dot: "bg-purple-400" },
      ]
    },
    {
      title: "Growth & Operations",
      items: [
        { id: 7, label: "Leads Management", icon: UserCheck, badge: "Hot", badgeColor: "bg-red-500/20 text-red-300 border-red-500/30" },
        { id: 8, label: "Calendar Schedule", icon: Calendar },
        { id: 9, label: "Knowledge Base (RAG)", icon: Database, badge: "Vector", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      ]
    },
    {
      title: "Platform",
      items: [
        { id: 10, label: "Integrations Hub", icon: Plug, badge: "Connected", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
        { id: 11, label: "Analytics & Reports", icon: BarChart3 },
        { id: 12, label: "Settings & Team", icon: Settings },
        { id: 13, label: "Mobile Experience", icon: Smartphone },
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#061226] text-slate-300 border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between shrink-0 shadow-lg ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Collapse / Expand Toggle Button */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Navigation</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                      isActive
                        ? "bg-[#1677FF] text-white shadow-md shadow-blue-600/30 font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`} />
                    
                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!collapsed && item.dot && (
                      <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`}></span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Platform Status Card */}
        {!collapsed && (
          <div className="p-3 m-2.5 bg-[#091834] rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Suite Health
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                100% Online
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>RAG Cosine Threshold:</span>
                <span className="text-slate-200 font-mono">65%</span>
              </div>
              <div className="flex justify-between">
                <span>Multi-Tenant ID:</span>
                <span className="text-slate-200 font-mono">org-acme-1</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
