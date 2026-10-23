import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  CalendarClock,
  ChevronRight,
  ExternalLink,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  MessageSquare,
  Minus,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CarPhoto } from "@/components/common/CarPhoto";
import { formatMileage, formatPrice, primaryImageUrl, toWhatsAppUrl } from "@/lib/format";
import type { Car } from "@/lib/api/types";
import { processUserMessage, INITIAL_SUGGESTIONS, type ActionLink } from "@/lib/chatbot-engine";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "simatei_chat_messages_v1";
const TEASER_SEEN_KEY = "simatei_chat_teaser_dismissed";
const HOTLINE_PHONE = "0740892332";

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  cars?: Car[];
  suggestions?: string[];
  actionLink?: ActionLink;
};

const INITIAL_BOT_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  sender: "bot",
  text: "Hello! Welcome to Simatei Motorworld 🚗\n\nI'm your virtual automotive concierge. I can search our live vehicle inventory, assist you with test drives, guide you through selling a car or NTSA logbook transfers, and connect you with our team.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  suggestions: INITIAL_SUGGESTIONS,
};

function formatMessageText(text: string) {
  // Simple markdown-style formatter for bold text and bullet points
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Process **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");

    return (
      <span key={idx} className={cn("block", isBullet && "pl-2", line.trim() === "" && "h-2")}>
        {formattedLine}
      </span>
    );
  });
}

function CarMiniCard({ car, onSelect }: { car: Car; onSelect?: () => void }) {
  const photo = primaryImageUrl(car.images);
  const title = `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="group rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex gap-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          <CarPhoto
            url={photo}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {car.condition ? (
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              {car.condition}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <h4 className="truncate text-xs font-bold text-foreground sm:text-sm group-hover:text-primary transition-colors">
              {title}
            </h4>
            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-extrabold text-primary">
                {formatPrice(car.price, car.currency)}
              </span>
              {car.is_negotiable ? (
                <span className="text-[10px] text-muted-foreground font-medium">(Negotiable)</span>
              ) : null}
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            {car.mileage ? (
              <span className="inline-flex items-center gap-0.5">
                <Gauge className="size-3 text-muted-foreground/70" />
                {formatMileage(car.mileage)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-0.5">
              <Fuel className="size-3 text-muted-foreground/70" />
              {car.fuel_type}
            </span>
            <span>•</span>
            <span>{car.transmission}</span>
            {car.location ? (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 truncate max-w-[80px]">
                  <MapPin className="size-2.5" />
                  {car.location}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-border/50 pt-2">
        <Link
          to="/cars/$carId"
          params={{ carId: String(car.id) }}
          onClick={onSelect}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <span>View Vehicle</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export function Chatbot() {
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [INITIAL_BOT_MESSAGE];
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
    return [INITIAL_BOT_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Teaser prompt after 2.5s on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(TEASER_SEEN_KEY);
    if (!dismissed && !isOpen) {
      const timer = setTimeout(() => {
        setShowTeaser(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowTeaser(false);
      setUnreadCount(0);
      try {
        sessionStorage.setItem(TEASER_SEEN_KEY, "true");
      } catch {
        // ignore
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSendMessage(textToSend?: string) {
    const rawText = textToSend ?? input;
    if (!rawText.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: rawText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Simulate realistic typing delay (450ms - 800ms)
      const [response] = await Promise.all([
        processUserMessage(userMessage.text, { pathname: currentPath }),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ]);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cars: response.cars,
        suggestions: response.suggestions,
        actionLink: response.actionLink,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Chatbot processing error:", err);
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "I ran into a temporary issue retrieving data. Please feel free to call our hotline at [+254 740 892 332](tel:+254740892332) or chat with our team directly on WhatsApp!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionLink: {
          label: "Chat with Admin on WhatsApp",
          url: toWhatsAppUrl(HOTLINE_PHONE, "Hi Simatei Admin, I have an inquiry."),
          external: true,
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleResetChat() {
    setMessages([INITIAL_BOT_MESSAGE]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function dismissTeaser(e: React.MouseEvent) {
    e.stopPropagation();
    setShowTeaser(false);
    try {
      sessionStorage.setItem(TEASER_SEEN_KEY, "true");
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Floating Teaser Balloon */}
      {showTeaser && !isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group mb-4 mr-0 sm:mr-1 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-primary/25 bg-card/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 animate-in fade-in slide-in-from-bottom-3"
          role="button"
          tabIndex={0}
          aria-label="Open chat assistant"
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <div className="pr-1 text-left">
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Looking for a car? 🚗
            </p>
            <p className="text-[11px] text-muted-foreground">Chat with our AI vehicle concierge</p>
          </div>
          <button
            type="button"
            onClick={dismissTeaser}
            aria-label="Dismiss message"
            className="rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Main Chat Window */}
      {isOpen ? (
        <div
          role="dialog"
          aria-label="Simatei Virtual Assistant"
          className="pointer-events-auto flex flex-col w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[85vh] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                <Bot className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold leading-tight text-foreground">
                    Simatei Assistant
                  </h3>
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-bold text-primary border-primary/30"
                  >
                    AI
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online • Cars &amp; Test Drives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={`tel:${HOTLINE_PHONE}`}
                title="Call Admin Hotline (+254 740 892 332)"
                aria-label="Call Admin Hotline"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                <Phone className="size-4" />
              </a>
              <a
                href={toWhatsAppUrl(
                  HOTLINE_PHONE,
                  "Hi Simatei Admin, I am using your website assistant and need support.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                aria-label="Chat on WhatsApp"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
              >
                <MessageCircle className="size-4" />
              </a>
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                aria-label="Reset conversation"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Minimize chat"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Minus className="size-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar for Car details pages */}
          {currentPath.startsWith("/cars/") && currentPath !== "/cars" ? (
            <div className="border-b border-border/50 bg-primary/5 px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate font-medium">
                Browsing vehicle details
              </span>
              <button
                type="button"
                onClick={() =>
                  void handleSendMessage(
                    "Can you tell me more about this vehicle and how to book a test drive?",
                  )
                }
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Ask about this car →
              </button>
            </div>
          ) : null}

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1.5 animate-in fade-in duration-200",
                    isUser ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {!isUser ? (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
                        <Bot className="size-4" />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs",
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-xs font-normal"
                          : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs",
                      )}
                    >
                      {formatMessageText(msg.text)}

                      {/* Action Link button */}
                      {msg.actionLink ? (
                        <div className="mt-3 pt-2 border-t border-border/40">
                          {msg.actionLink.external ? (
                            <a
                              href={msg.actionLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                            >
                              <span>{msg.actionLink.label}</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <Link
                              to={msg.actionLink.url}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                            >
                              <span>{msg.actionLink.label}</span>
                              <ChevronRight className="size-3" />
                            </Link>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Render Car Cards if any */}
                  {msg.cars && msg.cars.length > 0 ? (
                    <div className="w-full space-y-2 mt-1 pl-9">
                      {msg.cars.map((car) => (
                        <CarMiniCard key={car.id} car={car} onSelect={() => setIsOpen(false)} />
                      ))}
                    </div>
                  ) : null}

                  {/* Suggestions Pills beneath bot message */}
                  {msg.suggestions && msg.suggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 pl-9">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void handleSendMessage(suggestion)}
                          className="rounded-full border border-border/90 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <span className="text-[10px] text-muted-foreground/60 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping ? (
              <div className="flex items-end gap-2 animate-in fade-in duration-150">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-muted/70 px-4 py-3 border border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-primary/60 animate-bounce" />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-border bg-background/95 p-3 backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cars, test drives, selling..."
                disabled={isTyping}
                className="h-10 text-xs sm:text-sm bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="size-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-transform active:scale-95"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/75">
              Powered by Simatei Motorworld • Hotline: +254 740 892 332
            </p>
          </div>
        </div>
      ) : null}

      {/* Floating Launcher Button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Simatei chat assistant"
          className="pointer-events-auto group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/85 text-primary-foreground shadow-lift transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-primary/30 cursor-pointer"
        >
          {/* Subtle pulsating glow */}
          <span className="absolute -inset-0.5 rounded-full bg-primary/40 blur-xs animate-pulse opacity-75 group-hover:opacity-100" />

          {/* Online green indicator */}
          <span className="absolute top-1 right-1 flex size-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          </span>

          <div className="relative flex items-center justify-center">
            <MessageSquare className="size-6 transition-transform group-hover:scale-110" />
            <Sparkles className="absolute -top-1.5 -right-1.5 size-3.5 text-amber-300 animate-spin [animation-duration:8s]" />
          </div>

          {/* Unread badge */}
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground ring-2 ring-card">
              {unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
