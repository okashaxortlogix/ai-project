"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Building2,
  Plus,
  Check,
  Layers,
  ShieldCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import { api } from "@/lib/api";

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
  onOpenGlobalSearch?: () => void;
}

export interface NotificationItem {
  id: number;
  title: string;
  time: string;
  desc: string;
  fullDetails: string;
  screen: number;
  screenName: string;
  read: boolean;
  type: "appointment" | "store" | "support" | "lead";
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
  onOpenSimulator,
  onOpenGlobalSearch
}: HeaderProps) {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeId, setStoreId] = useState("store_live_98314xa92");
  const [storeToken, setStoreToken] = useState("tok-84192401-a472-89be-01");
  const [storeConnected, setStoreConnected] = useState(true);

  // Single dropdown coordinator: only ONE dropdown can ever be open at a time ("org" | "notifications" | "user" | null)
  type DropdownType = "org" | "notifications" | "user" | null;
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const isOrgMenuOpen = activeDropdown === "org";
  const isNotificationsOpen = activeDropdown === "notifications";
  const isUserMenuOpen = activeDropdown === "user";

  const toggleDropdown = (menu: "org" | "notifications" | "user") => {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  // Click outside and Escape key listeners to close any open dropdown menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Multi-tenant organization state
  const [orgs, setOrgs] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>("org-acme-1");
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Interactive Notifications State
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "New appointment booked",
      time: "2m ago",
      desc: "Consultation slot synced with Google Calendar",
      fullDetails: "A new client meeting was autonomously scheduled by the AI Appointment Agent for Muhammad Okasha on 2026-09-15 at 10:00 AM.",
      screen: 8,
      screenName: "Calendar & Appointments",
      read: false,
      type: "appointment"
    },
    {
      id: 2,
      title: "Store sync verified",
      time: "12m ago",
      desc: "Catalog inventory refreshed with zero conflicts",
      fullDetails: "Autonomous multi-store catalog sync completed successfully across Shopify & WooCommerce. 150 items refreshed with 0 stock discrepancies.",
      screen: 17,
      screenName: "Integrations & Sync Hub",
      read: false,
      type: "store"
    },
    {
      id: 3,
      title: "Support inquiry resolved",
      time: "25m ago",
      desc: "Order fulfillment policy answered by AI Copilot",
      fullDetails: "Customer question regarding 30-day return policy was answered automatically by RAG Agent with 98% confidence score.",
      screen: 3,
      screenName: "Conversations & Support",
      read: false,
      type: "support"
    },
    {
      id: 4,
      title: "New high-score lead",
      time: "45m ago",
      desc: "Inbound buyer qualified with 88% conversion score",
      fullDetails: "Lead Ahsan Shah was enriched from inbound conversation with high purchase intent ($15,000 estimated deal size).",
      screen: 7,
      screenName: "Contacts & Leads",
      read: false,
      type: "lead"
    }
  ]);

  const [activeNotificationModal, setActiveNotificationModal] = useState<NotificationItem | null>(null);

  const unreadCount = notificationList.filter((n) => !n.read).length;

  const handleOpenNotification = (n: NotificationItem) => {
    setNotificationList((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    closeDropdown();
    setActiveNotificationModal(n);
  };

  const handleNavigateFromNotification = (screen: number, id: number) => {
    setNotificationList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    closeDropdown();
    setActiveNotificationModal(null);
    setActiveScreen(screen);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationList((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await api.getOrganizations();
        if (res && res.success && Array.isArray(res.data)) {
          setOrgs(res.data);
          const savedOrgId = typeof window !== "undefined" ? localStorage.getItem("organization_id") : null;
          if (savedOrgId && res.data.some((o: any) => o.id === savedOrgId)) {
            setCurrentOrgId(savedOrgId);
          } else if (res.data[0]) {
            setCurrentOrgId(res.data[0].id);
            if (typeof window !== "undefined") {
              localStorage.setItem("organization_id", res.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
      }
    };
    loadOrgs();
  }, []);

  const handleSwitchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    if (typeof window !== "undefined") {
      localStorage.setItem("organization_id", orgId);
    }
    closeDropdown();
    window.dispatchEvent(new CustomEvent("tenantChanged", { detail: orgId }));
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || isCreatingOrg) return;
    setIsCreatingOrg(true);
    try {
      const res = await api.createOrganization(newOrgName.trim());
      if (res && res.success && res.data) {
        setOrgs((prev) => [...prev, res.data]);
        handleSwitchOrg(res.data.id);
        setNewOrgName("");
        setIsCreateOrgModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to create organization:", e);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const currentOrg = orgs.find((o) => o.id === currentOrgId) || {
    id: currentOrgId,
    name: "Acme Electronics & Tech",
    slug: "acme-electronics"
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreConnected(true);
    setIsStoreModalOpen(false);
  };

  return (
    <>
      <header ref={headerRef} className="w-full bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-2xs">
        <div className="w-full px-4 lg:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Search Bar & Multi-Tenant Workspace Selector */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            {/* Multi-Tenant Workspace Switcher Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => toggleDropdown("org")}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-lg text-xs transition-colors cursor-pointer"
                title="Active Workspace / Tenant"
              >
                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block max-w-[130px] lg:max-w-[180px] truncate">
                  <div className="font-bold text-slate-900 leading-tight truncate">
                    {currentOrg.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-none">
                    {currentOrg.id}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOrgMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Organization Dropdown Menu */}
              {isOrgMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Switch Workspace</div>
                      <div className="text-[10px] text-slate-400">Strict Multi-Tenant Isolation</div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      {orgs.length} Tenants
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                    {orgs.map((org) => {
                      const isSelected = org.id === currentOrgId;
                      return (
                        <button
                          key={org.id}
                          onClick={() => handleSwitchOrg(org.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 text-blue-900 font-bold border border-blue-100"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-blue-600" : "bg-slate-300"}`} />
                            <div className="truncate">
                              <div className="truncate">{org.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{org.id}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        closeDropdown();
                        setIsCreateOrgModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search Trigger Input with Ctrl + K */}
            <div
              onClick={() => { closeDropdown(); onOpenGlobalSearch && onOpenGlobalSearch(); }}
              className="flex-1 relative hidden md:flex items-center justify-between bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-slate-400 group-hover:text-slate-600 font-medium">Search CRM contacts, deals, tasks, chats...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold shadow-2xs">
                <span>Ctrl</span>
                <span>+</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("notifications")}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  isNotificationsOpen
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                          All caught up
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto py-1">
                    {notificationList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications to display.
                      </div>
                    ) : (
                      notificationList.map((n) => {
                        const Icon = n.type === "appointment" ? Calendar
                          : n.type === "store" ? Sliders
                          : n.type === "support" ? MessageSquare
                          : TrendingUp;

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleOpenNotification(n)}
                            className={`p-3 rounded-lg transition-all cursor-pointer group flex items-start gap-3 ${
                              !n.read ? "bg-blue-50/40 hover:bg-blue-50/80" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${
                              !n.read ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs truncate ${!n.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.desc}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  Click to view details
                                </span>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("user")}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isUserMenuOpen ? "bg-slate-100" : "hover:bg-slate-100/80"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-1 ring-slate-200">
                  O
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Okasha</div>
                  <div className="text-[10px] text-slate-500 leading-none">Admin ({currentOrg.slug})</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Muhammad Okasha</p>
                    <p className="text-[10px] text-slate-500 truncate">Workspace: {currentOrg.name}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveScreen(12); closeDropdown(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      onClick={() => { setActiveScreen(17); closeDropdown(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Integrations Hub</span>
                    </button>
                    <button
                      onClick={() => { resetDemo(); closeDropdown(); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reset State</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { setActiveScreen(1); closeDropdown(); }}
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

      {/* Create New Workspace Modal */}
      {isCreateOrgModalOpen && (
        <Modal
          isOpen={isCreateOrgModalOpen}
          onClose={() => setIsCreateOrgModalOpen(false)}
          title="Create New Workspace / Tenant"
          description="Provision a completely isolated multi-tenant environment for a new client, store, or brand."
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateOrgModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateOrg}
                disabled={isCreatingOrg || !newOrgName.trim()}
              >
                {isCreatingOrg ? "Provisioning..." : "Create Workspace"}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Zero Data Leakage Guarantee</div>
                <div className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                  Each workspace operates with isolated CRM leads, store integrations, appointments, knowledge base vectors, and chat history.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Workspace / Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Hardware Co. or Zara Fashion"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                autoFocus
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Store Connection Modal */}
      <Modal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        title="Store & CRM Connection"
        description="Configure your E-Commerce Store or CRM API connection"
        size="md"
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
              onClick={() => { setIsStoreModalOpen(false); setActiveScreen(17); }}
              className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              <span>Go to Integrations Hub</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Notification Detail Modal */}
      {activeNotificationModal && (
        <Modal
          isOpen={!!activeNotificationModal}
          onClose={() => setActiveNotificationModal(null)}
          title={activeNotificationModal.title}
          description={`Notification event received ${activeNotificationModal.time}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveNotificationModal(null)}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNavigateFromNotification(activeNotificationModal.screen, activeNotificationModal.id)}
              >
                <span>Go to {activeNotificationModal.screenName}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-1">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 mb-1">Details</div>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {activeNotificationModal.fullDetails}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <StatusBadge variant="active" label="Target Screen" />
                <span className="font-semibold text-blue-900">{activeNotificationModal.screenName}</span>
              </div>
              <span className="text-[11px] text-blue-600 font-mono">Screen #{activeNotificationModal.screen}</span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
