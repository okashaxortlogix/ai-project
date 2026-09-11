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
  ArrowRight
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";

interface ScreenTemplatesProps {
  onNavigate?: (screen: number) => void;
}

export default function ScreenTemplates({ onNavigate }: ScreenTemplatesProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
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
      installed: false
    },
    {
      id: "tpl-2",
      name: "Lead Magnet Funnel",
      category: "Funnels",
      badge: "Funnel Template",
      description: "High-converting opt-in page with instant PDF delivery, automated email follow-up, and tag sync.",
      previewBg: "from-blue-600 to-cyan-600 text-white",
      installed: false
    },
    {
      id: "tpl-3",
      name: "Ecommerce Launch",
      category: "Campaigns",
      badge: "Campaign Template",
      description: "Multi-channel announcement campaign with Shopify/WooCommerce catalog integration and flash discounts.",
      previewBg: "from-amber-700 to-amber-950 text-white",
      installed: false
    },
    {
      id: "tpl-4",
      name: "Webinar Funnel",
      category: "Funnels",
      badge: "Funnel Template",
      description: "Registration page, countdown timer, automated SMS reminders, and replay broadcast room.",
      previewBg: "from-indigo-700 to-slate-900 text-white",
      installed: false
    },
    {
      id: "tpl-5",
      name: "Product Launch",
      category: "Websites",
      badge: "Website Template",
      description: "Full modern product showcase page with feature comparison tables, FAQ accordion, and checkout CTA.",
      previewBg: "from-slate-900 to-teal-900 text-white",
      installed: false
    },
    {
      id: "tpl-6",
      name: "Thank You Page",
      category: "Workflows",
      badge: "Workflow Template",
      description: "Post-purchase confirmation page with one-click upsells, calendar booking, and social sharing links.",
      previewBg: "from-purple-900 to-slate-900 text-white",
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
                {/* Visual Preview Header */}
                <div
                  className={`h-36 bg-gradient-to-br ${tpl.previewBg} p-4 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
                      {tpl.badge}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Installed</span>
                      </span>
                    )}
                  </div>
                  <div className="z-10">
                    <h4 className="text-base font-bold text-white tracking-tight">
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
              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-[11px] font-medium text-slate-400">
                  Category: {tpl.category}
                </span>
                <Button
                  variant={isSelected ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => handleUseTemplate(tpl)}
                >
                  {isSelected ? "Active Template" : "Use Template"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Installed Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Template: ${selectedTemplate.name}`}
          subtitle="Ready to deploy to your GHL sub-account"
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
                onClick={() => {
                  alert(`Template "${selectedTemplate.name}" deployed to your active account!`);
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
                This will create pages, contact tags, and AI agent prompt rules inside your active GoHighLevel sub-account.
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
