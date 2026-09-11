"use client";

import React, { useState, useEffect } from "react";
import {
  Plug,
  Calendar,
  ShoppingBag,
  Store,
  Database,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Sparkles,
  Bot
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

interface Screen10IntegrationsProps {
  onNavigate?: (screen: number) => void;
  isCompact?: boolean;
}

export default function Screen10Integrations({ onNavigate, isCompact = false }: Screen10IntegrationsProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"All" | "Connected" | "Available">("All");
  const [managingItem, setManagingItem] = useState<any | null>(null);

  const DEFAULT_CATALOG = [
    { id: "shopify", name: "Shopify Store", provider: "shopify", description: "Real-time order sync, catalog recommendations, and automated inventory balance.", icon: "shopify", connected: false },
    { id: "woocommerce", name: "WooCommerce", provider: "woocommerce", description: "Cross-platform sync with active HMAC signature verification on webhook 2146.", icon: "woocommerce", connected: false },
    { id: "google_calendar", name: "Google Calendar", provider: "google_calendar", description: "Two-way meeting sync, buffer calculation, and appointment reservation.", icon: "google-calendar", connected: false },
    { id: "hubspot", name: "HubSpot CRM", provider: "hubspot", description: "Sub-account sync for contacts, deals, pipelines, and conversation webhooks.", icon: "ghl", connected: false },
    { id: "email", name: "Email SMTP / SES", provider: "email", description: "Transactional confirmations, escalation alerts, and digest delivery.", icon: "mail", connected: false },
    { id: "whatsapp", name: "WhatsApp Business", provider: "whatsapp", description: "Autonomous chat copilot responses over official Meta Cloud API.", icon: "whatsapp", connected: false }
  ];

  const loadIntegrations = async () => {
    try {
      const res = await api.getIntegrations();
      const dbItems = (res && res.success && Array.isArray(res.data)) ? res.data : [];

      const merged = DEFAULT_CATALOG.map((cat) => {
        const found = dbItems.find((d: any) => d.provider === cat.provider || d.id === cat.id);
        if (found) {
          return {
            ...cat,
            ...found,
            connected: Boolean(found.connected || found.status === "active" || found.status === "connected")
          };
        }
        return cat;
      });

      setIntegrations(merged);
    } catch (e) {
      console.error("Failed to load integrations", e);
      setIntegrations(DEFAULT_CATALOG);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleToggle = async (provider: string) => {
    try {
      await api.toggleIntegration(provider);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.provider === provider ? { ...item, connected: !item.connected } : item
        )
      );
      if (managingItem && managingItem.provider === provider) {
        setManagingItem((prev: any) => ({ ...prev, connected: !prev.connected }));
      }
    } catch (e) {
      console.error("Failed to toggle integration", e);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "bot":
      case "ghl":
        return <Bot className="w-5 h-5 text-blue-600" />;
      case "shopping-bag":
      case "shopify":
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case "store":
      case "woocommerce":
        return <Store className="w-5 h-5 text-purple-600" />;
      case "calendar":
      case "google-calendar":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "mail":
      case "email":
        return <Mail className="w-5 h-5 text-sky-600" />;
      case "message-circle":
      case "whatsapp":
        return <MessageCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <Plug className="w-5 h-5 text-slate-600" />;
    }
  };

  const filteredItems = integrations.filter((item) => {
    if (activeFilter === "Connected") return item.connected;
    if (activeFilter === "Available") return !item.connected;
    return true;
  });

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
          <span className="text-slate-800 font-semibold">Integrations Hub</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Integrations Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect external calendars, CRMs, e-commerce stores, and messaging APIs.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            {(["All", "Connected", "Available"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === tab
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Cards Grid matching Page 10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                  {renderIcon(item.icon || item.provider)}
                </div>
                <StatusBadge
                  variant={item.connected ? "connected" : "neutral"}
                  label={item.connected ? "Connected" : "Not Connected"}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {item.provider}
              </span>
              <Button
                variant={item.connected ? "secondary" : "primary"}
                size="sm"
                onClick={() => setManagingItem(item)}
              >
                {item.connected ? "Manage" : "Connect"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Manage Integration Modal */}
      {managingItem && (
        <Modal
          isOpen={!!managingItem}
          onClose={() => setManagingItem(null)}
          title={`${managingItem.name} Integration`}
          description="Configure synchronization parameters and webhook security."
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant={managingItem.connected ? "destructive" : "primary"}
                size="sm"
                onClick={() => handleToggle(managingItem.provider)}
              >
                {managingItem.connected ? "Disconnect Service" : "Authorize & Connect"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setManagingItem(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{managingItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge
                  variant={managingItem.connected ? "connected" : "neutral"}
                  label={managingItem.connected ? "Connected" : "Disconnected"}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Webhook Endpoint:</span>
                <span className="font-mono text-[10px] text-slate-700">
                  /api/v1/{managingItem.provider}/webhook
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                API Token / Webhook Secret
              </label>
              <input
                type="password"
                defaultValue="••••••••••••••••••••••••••••••••"
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
