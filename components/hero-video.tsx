"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroVideoProps = {
  className?: string;
};

const conversationSteps = [
  {
    role: "agent",
    text: "👋 Hi! I can help answer questions about Harlo.",
    time: "12:21 PM",
    delay: 250
  },
  {
    role: "visitor",
    text: "How does Harlo work?",
    time: "12:22 PM",
    delay: 900
  },
  {
    role: "agent",
    text: "Harlo answers questions instantly, captures qualified leads, and routes conversations to the right people, so you never miss an opportunity.",
    time: "12:22 PM",
    delay: 1650
  },
  {
    role: "visitor",
    text: "That sounds great! Can you set up a demo for our team?",
    time: "12:23 PM",
    delay: 2800
  },
  {
    role: "agent",
    text: "Absolutely! I can get that scheduled for you. What's the best email to send the details to?",
    time: "12:23 PM",
    delay: 3750
  },
  {
    role: "visitor",
    text: "alex@acme.com",
    time: "12:24 PM",
    delay: 4700
  }
] as const;

export function HeroVideo({ className }: HeroVideoProps) {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showLead, setShowLead] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleMessages(conversationSteps.length);
      setShowLead(true);
      setIsComplete(true);
      return;
    }

    const timers = [
      ...conversationSteps.map((step, index) => window.setTimeout(() => setVisibleMessages(index + 1), step.delay)),
      window.setTimeout(() => setShowLead(true), 5250),
      window.setTimeout(() => setIsComplete(true), 6400)
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const activeTyping = visibleMessages < conversationSteps.length && !isComplete;

  return (
    <div
      className={cn(
        "relative isolate overflow-visible",
        className
      )}
    >
      <div className="absolute -left-8 top-16 h-32 w-32 rounded-full bg-harlo-blue/20 blur-3xl" />
      <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-harlo-teal/25 blur-3xl" />

      <div className="relative h-[720px] sm:h-[650px]">
        <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_38px_120px_rgba(0,0,0,0.42)]">
          <div className="flex items-center justify-between bg-gradient-to-b from-[#118ca3] from-0% via-[#087f95] via-38% to-[#087f95] px-4 py-2.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/[0.14] text-white">
                <Sparkles size={17} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Harlo AI Agent</p>
              </div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.16] text-white/90">
              <span className="h-0.5 w-3.5 rounded-full bg-current" />
            </span>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#fbfdff] to-white">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-4 py-2.5 sm:px-5">
              {conversationSteps.slice(0, visibleMessages).map((message, index) => (
                <ConversationBubble key={`${message.role}-${index}`} message={message} index={index} />
              ))}

              {activeTyping ? (
                <div className="harlo-bubble-enter w-fit rounded-2xl rounded-tl-md bg-[#F4F4F5] px-3.5 py-2.5 text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="harlo-typing-dot h-1.5 w-1.5 rounded-full bg-harlo-teal/50" />
                    <span className="harlo-typing-dot h-1.5 w-1.5 rounded-full bg-harlo-teal/50 [animation-delay:120ms]" />
                    <span className="harlo-typing-dot h-1.5 w-1.5 rounded-full bg-harlo-teal/50 [animation-delay:240ms]" />
                  </div>
                </div>
              ) : null}

              {showLead ? <LeadCapturedCard /> : null}

            </div>

            <div className="bg-white px-4 pb-3 pt-1 sm:px-5">
              <div className="flex h-12 items-center rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                <span className="flex-1 text-base font-normal text-slate-500">
                  Ask a question...
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-harlo-teal text-white mr-0.5">
                  <ArrowUp size={16} strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes harloBubbleIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes harloTyping {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.42;
          }
          40% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        .harlo-bubble-enter {
          animation: harloBubbleIn 420ms ease-out both;
        }

        .harlo-typing-dot {
          animation: harloTyping 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function LeadCapturedCard() {
  return (
    <div className="harlo-bubble-enter max-w-[86%]">
      <div className="rounded-2xl bg-cyan-50/90 px-4 py-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-harlo-teal text-white">
            <Check size={16} strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-harlo-teal">Lead captured</p>
            <p className="mt-1 text-xs font-medium leading-4 text-slate-600">
              Thanks! I've sent the demo details to <span className="font-bold text-harlo-teal">alex@acme.com</span>.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-1 px-1 text-[10px] font-semibold text-slate-400">12:24 PM</p>
    </div>
  );
}

function ConversationBubble({
  message,
  index
}: {
  message: (typeof conversationSteps)[number];
  index: number;
}) {
  const isVisitor = message.role === "visitor";

  return (
    <div
      className={cn(
        "harlo-bubble-enter",
        isVisitor ? "flex justify-end" : "flex justify-start"
      )}
      style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
    >
      <div className="max-w-[78%] text-left">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[12px] font-semibold leading-[1.42] shadow-none sm:text-[13px]",
            isVisitor
              ? "rounded-tr-md bg-harlo-teal text-white"
              : "rounded-tl-md bg-[#F4F4F5] text-slate-800"
          )}
        >
          {message.text}
        </div>
        <p className="mt-0.5 px-1 text-[10px] font-semibold text-slate-400">{message.time}</p>
      </div>
    </div>
  );
}
