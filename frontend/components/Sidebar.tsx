"use client";

import React from "react";
import {
  Home,
  MessageSquare,
  Headphones,
  TrendingUp,
  Calendar as CalendarIcon,
  LayoutTemplate,
  Sliders,
  BookOpen,
  Settings as SettingsIcon,
  Users,
  Database,
  Plug,
  BarChart3,
  Smartphone,
  Bot,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Kanban,
  Workflow,
  CheckSquare,
  DollarSign
} from "lucide-react";

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
  setCollapsed
}: SidebarProps) {
  const primaryNav = [
    { id: 2, label: "Home", icon: Home },
    { id: 3, label: "Conversations", icon: MessageSquare, badge: "6" },
    { id: 18, label: "Pipelines & Deals", icon: Kanban, badge: "$105k" },
    { id: 19, label: "Workflows", icon: Workflow, badge: "Auto" },
    { id: 7, label: "Contacts & Leads", icon: Users },
    { id: 20, label: "Tasks & Companies", icon: CheckSquare },
    { id: 4, label: "Support Agent", icon: Headphones },
    { id: 5, label: "Sales Agent", icon: TrendingUp },
    { id: 6, label: "Appointment Agent", icon: CalendarIcon },
    { id: 14, label: "Templates", icon: LayoutTemplate },
    { id: 15, label: "Account Setup", icon: Sliders },
    { id: 16, label: "Documentation", icon: BookOpen },
    { id: 12, label: "Settings", icon: SettingsIcon }
  ];

  const operationsNav = [
    { id: 8, label: "Calendar", icon: CalendarIcon },
    { id: 9, label: "Knowledge Base", icon: Database },
    { id: 10, label: "AI Assistant", icon: Sparkles },
    { id: 11, label: "Analytics", icon: BarChart3 },
    { id: 17, label: "Integrations", icon: Plug },
    { id: 13, label: "Mobile Experience", icon: Smartphone }
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 transition-all duration-200 flex flex-col justify-between shrink-0 select-none z-30 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top Branding Header */}
      <div>
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
          {!collapsed ? (
            <div
              onClick={() => setActiveScreen(2)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                  Nexa AI
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  Sales & Support AI
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setActiveScreen(2)}
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center cursor-pointer mx-auto shadow-xs"
            >
              <Bot className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50/90 text-blue-600 font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Growth & Operations Section */}
          {!collapsed && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Operations & Growth
              </div>
              <div className="space-y-0.5 mt-1">
                {operationsNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveScreen(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-50/90 text-blue-600 font-bold"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: System Online Status & User Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40">
        {!collapsed ? (
          <div className="space-y-2">
            {/* System Status Pill */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse shrink-0" />
              <div className="leading-tight">
                <span className="font-semibold">System Online</span>
                <span className="text-[10px] text-emerald-600 ml-1">Uptime 99.9%</span>
              </div>
            </div>

            {/* Profile Bar */}
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                O
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  Okasha
                </div>
                <div className="text-[10px] text-slate-500 leading-none">
                  Administrator
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse"
              title="System Online (Uptime 99.9%)"
            />
            <div
              className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold"
              title="Okasha (Administrator)"
            >
              O
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
