"use client";

import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Store,
  Layers,
  FileCode
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDemo?: () => void;
}

export default function EmbedCodeModal({
  isOpen,
  onClose,
  onLaunchDemo
}: EmbedCodeModalProps) {
  const [activePlatform, setActivePlatform] = useState<"shopify" | "wordpress" | "webflow" | "html">("shopify");
  const [copied, setCopied] = useState(false);
  const [widgetColor, setWidgetColor] = useState("#2563EB");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  const embedScript = `<script
  src="https://cdn.nexa-ai.com/widget.v1.js"
  data-tenant="org_98314xa92"
  data-color="${widgetColor}"
  data-position="${widgetPosition}"
  data-greeting="Hi there! Need help with orders or bookings?"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const platforms = [
    { id: "shopify" as const, name: "Shopify", icon: Store },
    { id: "wordpress" as const, name: "WordPress / Woo", icon: Globe },
    { id: "webflow" as const, name: "Webflow / Framer", icon: Layers },
    { id: "html" as const, name: "Custom HTML", icon: FileCode }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy Live Chat Widget"
      subtitle="One-click embed script for your e-commerce storefront or landing page"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SSL encrypted · 99.99% CDN uptime SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
            >
              {copied ? "Copied Script!" : "Copy Embed Code"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Widget Customizer Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-2">
              {[
                { hex: "#2563EB", label: "Blue" },
                { hex: "#4F46E5", label: "Indigo" },
                { hex: "#7C3AED", label: "Violet" },
                { hex: "#059669", label: "Emerald" },
                { hex: "#E11D48", label: "Rose" },
                { hex: "#0F172A", label: "Slate" }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setWidgetColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    widgetColor === c.hex ? "scale-110 border-slate-900 shadow-xs" : "border-white"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <span className="font-mono text-[10px] text-slate-500 ml-1">{widgetColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Widget Screen Position
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWidgetPosition("bottom-right")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  widgetPosition === "bottom-right"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Bottom Right (Standard)
              </button>
              <button
                type="button"
                onClick={() => setWidgetPosition("bottom-left")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  widgetPosition === "bottom-left"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Bottom Left
              </button>
            </div>
          </div>
        </div>

        {/* Script Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-blue-600" />
              1-Line JavaScript Embed Tag
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied to clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>

          <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
            <pre className="whitespace-pre-wrap">{embedScript}</pre>
          </div>
        </div>

        {/* Platform Selection Tabs & Step-by-Step Instructions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activePlatform === p.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
            {activePlatform === "shopify" && (
              <div className="space-y-1.5">
                <p className="font-bold text-blue-950">Shopify 60-Second Installation:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Go to your <strong>Shopify Admin &gt; Online Store &gt; Themes</strong>.</li>
                  <li>Click <strong>Actions (...) &gt; Edit Code</strong>.</li>
                  <li>Open <code>layout/theme.liquid</code>.</li>
                  <li>Paste the script tag directly before the closing <code>&lt;/body&gt;</code> tag and save.</li>
                </ol>
              </div>
            )}

            {activePlatform === "wordpress" && (
              <div className="space-y-1.5">
                <p className="font-bold text-blue-950">WordPress &amp; WooCommerce Installation:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>In your WP Dashboard, install the free <strong>WPCode (Insert Headers and Footers)</strong> plugin.</li>
                  <li>Navigate to <strong>Code Snippets &gt; Header &amp; Footer</strong>.</li>
                  <li>Paste the script snippet into the <strong>Footer</strong> box and click <strong>Save Changes</strong>.</li>
                </ol>
              </div>
            )}

            {activePlatform === "webflow" && (
              <div className="space-y-1.5">
                <p className="font-bold text-blue-950">Webflow or Framer Installation:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Navigate to your <strong>Project Settings &gt; Custom Code</strong> tab.</li>
                  <li>Paste the script tag into the <strong>Footer Code</strong> section.</li>
                  <li>Publish your project to make the live chat assistant active on all pages.</li>
                </ol>
              </div>
            )}

            {activePlatform === "html" && (
              <div className="space-y-1.5">
                <p className="font-bold text-blue-950">Custom HTML / React / Next.js Storefronts:</p>
                <p className="text-[11px] text-slate-600">
                  Include this tag right before the closing <code>&lt;/body&gt;</code> tag in your root <code>index.html</code> or inside <code>&lt;Script strategy="lazyOnload" /&gt;</code> in Next.js.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
