"use client";

import React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  Calendar,
  Bot,
  Database,
  Plug,
  BarChart3,
  CreditCard,
  Settings,
  Smartphone,
  LogOut
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
  setCollapsed,
}: SidebarProps) {
  const navItems = [
    { id: 2, label: "Dashboard", icon: LayoutDashboard },
    { id: 3, label: "Conversations", icon: MessageSquare, badge: "6" },
    { id: 7, label: "Leads", icon: UserCheck, badge: "Hot" },
    { id: 8, label: "Appointments", icon: Calendar },
    { id: 4, label: "Support Agent", icon: Bot },
    { id: 5, label: "Sales Agent", icon: Bot },
    { id: 6, label: "Appointment Agent", icon: Bot },
    { id: 9, label: "Knowledge Base", icon: Database },
    { id: 10, label: "Integrations", icon: Plug },
    { id: 11, label: "Analytics", icon: BarChart3 },
    { id: 12, label: "Settings", icon: Settings },
    { id: 13, label: "Mobile View", icon: Smartphone },
  ];

  return (
    <aside
      className={`bg-[#06152D] text-slate-300 border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div>
        {/* Workspace Brand / Org Selector */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-md">
              AI
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">Acme Store</div>
                <div className="text-[10px] text-teal-400">Online Suite</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1677FF] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                } ${collapsed ? "justify-center px-0" : ""}`}
                title={item.label}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badge === "Hot"
                        ? "bg-red-500 text-white"
                        : "bg-blue-500/30 text-blue-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Auth Switch */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => setActiveScreen(1)}
          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          {!collapsed && <span>Switch / Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
