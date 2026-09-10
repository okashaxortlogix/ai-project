"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CartDrawer from "@/components/CartDrawer";
import Screen1Auth from "@/components/Screen1Auth";
import Screen2Dashboard from "@/components/Screen2Dashboard";
import Screen3LiveChat from "@/components/Screen3LiveChat";
import Screen4SupportAgent from "@/components/Screen4SupportAgent";
import Screen5SalesAgent from "@/components/Screen5SalesAgent";
import Screen6AppointmentAgent from "@/components/Screen6AppointmentAgent";
import Screen7Leads from "@/components/Screen7Leads";
import Screen8Calendar from "@/components/Screen8Calendar";
import Screen9KnowledgeBase from "@/components/Screen9KnowledgeBase";
import Screen10Integrations from "@/components/Screen10Integrations";
import Screen11Analytics from "@/components/Screen11Analytics";
import Screen12Settings from "@/components/Screen12Settings";
import Screen13MobileView from "@/components/Screen13MobileView";
import { Product, productsList } from "@/lib/data";
import { Maximize2, ExternalLink } from "lucide-react";

export default function HomePage() {
  const [viewMode, setViewMode] = useState<"poster" | "workspace">("poster");
  const [activeScreen, setActiveScreen] = useState<number>(2);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([
    { product: productsList[0], quantity: 1 }
  ]);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleResetDemo = () => {
    setCartItems([{ product: productsList[0], quantity: 1 }]);
    setActiveScreen(2);
    alert("Demo state reset to initial baseline.");
  };

  const renderActiveScreenContent = () => {
    switch (activeScreen) {
      case 1:
        return <Screen1Auth onSuccess={() => setActiveScreen(2)} />;
      case 2:
        return <Screen2Dashboard onNavigate={(screen) => setActiveScreen(screen)} />;
      case 3:
        return <Screen3LiveChat onNavigate={(screen) => setActiveScreen(screen)} />;
      case 4:
        return <Screen4SupportAgent />;
      case 5:
        return <Screen5SalesAgent onAddToCart={handleAddToCart} />;
      case 6:
        return <Screen6AppointmentAgent />;
      case 7:
        return <Screen7Leads />;
      case 8:
        return <Screen8Calendar />;
      case 9:
        return <Screen9KnowledgeBase />;
      case 10:
        return <Screen10Integrations />;
      case 11:
        return <Screen11Analytics />;
      case 12:
        return <Screen12Settings />;
      case 13:
        return <Screen13MobileView />;
      default:
        return <Screen2Dashboard onNavigate={(screen) => setActiveScreen(screen)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#06152D] flex flex-col font-sans">
      {/* Top Universal Branding Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        cartCount={cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        resetDemo={handleResetDemo}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW MODE 1: WORKSPACE MODE (Sidebar + Single Active Screen) */}
        {viewMode === "workspace" ? (
          <div className="flex-1 flex overflow-hidden">
            <Sidebar
              activeScreen={activeScreen}
              setActiveScreen={setActiveScreen}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
            />

            <main className="flex-1 overflow-y-auto bg-[#F5F8FC] p-4 lg:p-6">
              <div className="max-w-[1600px] mx-auto">
                {renderActiveScreenContent()}
              </div>
            </main>
          </div>
        ) : (
          /* VIEW MODE 2: POSTER OVERVIEW MODE (All 13 screens side-by-side matching the reference image) */
          <main className="flex-1 overflow-y-auto bg-[#071733] p-4 lg:p-6">
            <div className="max-w-[1920px] mx-auto space-y-6">
              
              {/* Row 1: Screens 1, 2, 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Screen 1: Login / Sign Up */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">1. Login / Sign Up Page</span>
                    <button
                      onClick={() => {
                        setActiveScreen(1);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen1Auth onSuccess={() => setActiveScreen(2)} isCompact={true} />
                  </div>
                </div>

                {/* Screen 2: Main Dashboard */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">2. Main Dashboard</span>
                    <button
                      onClick={() => {
                        setActiveScreen(2);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen2Dashboard onNavigate={(s) => { setActiveScreen(s); setViewMode("workspace"); }} isCompact={true} />
                  </div>
                </div>

                {/* Screen 3: Conversation Interface (Live Chat) */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">3. Conversation Interface (Live Chat)</span>
                    <button
                      onClick={() => {
                        setActiveScreen(3);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen3LiveChat onNavigate={(s) => { setActiveScreen(s); setViewMode("workspace"); }} isCompact={true} />
                  </div>
                </div>
              </div>

              {/* Row 2: Screens 4, 5, 6 (The 3 Core Agents) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Screen 4: Customer Support Agent */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-blue-900/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      4. Customer Support Agent (Example)
                    </span>
                    <button
                      onClick={() => {
                        setActiveScreen(4);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen4SupportAgent isCompact={true} />
                  </div>
                </div>

                {/* Screen 5: Sales Agent */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-teal-900/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                      5. Sales Agent (Product Recommendation)
                    </span>
                    <button
                      onClick={() => {
                        setActiveScreen(5);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen5SalesAgent onAddToCart={handleAddToCart} isCompact={true} />
                  </div>
                </div>

                {/* Screen 6: Appointment Agent */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-purple-900/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      6. Appointment Agent (Calendar Booking)
                    </span>
                    <button
                      onClick={() => {
                        setActiveScreen(6);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen6AppointmentAgent isCompact={true} />
                  </div>
                </div>
              </div>

              {/* Row 3: Screens 7, 8, 9 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Screen 7: Leads Management */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">7. Admin - Leads Management</span>
                    <button
                      onClick={() => {
                        setActiveScreen(7);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen7Leads isCompact={true} />
                  </div>
                </div>

                {/* Screen 8: Calendar & Appointments */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">8. Calendar & Appointments</span>
                    <button
                      onClick={() => {
                        setActiveScreen(8);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen8Calendar isCompact={true} />
                  </div>
                </div>

                {/* Screen 9: Knowledge Base (RAG) */}
                <div className="lg:col-span-4 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">9. Knowledge Base (RAG)</span>
                    <button
                      onClick={() => {
                        setActiveScreen(9);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen9KnowledgeBase isCompact={true} />
                  </div>
                </div>
              </div>

              {/* Row 4: Screens 10, 11, 12, 13 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
                {/* Screen 10: Integrations */}
                <div className="lg:col-span-3 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">10. Integrations</span>
                    <button
                      onClick={() => {
                        setActiveScreen(10);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen10Integrations isCompact={true} />
                  </div>
                </div>

                {/* Screen 11: Analytics & Reports */}
                <div className="lg:col-span-3 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">11. Analytics & Reports</span>
                    <button
                      onClick={() => {
                        setActiveScreen(11);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen11Analytics isCompact={true} />
                  </div>
                </div>

                {/* Screen 12: Settings & User Management */}
                <div className="lg:col-span-3 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">12. Settings & Users</span>
                    <button
                      onClick={() => {
                        setActiveScreen(12);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen12Settings isCompact={true} />
                  </div>
                </div>

                {/* Screen 13: Mobile View */}
                <div className="lg:col-span-3 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden flex flex-col">
                  <div className="bg-[#0A1F44] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-xs">13. Mobile View (Responsive)</span>
                    <button
                      onClick={() => {
                        setActiveScreen(13);
                        setViewMode("workspace");
                      }}
                      className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximize</span>
                    </button>
                  </div>
                  <div className="p-2 flex-1 flex">
                    <Screen13MobileView isCompact={true} />
                  </div>
                </div>
              </div>

            </div>
          </main>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={handleRemoveFromCart}
        onClear={handleClearCart}
      />
    </div>
  );
}
