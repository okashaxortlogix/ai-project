"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  LayoutTemplate,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Eye,
  Monitor,
  Smartphone,
  Check,
  Globe,
  Bot
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import { api } from "@/lib/api";

interface ScreenTemplatesProps {
  onNavigate?: (screen: number) => void;
}

export default function ScreenTemplates({ onNavigate }: ScreenTemplatesProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [installedId, setInstalledId] = useState<string | null>(null);

  // New Template Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Funnels");
  const [newDesc, setNewDesc] = useState("");

  const [templates, setTemplates] = useState([
    {
      id: "tpl-1",
      name: "High Ticket Coaching",
      category: "Funnels",
      badge: "Funnel Template",
      description: "Complete funnel designed for high-ticket consultations, video sales letters, and calendar qualification.",
      previewBg: "from-slate-800 to-slate-900 text-white",
      headline: "Scale Your High-Ticket Advisory to $50k+/Month",
      subheadline: "Turn cold prospects into booked advisory clients with automated conversational qualification.",
      ctaText: "Apply For Strategy Session",
      steps: ["Application VSL", "Qualification Quiz", "Calendar Booking", "Pre-call Prep"],
      conversion: "18.4% Booking Rate",
      features: ["AI Calendar Qualifier", "SMS Reminders", "CRM Auto-tagging"],
      installed: false
    },
    {
      id: "tpl-2",
      name: "Lead Magnet Funnel",
      category: "Funnels",
      badge: "Funnel Template",
      description: "High-converting opt-in page with instant PDF delivery, automated email follow-up, and tag sync.",
      previewBg: "from-blue-600 to-cyan-600 text-white",
      headline: "Free Blueprint: 10x Your Store Conversion in 30 Days",
      subheadline: "Discover the 7 psychological sales triggers that turn casual visitors into loyal repeat customers.",
      ctaText: "Download Free Guide",
      steps: ["Opt-in Landing Page", "PDF Instant Delivery", "Email Drip Sequence", "Tripwire Offer"],
      conversion: "34.2% Opt-in Rate",
      features: ["Smart Email Delivery", "Customer Tagging", "Lead Magnet RAG Grounding"],
      installed: false
    },
    {
      id: "tpl-3",
      name: "Ecommerce Launch",
      category: "Campaigns",
      badge: "Campaign Template",
      description: "Multi-channel announcement campaign with Shopify/WooCommerce catalog integration and flash discounts.",
      previewBg: "from-amber-700 to-amber-950 text-white",
      headline: "VIP Early Access: Premium Audio Experience",
      subheadline: "Limited release wireless noise-canceling headphones. First 500 orders receive a 25% launch voucher.",
      ctaText: "Claim 25% Launch Discount",
      steps: ["VIP Pre-launch Page", "Countdown Flash Sale", "Express Checkout", "Upsell Thank You Page"],
      conversion: "12.8% Sales Conversion",
      features: ["Shopify Catalog Sync", "Discount Code Engine", "Abandoned Cart Recovery Bot"],
      installed: false
    },
    {
      id: "tpl-4",
      name: "Webinar Funnel",
      category: "Funnels",
      badge: "Funnel Template",
      description: "Registration page, countdown timer, automated SMS reminders, and replay broadcast room.",
      previewBg: "from-indigo-700 to-slate-900 text-white",
      headline: "Live Workshop: Mastering Conversational AI for Sales",
      subheadline: "Join us this Thursday at 2 PM EST for an exclusive live demonstration of autonomous sales copilots.",
      ctaText: "Reserve Your Free Seat",
      steps: ["Webinar Registration", "Calendar Countdown", "Live Stream Room", "Limited-Time Replay"],
      conversion: "41.6% Attendance Rate",
      features: ["Automated WhatsApp/SMS Reminders", "Live Q&A AI Copilot", "Countdown Scarcity Timer"],
      installed: false
    },
    {
      id: "tpl-5",
      name: "Product Launch",
      category: "Websites",
      badge: "Website Template",
      description: "Full modern product showcase page with feature comparison tables, FAQ accordion, and checkout CTA.",
      previewBg: "from-slate-900 to-teal-900 text-white",
      headline: "Next-Gen Ultra ANC Headphones — Engineered for Silence",
      subheadline: "40 hours battery life, bespoke titanium acoustic drivers, and spatial studio audio.",
      ctaText: "Order Now with Free Shipping",
      steps: ["Product Showcase Hero", "Interactive Feature Comparison", "Customer Reviews & Video Wall", "Express Checkout"],
      conversion: "9.5% Direct Checkout",
      features: ["Interactive Color Selector", "Live Inventory Scarcity", "Order Lookup Bot"],
      installed: false
    },
    {
      id: "tpl-6",
      name: "Thank You Page",
      category: "Workflows",
      badge: "Workflow Template",
      description: "Post-purchase confirmation page with one-click upsells, calendar booking, and social sharing links.",
      previewBg: "from-purple-900 to-slate-900 text-white",
      headline: "Order Confirmed! Your Journey Starts Here",
      subheadline: "Your receipt has been emailed. While we pack your order, claim your exclusive members-only add-on.",
      ctaText: "Add VIP Access for $19 (Save 60%)",
      steps: ["Order Summary & Live Tracking", "1-Click Upsell Offer", "Community Invite Link", "Support Chat Dock"],
      conversion: "21.3% Upsell Take Rate",
      features: ["Instant Order Status Lookup", "1-Click Add-on Checkout", "Automated FAQ Bot"],
      installed: false
    }
  ]);

  const categories = ["All", "Funnels", "Websites", "Workflows", "Campaigns"];

  const filtered = templates.filter((t) => {
    const matchesCat = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUseTemplate = (tpl: any) => {
    setInstalledId(tpl.id);
    setSelectedTemplate(tpl);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTpl = {
      id: `tpl-${Date.now()}`,
      name: newTitle.trim(),
      category: newCategory,
      badge: `${newCategory.slice(0, -1)} Template`,
      description: newDesc.trim() || "Custom pre-configured funnel template.",
      previewBg: "from-blue-800 to-slate-900 text-white",
      headline: newTitle.trim(),
      subheadline: newDesc.trim() || "Automated conversational funnel with live lead capture.",
      ctaText: "Get Started Now",
      steps: ["Landing Page", "Lead Capture", "Confirmation"],
      conversion: "20% Estimated Conversion",
      features: ["AI Qualified Leads", "Instant Email Delivery", "CRM Auto-sync"],
      installed: false
    };

    setTemplates([newTpl, ...templates]);
    setIsCreateModalOpen(false);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Use pre-built templates to get started quickly
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Templates Grid (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tpl) => {
          const isSelected = installedId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Visual Preview Header (Click to preview) */}
                <div
                  onClick={() => setPreviewTemplate(tpl)}
                  className={`h-36 bg-gradient-to-br ${tpl.previewBg} p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer group`}
                  title="Click to preview template"
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
                      {tpl.badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Installed</span>
                        </span>
                      )}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-xs text-white">
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </span>
                    </div>
                  </div>
                  <div className="z-10">
                    <h4 className="text-base font-bold text-white tracking-tight group-hover:underline">
                      {tpl.name}
                    </h4>
                  </div>

                  {/* Subtle Grid overlay */}
                  <div className="absolute inset-0 bg-radial from-transparent to-black/30 pointer-events-none" />
                </div>

                {/* Body Content */}
                <div className="p-4">
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[3rem]">
                    {tpl.description}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto gap-2">
                <span className="text-[11px] font-medium text-slate-400 truncate">
                  Category: {tpl.category}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant={isSelected ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    {isSelected ? "Active" : "Use Template"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Template Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Preview: {previewTemplate.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {previewTemplate.category}
              </span>
            </div>
          }
          subtitle={previewTemplate.description}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Mock Device Frame */}
            <div
              className={`mx-auto bg-slate-900 rounded-xl p-2.5 shadow-lg transition-all ${
                previewDevice === "mobile" ? "max-w-xs" : "w-full"
              }`}
            >
              {/* Browser Window Bar */}
              <div className="flex items-center justify-between pb-2 px-1 text-[10px] text-slate-400 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <div className="bg-slate-800 px-3 py-0.5 rounded text-[10px] font-mono text-slate-300 truncate max-w-[220px]">
                  https://yourdomain.com/{previewTemplate.id}
                </div>
                <Globe className="w-3 h-3 text-slate-500" />
              </div>

              {/* Rendered Template Body Mockup */}
              <div className="bg-white rounded-b-lg overflow-hidden text-slate-800">
                {/* Hero Header */}
                <div
                  className={`bg-gradient-to-br ${previewTemplate.previewBg} p-5 sm:p-6 text-white text-center relative`}
                >
                  <div className="max-w-md mx-auto space-y-2">
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                      {previewTemplate.badge}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight leading-snug">
                      {previewTemplate.headline || previewTemplate.name}
                    </h2>
                    <p className="text-[11px] text-white/80 leading-relaxed max-w-sm mx-auto">
                      {previewTemplate.subheadline || previewTemplate.description}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block bg-white text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100">
                        {previewTemplate.ctaText || "Get Started Now"}
                      </span>
                    </div>
                  </div>

                  {/* Floating Mock AI Agent Bubble */}
                  <div className="absolute bottom-2.5 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    <span>AI Copilot Active</span>
                  </div>
                </div>

                {/* Features Highlights Strip */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  {(previewTemplate.features || ["Instant Setup", "AI Integrated", "Mobile Ready"]).map(
                    (feat: string, i: number) => (
                      <div key={i} className="p-1.5 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
                        <Check className="w-3 h-3 text-emerald-600 mx-auto mb-0.5" />
                        <span className="text-[10px] font-semibold text-slate-700 block truncate">{feat}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Template Specs & Included Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs">Included Steps &amp; Pages</span>
                <div className="flex flex-wrap gap-1.5">
                  {(previewTemplate.steps || ["Landing Page", "Checkout", "Thank You"]).map(
                    (step: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-700"
                      >
                        {idx + 1}. {step}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block text-xs">Conversion Benchmark</span>
                <p className="text-[11px] text-blue-800">
                  Avg. Industry Conversion:{" "}
                  <span className="font-bold text-blue-900">
                    {previewTemplate.conversion || "22.4% Avg Conversion"}
                  </span>
                </p>
                <p className="text-[10px] text-blue-600">
                  Pre-wired with autonomous objection handling and CRM event webhooks.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Template Installed Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Template: ${selectedTemplate.name}`}
          subtitle="Ready to deploy to your connected store & CRM"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  try {
                    await api.createWorkflow({
                      name: `Template: ${selectedTemplate.name}`,
                      trigger_type: "template_deploy",
                      description: `Auto-generated from template: ${selectedTemplate.name}`,
                      actions: [
                        { id: "act-1", type: "add_tag", config: { tag: selectedTemplate.name.toLowerCase().replace(/\s+/g, '-') } },
                        { id: "act-2", type: "log_activity", config: { note: `Deployed template: ${selectedTemplate.name}` } }
                      ]
                    });
                    setInstalledId(selectedTemplate.id);
                  } catch (e) {
                    console.error("Template deploy error:", e);
                  }
                  setSelectedTemplate(null);
                }}
              >
                Deploy to Account
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="font-bold text-blue-900 block mb-1">
                Installation Target
              </span>
              <span className="text-blue-700">
                This will create pages, contact tags, and AI agent prompt rules inside your active store & CRM system.
              </span>
            </div>
            <p>
              <strong>Included Components:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Responsive Desktop & Mobile Landing Page</li>
              <li>Pre-wired Lead Qualification Prompt Rules</li>
              <li>Automated Calendar Booking Widget</li>
              <li>Zapier / Webhook payload dispatcher</li>
            </ul>
          </div>
        </Modal>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Template"
        subtitle="Build and save a customized blueprint for your agency"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTemplate}>
              Save Template
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTemplate} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Real Estate Listing Qualifier"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="Funnels">Funnels</option>
              <option value="Websites">Websites</option>
              <option value="Workflows">Workflows</option>
              <option value="Campaigns">Campaigns</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain the purpose and components of this template..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
