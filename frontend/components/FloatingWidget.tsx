"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChevronDown,
  ShoppingBag,
  Clock,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { streamMessageText } from "@/lib/chat-stream";
import { playMessageChime, isAudioMuted, setAudioMuted } from "@/lib/audio";
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speech";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  "Where is my order #12345?",
  "Recommend a fast laptop under $1,000",
  "What bulk discounts do you offer?",
  "Book a consultation for tomorrow"
];

export default function FloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(1);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Hello! 👋 Welcome to our live storefront. I can track orders, answer technical questions, recommend products, and book appointments. How can I help you today?",
      time: "Just now"
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMuted(isAudioMuted());
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      return;
    }

    const started = startSpeechRecognition({
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (started) {
      setIsListening(true);
    }
  };

  const handleSend = async (userPrompt?: string) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || isTyping) return;

    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const aiMsgId = `ai-${Date.now()}`;
    const placeholderAiMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, placeholderAiMsg]);
    setStreamingMessageId(aiMsgId);

    try {
      const res = await api.chatAI({
        message: textToSend,
        customerName: "Website Visitor"
      });

      const fullReply = res?.reply || "I'm here to assist! Could you please provide more details so I can find the best solution?";

      await streamMessageText(
        fullReply,
        (currentText: string) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: currentText } : m))
          );
        },
        { speedMs: 14 }
      );

      playMessageChime();
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: "I'm having trouble connecting to the catalog server. Please verify your connection or try again."
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  return (
    <aside aria-label="Live Customer Chat Widget" className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans select-none">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mb-3">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center ring-1 ring-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold leading-tight">Nexa Sales Copilot</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-blue-100">Live Website Visitor Experience</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors cursor-pointer"
                title={muted ? "Unmute sounds" : "Mute sounds"}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="bg-blue-50/80 px-4 py-1.5 border-b border-blue-100/70 flex items-center justify-between text-[11px] text-blue-900">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Autonomous Order Tracking & Sales
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded-sm">
              Live RAG
            </span>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFCFF] text-xs">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              const isStreaming = isAi && streamingMessageId === m.id;

              return (
                <div key={m.id} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}>
                    {isAi && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mb-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-[12px] leading-relaxed select-text shadow-2xs ${
                        isAi
                          ? "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs"
                          : "bg-blue-600 text-white rounded-br-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {m.text}
                        {isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-600 rounded-full animate-pulse align-middle" />
                        )}
                      </div>
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          isAi ? "text-slate-400" : "text-blue-200"
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && !streamingMessageId && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-8">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
                <span>Nexa is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-medium rounded-full shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
            >
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Speak to AI"}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening... speak now" : "Type your message..."}
                disabled={isTyping}
                className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 text-center text-[10px] text-slate-400">
              ⚡ Production Embed Preview · Fast RAG & Typewriter
            </div>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 cursor-pointer ring-2 ring-white/50"
      >
        <div className="relative">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 transition-transform" />
          ) : (
            <MessageSquare className="w-5 h-5 transition-transform" />
          )}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </div>
        <span>{isOpen ? "Close Widget" : "Test Live Chat Widget"}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>
    </aside>
  );
}
