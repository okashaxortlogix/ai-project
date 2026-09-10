"use client";

import React, { useState } from "react";
import {
  Headphones,
  Package,
  Truck,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Clock,
  Send,
  MapPin,
  FileText,
  X
} from "lucide-react";

interface Screen4SupportAgentProps {
  isCompact?: boolean;
}

export default function Screen4SupportAgent({ isCompact = false }: Screen4SupportAgentProps) {
  const [messages, setMessages] = useState([
    {
      id: "sup-1",
      sender: "customer",
      content: "Where is my order #12345?",
      time: "10:14 AM"
    },
    {
      id: "sup-2",
      sender: "agent",
      content: "Let me check that for you. I found your order #12345. It's currently out for delivery and is expected to arrive tomorrow, Apr 29, 2025.\n\nYou can track it here:",
      hasAction: true,
      time: "10:15 AM"
    },
    {
      id: "sup-3",
      sender: "customer",
      content: "Thank you!",
      time: "10:17 AM"
    }
  ]);

  const [input, setInput] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQ = input;
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: "customer",
      content: userQ,
      time: "Just now"
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      let reply = "I'm happy to help with that. Our customer support team ensures fast resolutions 24/7.";
      const lower = userQ.toLowerCase();
      if (lower.includes("return") || lower.includes("refund")) {
        reply = "We offer a 30-day hassle-free return policy! You can generate a free return shipping label directly from your account portal.";
      } else if (lower.includes("shipping") || lower.includes("delay")) {
        reply = "Standard shipments take 3-5 business days. Express shipping is delivered within 24-48 hours with signature confirmation.";
      } else if (lower.includes("cancel")) {
        reply = "Orders can be modified or cancelled within 2 hours of placing. For order #12345, it is currently in transit with the carrier.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "agent",
          content: reply,
          time: "Just now"
        }
      ]);
    }, 800);
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${isCompact ? "text-xs" : ""}`}>
      {/* Top Banner */}
      <div className="p-3.5 bg-[#071B3A] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center shadow-md">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              Customer Support Agent
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-slate-300">
              Live Order Retrieval & Policy Resolution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
            RAG Grounded
          </span>
        </div>
      </div>

      {/* Two Column Layout: Left Chat / Right Order Details & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Left Chat Window */}
        <div className="md:col-span-8 p-4 flex flex-col justify-between border-r border-slate-200 bg-slate-50/50">
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {messages.map((m) => {
              const isCust = m.sender === "customer";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isCust ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isCust ? "bg-blue-600 text-white" : "bg-[#071B3A] text-white"
                    }`}
                  >
                    {isCust ? "U" : <Headphones className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isCust
                          ? "bg-[#1677FF] text-white rounded-tr-xs"
                          : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>
                      
                      {m.hasAction && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setShowOrderModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1677FF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Support Composer */}
          <form onSubmit={handleSend} className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask support agent (e.g. 'What is your return policy?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-[#1677FF] hover:bg-blue-600 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Side: Order Details & Related FAQs */}
        <div className="md:col-span-4 p-4 bg-white flex flex-col justify-between space-y-4">
          {/* Order Details Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Order Details</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Out for Delivery
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Order number:</span>
                <span className="font-semibold text-slate-800">#12345</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Status:</span>
                <span className="font-semibold text-emerald-600">Out for Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Estimated Delivery:</span>
                <span className="font-semibold text-slate-800">Apr 29, 2025</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Tracking:</span>
                <span className="font-mono text-[10px] font-medium text-blue-600 truncate max-w-[120px]">
                  1Z999AA1234567890
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full mt-3 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Full Details</span>
            </button>
          </div>

          {/* Related FAQs */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Related FAQs</span>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  q: "Shipping Policy",
                  a: "Standard shipping takes 3-5 business days. Real-time UPS tracking is generated as soon as the item leaves our warehouse."
                },
                {
                  q: "Return Policy",
                  a: "We offer a 30-day money-back guarantee on all products in original packaging."
                },
                {
                  q: "Track My Order",
                  a: "Enter your 5-digit order number and email address to instantly view carrier telemetry."
                }
              ].map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === faq.q ? null : faq.q)}
                    className="w-full p-2 text-left text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {faq.q}
                    </span>
                    <span className="text-[10px] text-slate-400">{activeFaq === faq.q ? "−" : "+"}</span>
                  </button>
                  {activeFaq === faq.q && (
                    <div className="p-2.5 bg-blue-50/50 text-[11px] text-slate-600 border-t border-slate-200 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Tracking Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">UPS Live Tracking #1Z999AA1234567890</h4>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800">
                <div className="font-bold">Estimated Delivery: Tomorrow, Apr 29 by 7:00 PM</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Package is with local courier for final dispatch</div>
              </div>

              <div className="space-y-3 pl-2 border-l-2 border-blue-500">
                <div className="relative pl-3">
                  <span className="absolute -left-[19px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                  <div className="font-semibold text-slate-800">Out for Delivery</div>
                  <div className="text-[10px] text-slate-400">San Francisco Hub · Today 6:45 AM</div>
                </div>
                <div className="relative pl-3">
                  <span className="absolute -left-[19px] top-0.5 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-white"></span>
                  <div className="font-semibold text-slate-800">Arrived at Sort Facility</div>
                  <div className="text-[10px] text-slate-400">Oakland Depot · Yesterday 9:20 PM</div>
                </div>
                <div className="relative pl-3">
                  <span className="absolute -left-[19px] top-0.5 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></span>
                  <div className="font-semibold text-slate-800">Shipped from Warehouse</div>
                  <div className="text-[10px] text-slate-400">Fremont Logistics · Apr 27, 2:15 PM</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Close Tracking Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
