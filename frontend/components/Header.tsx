"use client";

import React from "react";
import {
  Bot,
  Headphones,
  TrendingUp,
  Calendar,
  Sparkles,
  Layers,
  LayoutGrid,
  ShoppingCart,
  RotateCcw,
  CheckCircle2
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
    <header className="w-full bg-[#051124] text-white border-b border-slate-800/80 shadow-2xl sticky top-0 z-50">
      {/* Top Banner with Branding & 3 Feature Agent Cards + Promo Card */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 items-center">
          
          {/* 1. Main Logo & Brand */}
          <div className="xl:col-span-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#1677FF] to-[#10C8C8] flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AI Conversation & Sales Suite
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Enterprise
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                Turn Conversations into Customers — 24/7
              </p>
            </div>
          </div>

          {/* 2. Customer Support Agent Card */}
          <div 
            onClick={() => { setActiveScreen(4); setViewMode("workspace"); }}
            className={`xl:col-span-2 cursor-pointer transition-all duration-200 rounded-xl p-2.5 border flex items-center gap-3 ${
              activeScreen === 4 && viewMode === "workspace"
                ? "bg-blue-600/30 border-blue-400 shadow-md shadow-blue-500/20"
                : "bg-[#0A1B38] border-blue-900/60 hover:border-blue-500/50 hover:bg-[#0E244A]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#1677FF] flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                Customer Support Agent
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Answers queries, resolves issues, tracks orders
              </p>
            </div>
          </div>

          {/* 3. Sales Agent Card */}
          <div 
            onClick={() => { setActiveScreen(5); setViewMode("workspace"); }}
            className={`xl:col-span-2 cursor-pointer transition-all duration-200 rounded-xl p-2.5 border flex items-center gap-3 ${
              activeScreen === 5 && viewMode === "workspace"
                ? "bg-teal-600/30 border-teal-400 shadow-md shadow-teal-500/20"
                : "bg-[#07242E] border-teal-900/60 hover:border-teal-400/50 hover:bg-[#0C3442]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#10C8C8] flex items-center justify-center shrink-0 shadow-md shadow-teal-500/30">
              <TrendingUp className="w-5 h-5 text-[#051124]" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                Sales Agent
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Recommends products, handles objections, drives sales
              </p>
            </div>
          </div>

          {/* 4. Appointment Agent Card */}
          <div 
            onClick={() => { setActiveScreen(6); setViewMode("workspace"); }}
            className={`xl:col-span-2 cursor-pointer transition-all duration-200 rounded-xl p-2.5 border flex items-center gap-3 ${
              activeScreen === 6 && viewMode === "workspace"
                ? "bg-purple-600/30 border-purple-400 shadow-md shadow-purple-500/20"
                : "bg-[#1E143A] border-purple-900/60 hover:border-purple-400/50 hover:bg-[#2B1B54]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#8B5CF6] flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                Appointment Agent
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Books meetings & services, syncs calendar
              </p>
            </div>
          </div>

          {/* 5. Promotional Callout Card */}
          <div className="xl:col-span-3 rounded-xl p-2.5 border border-amber-500/20 bg-gradient-to-r from-[#17203A] to-[#1F2747] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-200">
                More Conversations. More Leads. More Revenue.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
              24/7 AI
            </span>
          </div>

        </div>

        {/* Action & Mode Switch Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#09162E] p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode("poster")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "poster"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Poster Overview (All 13 Screens)
            </button>
            <button
              onClick={() => setViewMode("workspace")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "workspace"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Interactive Workspace
            </button>
          </div>

          {/* Direct Screen Jump Pill Selector */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Jump:</span>
            {[
              { id: 1, name: "1. Login" },
              { id: 2, name: "2. Dashboard" },
              { id: 3, name: "3. Live Chat" },
              { id: 4, name: "4. Support Agent" },
              { id: 5, name: "5. Sales Agent" },
              { id: 6, name: "6. Appointment" },
              { id: 7, name: "7. Leads" },
              { id: 8, name: "8. Calendar" },
              { id: 9, name: "9. Knowledge" },
              { id: 10, name: "10. Integrations" },
              { id: 11, name: "11. Analytics" },
              { id: 12, name: "12. Settings" },
              { id: 13, name: "13. Mobile" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveScreen(s.id);
                  setViewMode("workspace");
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeScreen === s.id && viewMode === "workspace"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Right Controls: Cart & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={openCart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-all font-medium text-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#051124] text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={resetDemo}
              title="Reset Demo Data"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
