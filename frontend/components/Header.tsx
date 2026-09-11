"use client";

import React, { useState } from "react";
import {
  Bot,
  Search,
  Bell,
  CheckCircle2,
  Sliders,
  LogOut,
  User,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  Radio,
  Code2,
  Zap
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";

interface HeaderProps {
  viewMode: "poster" | "workspace";
  setViewMode: (mode: "poster" | "workspace") => void;
  activeScreen: number;
  setActiveScreen: (screen: number) => void;
  cartCount?: number;
  openCart?: () => void;
  resetDemo: () => void;
  onOpenEmbed?: () => void;
  onOpenSimulator?: () => void;
}

export default function Header({
  viewMode,
  setViewMode,
  activeScreen,
  setActiveScreen,
  cartCount = 0,
  openCart,
  resetDemo,
  onOpenEmbed,
  onOpenSimulator
}: HeaderProps) {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeId, setStoreId] = useState("store_live_98314xa92");
  const [storeToken, setStoreToken] = useState("tok-84192401-a472-89be-01");
  const [storeConnected, setStoreConnected] = useState(true);

  const notifications = [
    { id: 1, title: "New appointment booked", time: "2m ago", desc: "Dental Consultation with Sarah Ahmed" },
    { id: 2, title: "Shopify order synced", time: "12m ago", desc: "Order #12345 inventory updated in WooCommerce" },
    { id: 3, title: "Support ticket resolved", time: "25m ago", desc: "Customer #2456 marked resolved by Support Bot" },
    { id: 4, title: "New lead captured", time: "45m ago", desc: "Ali Raza qualified with score 88%" }
  ];

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreConnected(true);
    setIsStoreModalOpen(false);
  };

  return (
    <>
      <header className="w-full bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-2xs">
        <div className="w-full px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Controls, Store Status, Notifications, User */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Deploy Widget Button */}
            {onOpenEmbed && (
              <button
                onClick={onOpenEmbed}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                title="Get 1-line script embed code"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Get Embed Code</span>
              </button>
            )}

            {/* Live Demo Event Simulator */}
            {onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors cursor-pointer"
                title="Simulate live order, lead, or booking during sales pitches"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Simulator</span>
              </button>
            )}

            {/* Quick AI Assistant Button */}
            <button
              onClick={() => setActiveScreen(10)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Store Connection Status Pill */}
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              title="Click to manage Store & CRM connection"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
              <span>Store Sync Active</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">
                      Mark all read
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-1 ring-slate-200">
                  O
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Okasha</div>
                  <div className="text-[10px] text-slate-500 leading-none">Administrator</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Muhammad Okasha</p>
                    <p className="text-[10px] text-slate-500">okasha@company.com</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveScreen(12); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => { setActiveScreen(9); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Integrations</span>
                    </button>
                    <button
                      onClick={() => { resetDemo(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reset State</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { setActiveScreen(1); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Store Connection Modal */}
      <Modal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        title="Store & CRM Connection"
        subtitle="Configure your E-Commerce Store or CRM API connection"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { setStoreConnected(false); setIsStoreModalOpen(false); }}
            >
              Disconnect
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsStoreModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveStore}>
                Save & Connect
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-semibold">Store Sync Active</p>
              <p className="text-blue-700 text-[11px] mt-0.5">
                Real-time sync is currently active. Conversations, product catalogs, and contacts are flowing seamlessly.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store ID / Domain
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              placeholder="e.g. mystore.myshopify.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Private API Token / Secret
            </label>
            <input
              type="password"
              value={storeToken}
              onChange={(e) => setStoreToken(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              placeholder="tok-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Manage All Channels:</span>
            <button
              type="button"
              onClick={() => { setIsStoreModalOpen(false); setActiveScreen(9); }}
              className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              <span>Go to Integrations Hub</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
