"use client";

import React, { useState } from "react";
import {
  Sliders,
  Plug,
  Key,
  Palette,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";

interface ScreenAccountSetupProps {
  onNavigate?: (screen: number) => void;
}

export default function ScreenAccountSetup({ onNavigate }: ScreenAccountSetupProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form states
  const [storeId, setStoreId] = useState("store_live_98314xa92");
  const [apiKey, setApiKey] = useState("nexa_live_894104928104810948194");
  const [webhookUrl, setWebhookUrl] = useState("https://api.domain.com/v1/webhooks/store");
  const [brandColor, setBrandColor] = useState("#2563EB");
  const [assistantName, setAssistantName] = useState("Nexa Copilot");

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const setupCards = [
    {
      id: "store-account",
      title: "Store & CRM Account",
      desc: "Connect and manage your E-Commerce Store & CRM integration",
      badge: "Connected",
      variant: "connected" as const,
      icon: Sliders,
      action: () => setActiveModal("store")
    },
    {
      id: "integrations",
      title: "Integrations",
      desc: "Connect third party tools and services",
      icon: Plug,
      action: () => onNavigate?.(17) // Go to Integrations Hub
    },
    {
      id: "api-webhooks",
      title: "API & Webhooks",
      desc: "Manage API keys and webhook settings",
      icon: Key,
      action: () => setActiveModal("webhooks")
    },
    {
      id: "branding",
      title: "Branding",
      desc: "Customize your AI assistant's appearance",
      icon: Palette,
      action: () => setActiveModal("branding")
    },
    {
      id: "permissions",
      title: "Permissions",
      desc: "Manage user roles and access levels",
      icon: ShieldCheck,
      action: () => onNavigate?.(12) // Go to Settings & Team
    }
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1">
          Home / Account Setup
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Account Setup
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your store and CRM account settings, integrations, and preferences.
            </p>
          </div>
          <StatusBadge status="Connected" variant="connected" pulse />
        </div>
      </div>

      {/* Setup Cards List */}
      <div className="space-y-3">
        {setupCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.action}
              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {card.badge && (
                  <StatusBadge status={card.badge} variant={card.variant} pulse={false} />
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Store & CRM Account Modal */}
      <Modal
        isOpen={activeModal === "store"}
        onClose={() => setActiveModal(null)}
        title="Store & CRM Integration"
        subtitle="Manage API permissions and store mappings"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert("Store & CRM settings saved successfully!");
                setActiveModal(null);
              }}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connected to store identifier <strong>store_live_98314xa92</strong></span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store / Location ID
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Last synchronized: <strong>2 minutes ago</strong></span>
          </div>
        </div>
      </Modal>

      {/* API & Webhooks Modal */}
      <Modal
        isOpen={activeModal === "webhooks"}
        onClose={() => setActiveModal(null)}
        title="API & Webhooks"
        subtitle="Manage keys for server-to-server data exchange"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Publishable API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 select-all"
              />
              <Button variant="secondary" size="sm" onClick={copyApiKey}>
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Webhook Delivery URL
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
        </div>
      </Modal>

      {/* Branding Modal */}
      <Modal
        isOpen={activeModal === "branding"}
        onClose={() => setActiveModal(null)}
        title="Assistant Branding"
        subtitle="Customize look and feel of the web chat and customer interface"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert("Branding settings applied!");
                setActiveModal(null);
              }}
            >
              Save Branding
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assistant Name
            </label>
            <input
              type="text"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-600">{brandColor}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
