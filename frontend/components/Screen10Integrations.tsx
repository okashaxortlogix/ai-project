"use client";

import React, { useState, useEffect } from "react";
import {
  Plug,
  CheckCircle2,
  ExternalLink,
  Plus,
  Settings,
  Calendar,
  ShoppingBag,
  Store,
  Database,
  MessageCircle,
  Phone,
  Mail,
  X
} from "lucide-react";
import { api } from "@/lib/api";

interface Screen10IntegrationsProps {
  isCompact?: boolean;
}

export default function Screen10Integrations({ isCompact = false }: Screen10IntegrationsProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "connected" | "available">("all");
  const [managingIntegration, setManagingIntegration] = useState<any | null>(null);

  const loadIntegrations = async () => {
    try {
      const res = await api.getIntegrations();
      if (res.success && res.data) {
        setIntegrations(res.data);
      }
    } catch (e) {
      console.error("Failed to load integrations from API", e);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "calendar":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "shopping-bag":
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case "store":
        return <Store className="w-5 h-5 text-purple-600" />;
      case "database":
        return <Database className="w-5 h-5 text-amber-600" />;
      case "message-circle":
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case "phone":
        return <Phone className="w-5 h-5 text-rose-600" />;
      case "mail":
        return <Mail className="w-5 h-5 text-sky-600" />;
      default:
        return <Plug className="w-5 h-5 text-slate-600" />;
    }
  };

  const toggleConnection = async (provider: string) => {
    try {
      const res = await api.toggleIntegration(provider);
      if (res.success) {
        await loadIntegrations();
      }
    } catch (e) {
      console.error("Toggle error", e);
    }
  };

  const filteredIntegrations = integrations.filter((item) => {
    if (activeTab === "connected") return item.connected;
    if (activeTab === "available") return !item.connected;
    return true;
  });

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Integrations</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {integrations.filter((i) => i.connected).length} Connected (API)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect external calendars, CRMs, e-commerce stores, and messaging APIs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          {(["all", "connected", "available"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
        {filteredIntegrations.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              item.connected
                ? "border-blue-200/90 bg-blue-50/15 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                  {getIcon(item.icon)}
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    item.connected
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {item.connected ? "Connected" : "Available"}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {item.category === "calendar"
                  ? "Sync customer appointments and real-time scheduling slots directly."
                  : item.category === "ecommerce"
                  ? "Synchronize store catalog, real-time stock levels, and order lookups."
                  : "Push qualified conversation leads, contact records, and webhooks."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 capitalize font-medium">
                Category: {item.category}
              </span>

              {item.connected ? (
                <button
                  onClick={() => setManagingIntegration(item)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Manage
                </button>
              ) : (
                <button
                  onClick={() => toggleConnection(item.provider)}
                  className="px-3 py-1 bg-[#1677FF] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Integration Management Modal */}
      {managingIntegration && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {getIcon(managingIntegration.icon)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{managingIntegration.name}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold">Active & Synchronized</p>
                </div>
              </div>
              <button
                onClick={() => setManagingIntegration(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider:</span>
                  <span className="font-mono text-slate-700 font-semibold">{managingIntegration.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-600 font-semibold">Live Connected</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  toggleConnection(managingIntegration.provider);
                  setManagingIntegration(null);
                }}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Disconnect
              </button>

              <button
                onClick={() => setManagingIntegration(null)}
                className="px-4 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
