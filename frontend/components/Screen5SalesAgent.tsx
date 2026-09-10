"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Check,
  Star,
  Zap,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { productsList, Product } from "@/lib/data";

interface Screen5SalesAgentProps {
  onAddToCart?: (product: Product) => void;
  isCompact?: boolean;
}

export default function Screen5SalesAgent({ onAddToCart, isCompact = false }: Screen5SalesAgentProps) {
  const [messages, setMessages] = useState([
    {
      id: "sl-1",
      sender: "customer",
      content: "I'm looking for a laptop for work and casual use.",
      time: "10:10 AM"
    },
    {
      id: "sl-2",
      sender: "agent",
      content: "Great! I can help you find the perfect laptop. What's your budget range and what features are most important to you (e.g., performance, battery life, portability)?",
      time: "10:11 AM"
    },
    {
      id: "sl-3",
      sender: "customer",
      content: "My budget is around $800 and I need good battery life.",
      time: "10:14 AM"
    },
    {
      id: "sl-4",
      sender: "agent",
      content: "Here are a few options that fit your needs:\n\n1. MacBook Air M1 — $799\n   • Up to 18 hours battery\n   • Lightweight & powerful\n\n2. Dell Inspiron 15 — $749\n   • 10 hours battery\n   • Great value for money\n\nWould you like me to add any of these to your cart or book a quick call to discuss more options?",
      time: "10:15 AM"
    }
  ]);

  const [input, setInput] = useState("");
  const [addedIds, setAddedIds] = useState<{ [id: string]: boolean }>({});

  const handleAdd = (prod: Product) => {
    setAddedIds((prev) => ({ ...prev, [prod.id]: true }));
    if (onAddToCart) onAddToCart(prod);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: "customer",
      content: userText,
      time: "Just now"
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      let reply = "Both models include a 1-year manufacturer warranty and 30-day money-back guarantee. We can also provide 0% APR financing over 12 months.";
      const lower = userText.toLowerCase();
      if (lower.includes("macbook") || lower.includes("apple") || lower.includes("m1")) {
        reply = "The MacBook Air M1 is our top recommendation for creators and remote workers. Its silent fanless design and Retina display make it an outstanding value at $799.";
      } else if (lower.includes("dell") || lower.includes("windows") || lower.includes("inspiron")) {
        reply = "The Dell Inspiron 15 includes full port expansion (HDMI, SD card, USB-A) and a numpad keyboard, ideal for spreadsheets and finance workflows at $749.";
      } else if (lower.includes("cart") || lower.includes("buy")) {
        reply = "I've added your chosen model to your shopping cart! You can review items in the top right cart icon anytime.";
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
      <div className="p-3.5 bg-[#07242E] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10C8C8] text-[#071B3A] flex items-center justify-center font-bold shadow-md">
            <TrendingUp className="w-4 h-4 text-[#071B3A]" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 text-white">
              Sales Agent
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-teal-200">
              Product Discovery, Comparison & Upsell Automation
            </p>
          </div>
        </div>

        <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-300" />
          Catalog Connected
        </span>
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Left Chat Window */}
        <div className="md:col-span-7 p-4 flex flex-col justify-between border-r border-slate-200 bg-slate-50/50">
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {messages.map((m) => {
              const isCust = m.sender === "customer";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    isCust ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isCust ? "bg-blue-600 text-white" : "bg-[#10C8C8] text-[#071B3A]"
                    }`}
                  >
                    {isCust ? "U" : <TrendingUp className="w-3.5 h-3.5" />}
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
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Chat Composer */}
          <form onSubmit={handleSend} className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask sales agent (e.g. 'Does the Dell have 16GB RAM?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-[#10C8C8] hover:bg-teal-600 text-[#071B3A] hover:text-white transition-all cursor-pointer font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Product Recommendation Cards */}
        <div className="md:col-span-5 p-4 bg-white flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-600" />
                Recommended Products
              </h4>
              <span className="text-[10px] text-slate-400">Live inventory</span>
            </div>

            <div className="space-y-3">
              {productsList.slice(0, 2).map((prod) => {
                const isAdded = addedIds[prod.id];
                return (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500/50 hover:shadow-md transition-all bg-white group flex gap-3 items-center"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </h5>
                        <span className="text-xs font-bold text-blue-600">
                          ${prod.price}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {prod.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center text-[10px] text-amber-500 font-semibold gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{prod.rating}</span>
                        </div>

                        <button
                          onClick={() => handleAdd(prod)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isAdded
                              ? "bg-emerald-600 text-white"
                              : "bg-[#1677FF] hover:bg-blue-600 text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3 h-3" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-[11px] font-medium">Free shipping & 30-day returns included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
