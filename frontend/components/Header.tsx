"use client";

import React from "react";
import {
  Bot,
  Headphones,
  TrendingUp,
  Calendar,
  Layers,
  LayoutGrid,
  ShoppingCart,
  RotateCcw,
  Bell,
  Search,
  ChevronDown,
  Sparkles
} from "lucide-react";

interface HeaderProps {
  viewMode: "poster" | "workspace";
  setViewMode: (mode: "poster" | "workspace") => void;
  activeScreen: number;
  setActiveScreen: (screen: number) => void;
  cartCount: number;
  openCart: () => void;
  resetDemo: () => void;
}

export default function Header({
  viewMode,
  setViewMode,
  activeScreen,
  setActiveScreen,
  cartCount,
  openCart,
  resetDemo,
}: HeaderProps) {
  return (
    <header className="w-full bg-[#061226]/95 backdrop-blur-md text-white border-b border-slate-800/80 sticky top-0 z-50 shadow-md">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Org Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => { setActiveScreen(2); setViewMode("workspace"); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1677FF] via-[#10C8C8] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  AI Conversation & Sales Suite
                </h1>
                <span className="hidden sm:inline-flex text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Enterprise
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                Turn Conversations into Customers — 24/7
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Acme Corporation</span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">org-acme-1</span>
          </div>
        </div>

        {/* Center: Real-Time Autonomous Agent Status Chips */}
        <div className="hidden lg:flex items-center gap-2 bg-[#091834] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveScreen(4); setViewMode("workspace"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeScreen === 4 && viewMode === "workspace"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-blue-400" />
            <span>Support Agent</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => { setActiveScreen(5); setViewMode("workspace"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeScreen === 5 && viewMode === "workspace"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span>Sales Agent</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => { setActiveScreen(6); setViewMode("workspace"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeScreen === 6 && viewMode === "workspace"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Appointment Agent</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>
        </div>

        {/* Right Controls: Mode Toggle, Cart, User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#091834] p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("workspace")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === "workspace"
                  ? "bg-[#1677FF] text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Full interactive application view"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web App</span>
            </button>
            <button
              onClick={() => setViewMode("poster")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === "poster"
                  ? "bg-[#1677FF] text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="View all 13 screens simultaneously as an overview canvas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview Canvas</span>
            </button>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all font-medium text-xs cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#051124] text-[10px] font-bold flex items-center justify-center ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
              alt="Alex Morgan"
              className="w-8 h-8 rounded-full ring-1 ring-slate-700 object-cover"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">Alex Morgan</div>
              <div className="text-[10px] text-slate-400 leading-tight">Admin • Operations</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
