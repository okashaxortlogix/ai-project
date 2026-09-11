"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  CalendarCheck,
  Zap,
  CheckCircle2,
  Volume2,
  Radio,
  ArrowRight
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { playSuccessChime, playMessageChime } from "@/lib/audio";

interface DemoSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSimulated?: (event: { type: string; title: string; subtitle: string }) => void;
}

export default function DemoSimulatorModal({
  isOpen,
  onClose,
  onEventSimulated
}: DemoSimulatorModalProps) {
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const simulateOrder = () => {
    playSuccessChime();
    const event = {
      type: "order",
      title: "New Shopify Order #12348 ($249.00)",
      subtitle: "Synced via Webhook HMAC: Apple AirPods Max (Space Gray)"
    };
    onEventSimulated?.(event);
    setLastTriggered("Shopify Order #12348 simulated successfully!");
    setTimeout(() => setLastTriggered(null), 3000);
  };

  const simulateLead = () => {
    playMessageChime();
    const event = {
      type: "lead",
      title: "VIP WhatsApp Lead Captured",
      subtitle: "Dr. Marcus Vance (Clinic Director) qualified with AI score 94%"
    };
    onEventSimulated?.(event);
    setLastTriggered("VIP Lead captured and auto-scored!");
    setTimeout(() => setLastTriggered(null), 3000);
  };

  const simulateBooking = () => {
    playSuccessChime();
    const event = {
      type: "appointment",
      title: "Google Calendar Booking Confirmed",
      subtitle: "Enterprise Demo with Sarah Jenkins tomorrow at 2:30 PM"
    };
    onEventSimulated?.(event);
    setLastTriggered("Calendar booking synced to Google Calendar!");
    setTimeout(() => setLastTriggered(null), 3000);
  };

  const simulateCartRecovery = () => {
    playMessageChime();
    const event = {
      type: "cart",
      title: "AI Cart Recovery Triggered",
      subtitle: "Automated SMS promo dispatched for 2x MacBook Air ($1,598)"
    };
    onEventSimulated?.(event);
    setLastTriggered("Cart recovery SMS dispatched!");
    setTimeout(() => setLastTriggered(null), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Sales Demo & Webhook Simulator"
      subtitle="Trigger real-time events on demand to demonstrate system responsiveness to prospective clients"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">
            Triggers live audio chimes, notifications &amp; metric updates
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {lastTriggered && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastTriggered}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {/* Order Simulation */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-emerald-400 hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Simulate Inbound Shopify Order</h4>
                <p className="text-[11px] text-slate-500">
                  Fires webhook, increments orders metric, updates inventory balance.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={simulateOrder}>
              Simulate Order
            </Button>
          </div>

          {/* Lead Simulation */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-blue-400 hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Simulate Inbound VIP WhatsApp Lead</h4>
                <p className="text-[11px] text-slate-500">
                  Captures contact info, assigns 94% score, routes to Sales Agent.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={simulateLead}>
              Simulate Lead
            </Button>
          </div>

          {/* Booking Simulation */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-purple-400 hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Simulate Google Calendar Reservation</h4>
                <p className="text-[11px] text-slate-500">
                  Locks slot, creates event link, schedules 24h reminder.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={simulateBooking}>
              Simulate Booking
            </Button>
          </div>

          {/* Cart Recovery */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-amber-400 hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Simulate Abandoned Cart Recovery</h4>
                <p className="text-[11px] text-slate-500">
                  Sends conversational checkout link with 15% discount incentive.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={simulateCartRecovery}>
              Simulate Cart
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
