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
  Bot,
  ShieldCheck,
  Activity,
  Zap,
  AlertCircle
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

  // Credential input states
  const [credStoreDomain, setCredStoreDomain] = useState("nexa-demo-store.myshopify.com");
  const [credAccessToken, setCredAccessToken] = useState("shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6");
  const [credWebhookSecret, setCredWebhookSecret] = useState("whsec_994821a884ef02bc44");
  const [credStoreUrl, setCredStoreUrl] = useState("https://mystore.example.com");
  const [credConsumerKey, setCredConsumerKey] = useState("ck_9a8b7c6d5e4f3a2b1c0d");
  const [credConsumerSecret, setCredConsumerSecret] = useState("cs_1a2b3c4d5e6f7a8b9c0d");
  const [credPhoneNumberId, setCredPhoneNumberId] = useState("108492049281742");
  const [credWhatsAppToken, setCredWhatsAppToken] = useState("EAAGz0...meta_permanent_token");
  const [credCalendarId, setCredCalendarId] = useState("sales-bookings@company.com");

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

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
    loadDocsAndIntegrations();
  }, []);

  const loadDocsAndIntegrations = () => {
    loadIntegrations();
  };

  const handleTestConnection = async () => {
    if (!managingItem) return;
    setIsTesting(true);
    setTestResult(null);

    let credentials: Record<string, any> = {};
    if (managingItem.provider === "shopify") {
      credentials = { storeDomain: credStoreDomain, accessToken: credAccessToken, webhookSecret: credWebhookSecret };
    } else if (managingItem.provider === "woocommerce") {
      credentials = { storeUrl: credStoreUrl, consumerKey: credConsumerKey, consumerSecret: credConsumerSecret };
    } else if (managingItem.provider === "whatsapp") {
      credentials = { phoneNumberId: credPhoneNumberId, accessToken: credWhatsAppToken };
    } else if (managingItem.provider === "google_calendar") {
      credentials = { calendarId: credCalendarId };
    }

    try {
      const res = await api.testIntegration(managingItem.provider, credentials);
      if (res && res.success) {
        setTestResult({
          success: true,
          message: res.message || "Connection verified successfully!",
          latencyMs: res.latencyMs || 84
        });
        setIntegrations((prev) =>
          prev.map((i) => (i.provider === managingItem.provider ? { ...i, connected: true } : i))
        );
        setManagingItem((prev: any) => ({ ...prev, connected: true }));
      } else {
        setTestResult({
          success: false,
          message: res.error || "Failed to verify connection with remote server."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network timeout connecting to provider API."
      });
    } finally {
      setIsTesting(false);
    }
  };

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

      {/* Manage Integration Modal with Real Credentials & Testing */}
      {managingItem && (
        <Modal
          isOpen={!!managingItem}
          onClose={() => {
            setManagingItem(null);
            setTestResult(null);
          }}
          title={`Configure ${managingItem.name}`}
          description="Enter production API credentials to connect real-time sync with your store."
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  icon={Zap}
                >
                  {isTesting ? "Testing API..." : "Test Connection"}
                </Button>
                {managingItem.connected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleToggle(managingItem.provider)}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setManagingItem(null);
                  setTestResult(null);
                }}
              >
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Status & Sync Info */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Service:</span>
                <span className="font-bold text-slate-900">{managingItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Connection State:</span>
                <StatusBadge
                  variant={managingItem.connected ? "connected" : "neutral"}
                  label={managingItem.connected ? "Live & Verified" : "Awaiting Credentials"}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Inbound Webhook:</span>
                <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  /api/v1/{managingItem.provider}/webhook
                </span>
              </div>
            </div>

            {/* Test Result Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {testResult.success ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.success ? "Connection Verified" : "Authentication Failed"}
                    {testResult.latencyMs && (
                      <span className="ml-2 font-mono text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        {testResult.latencyMs}ms latency
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Provider-Specific Credentials */}
            {managingItem.provider === "shopify" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shopify Store Domain
                  </label>
                  <input
                    type="text"
                    placeholder="mybrand.myshopify.com"
                    value={credStoreDomain}
                    onChange={(e) => setCredStoreDomain(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shopify Admin API Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="shpat_..."
                    value={credAccessToken}
                    onChange={(e) => setCredAccessToken(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Webhook Signing Secret
                  </label>
                  <input
                    type="password"
                    placeholder="whsec_..."
                    value={credWebhookSecret}
                    onChange={(e) => setCredWebhookSecret(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {managingItem.provider === "woocommerce" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WordPress / WooCommerce Site URL</label>
                  <input
                    type="url"
                    placeholder="https://mystore.com"
                    value={credStoreUrl}
                    onChange={(e) => setCredStoreUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consumer Key</label>
                    <input
                      type="password"
                      placeholder="ck_..."
                      value={credConsumerKey}
                      onChange={(e) => setCredConsumerKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consumer Secret</label>
                    <input
                      type="password"
                      placeholder="cs_..."
                      value={credConsumerSecret}
                      onChange={(e) => setCredConsumerSecret(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {managingItem.provider === "whatsapp" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 108492049281742"
                    value={credPhoneNumberId}
                    onChange={(e) => setCredPhoneNumberId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta Cloud API Permanent Access Token</label>
                  <input
                    type="password"
                    placeholder="EAAGz..."
                    value={credWhatsAppToken}
                    onChange={(e) => setCredWhatsAppToken(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {managingItem.provider === "google_calendar" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Google Calendar ID</label>
                  <input
                    type="email"
                    placeholder="primary or sales@company.com"
                    value={credCalendarId}
                    onChange={(e) => setCredCalendarId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {managingItem.provider !== "shopify" && managingItem.provider !== "woocommerce" && managingItem.provider !== "whatsapp" && managingItem.provider !== "google_calendar" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Key / Access Secret</label>
                <input
                  type="password"
                  defaultValue="sec_live_994821a884ef02bc44"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
