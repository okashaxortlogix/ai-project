"use client";

import React, { useState } from "react";
import {
  Search,
  BookOpen,
  FileText,
  ChevronRight,
  ExternalLink,
  Layers,
  Users,
  GitBranch,
  Plug,
  HelpCircle,
  ArrowLeft,
  Copy,
  Check,
  Bookmark,
  Share2,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ScreenDocumentationProps {
  onNavigate?: (screen: number) => void;
}

interface DocArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
  lastUpdated: string;
  sections: { heading: string; body: string; codeSnippet?: string }[];
}

export default function ScreenDocumentation({ onNavigate }: ScreenDocumentationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Getting Started");
  const [activeArticle, setActiveArticle] = useState<DocArticle | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = [
    { id: "Getting Started", label: "Getting Started", icon: BookOpen, count: 6 },
    { id: "Funnels", label: "Funnels", icon: Layers, count: 8 },
    { id: "CRM", label: "CRM", icon: Users, count: 5 },
    { id: "Workflows", label: "Workflows", icon: GitBranch, count: 7 },
    { id: "Integrations", label: "Integrations", icon: Plug, count: 9 },
    { id: "Troubleshooting", label: "Troubleshooting", icon: HelpCircle, count: 4 }
  ];

  const articles: DocArticle[] = [
    {
      id: "store-crm-setup",
      category: "Getting Started",
      title: "Getting Started with Store & CRM Sync",
      description: "Complete setup guide to get started with Store Integrations and Nexa AI copilot.",
      readTime: "4 min read",
      lastUpdated: "Apr 28, 2026",
      sections: [
        {
          heading: "1. Overview & Architecture",
          body: "Nexa AI synchronizes directly with your e-commerce store and CRM using official API keys and custom webhook delivery endpoints. Incoming SMS, Web Chat, and WhatsApp messages are processed with sub-second RAG response times."
        },
        {
          heading: "2. Connecting your Store & CRM",
          body: "Navigate to Account Setup or click the Store Sync indicator in the top header. Supply your Store ID and Private API Token to link your product catalog, orders, and customer pipeline.",
          codeSnippet: `// Verify connection via API\nconst res = await fetch("/api/v1/integrations/verify", {\n  headers: { "X-Store-Id": "store_demo_9824" }\n});\nconsole.log(res.status); // 200 OK`
        },
        {
          heading: "3. Automated Lead Qualification",
          body: "Enable the Nexa AI Sales Agent toggle in AI Agents menu. Every incoming lead conversation is evaluated for purchase intent, budget, and readiness before scheduling calendar appointments."
        }
      ]
    },
    {
      id: "first-funnel",
      category: "Getting Started",
      title: "Create Your First Funnel",
      description: "Learn how to build a high-converting marketing funnel from scratch with pre-built templates.",
      readTime: "6 min read",
      lastUpdated: "Apr 26, 2026",
      sections: [
        {
          heading: "1. Selecting a High-Converting Blueprint",
          body: "Visit the Templates Library and filter by Funnels. Click 'Use Template' on blueprints like 'High Ticket Coaching' or 'Lead Magnet Funnel' to deploy landing pages and opt-in steps directly into your marketing pipeline."
        },
        {
          heading: "2. Customizing AI Prompt Triggers",
          body: "Connect your landing page form submissions to trigger an immediate conversational AI follow-up via SMS or email within 60 seconds."
        }
      ]
    },
    {
      id: "automations",
      category: "Getting Started",
      title: "Set Up Automations",
      description: "Automate your follow-ups, pipeline triggers, and agent escalation workflows.",
      readTime: "5 min read",
      lastUpdated: "Apr 25, 2026",
      sections: [
        {
          heading: "1. Follow-Up Sequence Rules",
          body: "Define automated sequence timings. The standard Nexa AI cadence triggers a friendly check-in after 1 hour of customer silence, followed by a reminder at 24 hours."
        },
        {
          heading: "2. Escalation to Human Staff",
          body: "When sentiment analysis flags frustration or when a customer explicitly requests a manager, the autonomous agent triggers a webhook notification to your slack or mobile app and pauses auto-replies."
        }
      ]
    },
    {
      id: "connect-crm",
      category: "Getting Started",
      title: "Connect Your CRM",
      description: "Manage contacts, pipelines and opportunities seamlessly across all AI interactions.",
      readTime: "3 min read",
      lastUpdated: "Apr 22, 2026",
      sections: [
        {
          heading: "1. Bi-directional Contact Sync",
          body: "All leads captured during conversational live chats are instantly created or enriched in your Customer CRM with phone, email, intent score, and tags."
        }
      ]
    },
    {
      id: "api-guide",
      category: "Getting Started",
      title: "API Integration Guide",
      description: "Use the REST API & Webhook endpoints with your autonomous assistant.",
      readTime: "8 min read",
      lastUpdated: "Apr 20, 2026",
      sections: [
        {
          heading: "1. Webhook Signature Verification",
          body: "Verify all incoming webhook payloads using the HMAC-SHA256 signature passed in the request header.",
          codeSnippet: `const crypto = require("crypto");\nfunction verifyStoreWebhook(body, signature, secret) {\n  const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");\n  return hmac === signature;\n}`
        }
      ]
    },
    {
      id: "funnel-optimization",
      category: "Funnels",
      title: "Funnel Conversion Rate Optimization",
      description: "Best practices to boost lead capture on SaaS and service opt-in pages.",
      readTime: "5 min read",
      lastUpdated: "Apr 18, 2026",
      sections: [
        {
          heading: "1. Reducing Form Friction",
          body: "Replace long 8-question forms with a 2-question conversational AI chat widget to double completion rates."
        }
      ]
    },
    {
      id: "webhook-troubleshooting",
      category: "Troubleshooting",
      title: "Webhook Delivery & Tunnel Troubleshooting",
      description: "How to debug ngrok tunnels, failed deliveries, and invalid signatures.",
      readTime: "4 min read",
      lastUpdated: "Apr 15, 2026",
      sections: [
        {
          heading: "1. Testing Local Endpoints",
          body: "Ensure your ngrok tunnel is pointing to your active port (8000 for Laravel, 3000 for Next.js). Check ngrok web inspector at http://127.0.0.1:4040."
        }
      ]
    }
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <span
            onClick={() => onNavigate?.(2)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Home
          </span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Documentation</span>
          {activeArticle && (
            <>
              <span>/</span>
              <span className="text-blue-600 font-medium truncate max-w-xs">
                {activeArticle.title}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Documentation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Find guides, tutorials and helpful resources to configure your AI assistant.
            </p>
          </div>
          {activeArticle && (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => setActiveArticle(null)}
            >
              Back to Guides
            </Button>
          )}
        </div>
      </div>

      {/* ARTICLE READER VIEW */}
      {activeArticle ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge variant="active" label={activeArticle.category} />
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{activeArticle.readTime}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">Updated {activeArticle.lastUpdated}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {activeArticle.title}
              </h2>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                {activeArticle.description}
              </p>

              <div className="space-y-8 border-t border-slate-100 pt-6">
                {activeArticle.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      {sec.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {sec.body}
                    </p>
                    {sec.codeSnippet && (
                      <div className="relative rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                          <span>Example Code</span>
                          <button
                            onClick={() => handleCopyCode(sec.codeSnippet!, idx)}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre>{sec.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Was this article helpful?
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    Yes, helpful
                  </Button>
                  <Button variant="secondary" size="sm">
                    Needs update
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Table of contents sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                On this page
              </div>
              <ul className="space-y-2 text-xs">
                {activeArticle.sections.map((sec, i) => (
                  <li
                    key={i}
                    className="text-slate-600 hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
                  >
                    {sec.heading}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4 bg-blue-50/60 border-blue-100 text-center">
              <Sparkles className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-900">Need live assistance?</div>
              <p className="text-[11px] text-slate-500 mt-1 mb-3">
                Ask our AI assistant to configure this step for you automatically.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => onNavigate?.(10)}
              >
                Open AI Assistant
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        /* GUIDES LIST VIEW */
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Categories List */}
            <div className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 font-bold border border-blue-100"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-blue-200/60 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Articles List matching design image */}
            <div className="lg:col-span-3 space-y-3">
              {filteredArticles.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">No matching articles</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Try searching for another keyword or browse another category.
                  </p>
                </Card>
              ) : (
                filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArticle(art)}
                    className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-xl p-4 transition-all duration-150 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {art.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {art.readTime}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
