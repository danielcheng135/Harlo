"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { getSignupHref } from "@/lib/onboarding/signup-url";

type IndustryCard = {
  label: string;
  imageSrc: string;
  widgetAccent: string;
  statusTone?: "light" | "dark";
};

const industryCards: IndustryCard[] = [
  {
    label: "Plumbers",
    imageSrc: "/landing/meta-carousel/plumbing.png",
    widgetAccent: "#ff6b1a"
  },
  {
    label: "HVAC",
    imageSrc: "/landing/meta-carousel/hvac.png",
    widgetAccent: "#d71920"
  },
  {
    label: "House Cleaners",
    imageSrc: "/landing/meta-carousel/cleaning.png",
    widgetAccent: "#6f7f5f",
    statusTone: "dark"
  },
  {
    label: "Electricians",
    imageSrc: "/landing/meta-carousel/electrical.png",
    widgetAccent: "#f4c400"
  },
  {
    label: "Roofers",
    imageSrc: "/landing/meta-carousel/roofing.png",
    widgetAccent: "#7d1420"
  },
  {
    label: "Pest Control",
    imageSrc: "/landing/meta-carousel/pest-control.png",
    widgetAccent: "#c6a13a"
  },
  {
    label: "Dentists",
    imageSrc: "/landing/meta-carousel/dental.png",
    widgetAccent: "#16273E",
    statusTone: "dark"
  },
  {
    label: "Law Firms",
    imageSrc: "/landing/meta-carousel/legal.png",
    widgetAccent: "#7a1021"
  },
  {
    label: "Restaurants",
    imageSrc: "/landing/meta-carousel/restaurant.png",
    widgetAccent: "#c4552e"
  },
  {
    label: "Gyms",
    imageSrc: "/landing/meta-carousel/gym.png",
    widgetAccent: "#ff4b00"
  }
];

const heroFooterLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie policy", href: "/cookie-policy" }
];

const embedTabs = ["Leads", "Support", "Integrations"] as const;
const embedTabImages: Record<(typeof embedTabs)[number], string> = {
  Leads: "/landing/meta-agent-leads.png",
  Support: "/landing/meta-agent-support.png",
  Integrations: "/landing/meta-agent-embed.png"
};

const heroIntegrations = [
  { name: "Calendly", src: "/integrations/calendly.png", orbit: "outer", angle: -82 },
  { name: "Cal.com", src: "/integrations/calcom.png", orbit: "outer", angle: -34 },
  { name: "Jobber", src: "/integrations/jobber.png", orbit: "outer", angle: 28 },
  { name: "Slack", src: "/integrations/slack.svg", orbit: "inner", angle: 92 },
  { name: "HubSpot", src: "/integrations/hubspot.png", orbit: "outer", angle: 154 },
  { name: "Mailchimp", src: "/integrations/mailchimp.png", orbit: "outer", angle: -148 },
  { name: "Google Sheets", src: "/integrations/google-sheets.svg", orbit: "inner", angle: -142 }
] as const;

export function MetaAdsLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const leadCtaRef = useRef<HTMLElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeEmbedTab, setActiveEmbedTab] = useState<(typeof embedTabs)[number]>("Leads");
  const [isLeadCtaVisible, setIsLeadCtaVisible] = useState(false);
  const activeEmbedTabIndex = embedTabs.indexOf(activeEmbedTab);
  const accountHref = isAuthenticated ? "/dashboard" : "/auth/sign-in";
  const accountLabel = isAuthenticated ? "Dashboard" : "Sign in";
  const signupHref = getSignupHref();
  const updateCarouselControls = useCallback(() => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    setCanScrollPrevious(carousel.scrollLeft > 1);
    setCanScrollNext(carousel.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;

    updateCarouselControls();

    if (!carousel) {
      return;
    }

    carousel.addEventListener("scroll", updateCarouselControls, { passive: true });
    window.addEventListener("resize", updateCarouselControls);
    const initialMeasurement = window.setTimeout(updateCarouselControls, 250);

    return () => {
      carousel.removeEventListener("scroll", updateCarouselControls);
      window.removeEventListener("resize", updateCarouselControls);
      window.clearTimeout(initialMeasurement);
    };
  }, [updateCarouselControls]);

  useEffect(() => {
    const section = leadCtaRef.current;

    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || isLeadCtaVisible) {
          return;
        }

        setIsLeadCtaVisible(true);
      },
      { threshold: 0.45 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [isLeadCtaVisible]);

  const scrollIndustries = (direction: "previous" | "next") => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollBy({
      left: direction === "next" ? 274 : -274,
      behavior: "smooth"
    });
    window.setTimeout(updateCarouselControls, 350);
  };

  return (
    <main className="min-h-screen bg-white text-[#031020]">
      <style>
        {`
          @media (max-width: 639px) {
            .meta-industry-track {
              animation: meta-mobile-carousel 62s linear infinite;
            }
          }

          @supports (animation-timeline: scroll()) {
            .meta-hero-legal-links {
              animation: meta-hero-legal-fade linear both;
              animation-timeline: scroll(root block);
              animation-range: 0 220px;
            }
          }

          @keyframes meta-hero-legal-fade {
            from {
              opacity: 1;
            }

            to {
              opacity: 0;
            }
          }

          @keyframes meta-mobile-carousel {
            from {
              transform: translate3d(0, 0, 0);
            }

            to {
              transform: translate3d(calc(-50% - 10px), 0, 0);
            }
          }

          .meta-hero-integration-stage {
            animation: meta-hero-integration-stage 12s ease-in-out infinite;
          }

          .meta-hero-orbit-ring {
            animation: meta-hero-orbit-spin 18s linear infinite;
          }

          .meta-hero-orbit-ring:nth-child(3) {
            animation-duration: 14s;
            animation-direction: reverse;
          }

          .meta-hero-integration-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.82);
            animation: meta-hero-integration-icon 12s ease-in-out infinite both;
          }

          .meta-hero-chat-sequence {
            animation: meta-hero-chat-sequence 12s ease-in-out infinite;
          }

          .meta-hero-chat-card {
            animation: meta-hero-chat-float 5.8s ease-in-out infinite;
          }

          .meta-hero-progress-fill {
            animation: meta-hero-progress 12s ease-in-out infinite;
          }

          .meta-hero-chat-reply {
            animation: meta-hero-reply 12s ease-in-out infinite;
          }

          .meta-hero-solved-card {
            animation: meta-hero-solved-card 12s ease-in-out infinite;
          }

          @keyframes meta-hero-integration-stage {
            0%, 23% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }

            31%, 100% {
              opacity: 0;
              transform: translate3d(0, -8px, 0) scale(0.94);
            }
          }

          @keyframes meta-hero-orbit-spin {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }

            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }

          @keyframes meta-hero-integration-icon {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.82);
            }

            5%, 23% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }

            31%, 100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.82);
            }
          }

          @keyframes meta-hero-chat-sequence {
            0%, 32% {
              opacity: 0;
              filter: grayscale(0) opacity(1);
              transform: translate(-50%, -50%) translate3d(0, 18px, 0) scale(0.9);
            }

            39%, 75% {
              opacity: 1;
              filter: grayscale(0) opacity(1);
              transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
            }

            83%, 100% {
              opacity: 0.34;
              filter: grayscale(1) opacity(0.72);
              transform: translate(-50%, -50%) translate3d(54px, 18px, 0) scale(0.72);
            }
          }

          @keyframes meta-hero-chat-float {
            0%, 100% {
              transform: translate3d(0, 0, 0);
            }

            50% {
              transform: translate3d(0, -10px, 0);
            }
          }

          @keyframes meta-hero-progress {
            0%, 42% {
              width: 18%;
            }

            58% {
              width: 68%;
            }

            74%, 100% {
              width: 94%;
            }
          }

          @keyframes meta-hero-reply {
            0%, 54% {
              opacity: 0;
              transform: translate3d(0, 10px, 0);
            }

            66%, 100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes meta-hero-solved-card {
            0%, 75% {
              opacity: 0;
              transform: translate3d(-18px, 22px, 0) scale(0.92);
            }

            84%, 96% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }

            100% {
              opacity: 0;
              transform: translate3d(8px, -8px, 0) scale(0.96);
            }
          }

          .meta-lead-cta-title {
            opacity: 0;
            clip-path: inset(0 100% 0 0);
            transform: translate3d(-40px, 0, 0);
            transition:
              opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1),
              clip-path 1600ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 1600ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .meta-lead-cta-title[data-visible="true"] {
            opacity: 1;
            clip-path: inset(0 0 0 0);
            transform: translate3d(0, 0, 0);
          }

          @media (prefers-reduced-motion: reduce) {
            .meta-hero-integration-stage,
            .meta-hero-orbit-ring,
            .meta-hero-integration-icon,
            .meta-hero-chat-sequence,
            .meta-hero-chat-card,
            .meta-hero-progress-fill,
            .meta-hero-chat-reply,
            .meta-hero-solved-card {
              animation: none;
            }

            .meta-hero-integration-stage {
              opacity: 0;
              transform: none;
            }

            .meta-hero-integration-icon {
              opacity: 0;
              transform: translate(-50%, -50%) scale(1);
            }

            .meta-hero-chat-sequence {
              opacity: 1;
              filter: none;
              transform: translate(-50%, -50%);
            }

            .meta-hero-chat-reply,
            .meta-hero-solved-card {
              opacity: 1;
              filter: none;
              transform: none;
            }

            .meta-lead-cta-title {
              opacity: 1;
              animation: none;
              clip-path: none;
              transform: none;
            }
          }

        `}
      </style>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[54px] max-w-[940px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-7 lg:px-9">
          <Link
            href="/"
            aria-label="Harlo home"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[#031020] transition hover:bg-slate-100 hover:text-[#031020]"
          >
            <img src="/icon.png" alt="" className="h-5 w-5 rounded-[4px]" />
            <span className="text-xl font-bold tracking-[-0.03em]">Harlo</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href="/docs"
              className="inline-flex h-8 items-center justify-center rounded-md px-2.5 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-500 sm:px-3"
            >
              Docs
            </Link>
            <Link href={accountHref as Route} className="inline-flex h-8 items-center justify-center rounded-md px-2.5 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-500 sm:px-3">
              {accountLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative bg-white px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div className="relative mx-auto mb-4 flex min-h-[calc(100svh-158px)] overflow-hidden rounded-[22px] bg-harlo-blue px-5 py-12 text-white sm:mb-6 sm:min-h-[calc(100svh-174px)] sm:rounded-[24px] sm:px-10 sm:py-16 lg:mb-8 lg:px-16 xl:px-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_33%,rgba(255,255,255,0.14),transparent_23%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
          <div className="relative z-10 grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] lg:gap-10">
            <div className="max-w-[860px] text-left">
              <h1 className="max-w-[820px] text-[clamp(2.75rem,12vw,4.35rem)] font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-[clamp(4.9rem,7vw,7.6rem)] sm:tracking-[-0.06em] lg:text-[clamp(5.15rem,6.25vw,8rem)]">
                <span className="block">
                  <span className="inline-block rounded-[13px] bg-white px-[0.12em] pb-[0.04em] text-harlo-blue sm:rounded-[16px]">AI agents</span>{" "}
                  for
                </span>
                <span className="block">websites that</span>
                <span className="inline-block rounded-[13px] bg-white px-[0.12em] pb-[0.05em] text-harlo-blue sm:rounded-[16px]">
                  capture leads.
                </span>
              </h1>
              <p className="mt-8 max-w-[700px] text-xl font-normal leading-8 text-white/92 sm:text-2xl sm:leading-9">
                Harlo answers questions, captures contact details, and books jobs automatically from your website.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-white/88 sm:text-base">
                {["14 day free trial", "Cancel anytime"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-11 w-full max-w-none sm:max-w-[280px]">
                <Link
                  href={signupHref}
                  className="inline-flex h-[68px] w-full items-center justify-center rounded-[16px] bg-white px-3 text-base font-bold text-harlo-blue shadow-[0_5px_0_rgba(6,99,117,0.55)] transition hover:-translate-y-0.5 hover:bg-white hover:text-harlo-blue hover:shadow-[0_5px_0_rgba(6,99,117,0.55)]"
                >
                  Start free trial
                </Link>
              </div>
            </div>
            <HeroChatbotAnimation />
          </div>
        </div>
        <div className="-mx-4 hidden border-t border-slate-200 bg-white/85 px-4 backdrop-blur-sm sm:-mx-6 sm:block lg:-mx-8">
          <nav
            aria-label="Legal links"
            className="meta-hero-legal-links mx-auto flex min-h-12 w-fit flex-wrap items-center justify-center gap-1.5"
          >
            {heroFooterLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-500"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="industries-heading" className="overflow-hidden bg-white px-0 pb-16 pt-9 sm:pb-[88px] sm:pt-10 lg:pb-[88px] lg:pt-10">
        <div className="mx-auto max-w-[1280px] px-5 text-center sm:px-8 lg:px-10">
          <h2 id="industries-heading" className="text-[clamp(1.85rem,3vw,2.85rem)] font-black leading-none tracking-normal text-[#222222]">
            Built for every website.
          </h2>
        </div>

        <div ref={carouselRef} className="mt-8 overflow-hidden px-4 pb-8 pt-3 touch-pan-y sm:mt-10 sm:overflow-x-auto sm:px-5 lg:mt-12 lg:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="meta-industry-track flex w-max gap-5 sm:translate-x-0 sm:animate-none">
            {industryCards.map((card) => (
              <IndustryCarouselCard key={card.label} card={card} signupHref={signupHref} />
            ))}
            <div aria-hidden="true" className="flex gap-5 sm:hidden">
              {industryCards.map((card) => (
                <IndustryCarouselCard key={`${card.label}-duplicate`} card={card} signupHref={signupHref} />
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-8 flex max-w-[1280px] items-center justify-center px-5 sm:mt-10 sm:px-8 lg:mt-12 lg:px-10">
          <Link
            href={signupHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-[16px] bg-harlo-blue px-8 text-sm font-extrabold text-white shadow-[0_5px_0_#066375] transition hover:-translate-y-0.5 hover:bg-harlo-blue sm:max-w-[360px]"
          >
            Start free trial
          </Link>
          <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 items-center gap-3 sm:flex lg:right-10">
            <button
              type="button"
              aria-label="Show previous businesses"
              disabled={!canScrollPrevious}
              onClick={() => scrollIndustries("previous")}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${canScrollPrevious
                ? "bg-[#eeeeee] text-[#222222] hover:bg-[#e5e5e5]"
                : "cursor-default bg-[#f5f5f5] text-[#d3d3d3]"
                }`}
            >
              <ChevronLeft size={21} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Show next businesses"
              disabled={!canScrollNext}
              onClick={() => scrollIndustries("next")}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${canScrollNext
                ? "bg-[#eeeeee] text-[#222222] hover:bg-[#e5e5e5]"
                : "cursor-default bg-[#f5f5f5] text-[#d3d3d3]"
                }`}
            >
              <ChevronRight size={21} strokeWidth={2.2} />
            </button>
          </div>
        </div>

      </section>

      <section aria-labelledby="embed-agent-heading" className="border-t border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-[1180px] text-center">
          <h2 id="embed-agent-heading" className="text-[clamp(1.85rem,3vw,2.85rem)] font-black leading-none tracking-normal text-[#222222]">
            Embed an AI Agent
          </h2>
          <p className="mx-auto mt-4 max-w-[660px] text-sm leading-6 text-[#666666] sm:text-base sm:leading-7">
            Add Harlo to your website to answer questions instantly, capture leads, and book more jobs automatically.
          </p>

          <div className="relative mx-auto mt-7 grid w-full max-w-[300px] grid-cols-3 overflow-hidden rounded-full bg-[#eeeeee] p-1 sm:mt-8 sm:max-w-[360px]">
            <span
              aria-hidden="true"
              className="absolute left-1 top-1 h-[calc(100%-8px)] w-[calc((100%-8px)/3)] rounded-full border border-[#202124] bg-white shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${activeEmbedTabIndex * 100}%)` }}
            />
            {embedTabs.map((tab) => {
              const isActive = activeEmbedTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveEmbedTab(tab)}
                  className={`relative z-10 h-8 rounded-full text-sm font-bold transition-colors sm:h-9 sm:text-base ${isActive
                    ? "text-[#202124]"
                    : "text-[#777777] hover:text-[#202124]"
                    }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-10 max-w-[980px] sm:mt-12">
            <img
              src={embedTabImages[activeEmbedTab]}
              alt="Summit Roofing website with Harlo AI Agent embedded"
              className="w-full"
            />
          </div>

          <Link
            href={signupHref}
            className="mx-auto mt-12 inline-flex h-12 w-full items-center justify-center rounded-[16px] bg-harlo-blue px-8 text-sm font-extrabold text-white shadow-[0_5px_0_#066375] transition hover:-translate-y-0.5 hover:bg-harlo-blue sm:mt-16 sm:max-w-[360px]"
          >
            Start free trial
          </Link>
        </div>
      </section>

      <section ref={leadCtaRef} aria-labelledby="never-miss-lead-heading" className="flex min-h-[520px] items-center justify-center bg-harlo-blue px-5 py-24 text-center text-white sm:min-h-[620px] sm:px-8 sm:py-32 lg:min-h-[680px] lg:px-10">
        <div className="mx-auto w-full max-w-[1120px]">
          <h2 id="never-miss-lead-heading" data-visible={isLeadCtaVisible} className="meta-lead-cta-title text-[3.15rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-[clamp(3.15rem,7.2vw,6.7rem)] sm:leading-none">
            <span className="block sm:inline">Never miss</span>
            <span className="block sm:inline"> another lead.</span>
          </h2>
          <Link
            href={signupHref}
            className="mx-auto mt-10 flex h-16 w-full items-center justify-center rounded-[16px] bg-white px-8 text-base font-bold text-[#111827] shadow-[0_5px_0_rgba(6,99,117,0.55)] transition hover:-translate-y-0.5 hover:text-[#111827] sm:mt-14 sm:max-w-[360px]"
          >
            Start free trial
          </Link>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </main>
  );
}

function HeroChatbotAnimation() {
  return (
    <div className="relative mx-auto h-[322px] w-full max-w-[350px] overflow-visible sm:h-[426px] sm:max-w-[460px] lg:h-[520px] lg:max-w-[560px]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[560px] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.58] sm:scale-[0.82] lg:scale-100">
        <HeroIntegrationsOrbit />

        <div className="meta-hero-chat-sequence absolute left-1/2 top-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 -translate-y-1/2">
          <div className="meta-hero-chat-card overflow-hidden rounded-[30px] border border-white/28 bg-white text-[#111827] shadow-[0_34px_90px_rgba(3,16,32,0.22)]">
            <div className="flex min-h-16 items-center justify-between bg-gradient-to-b from-[#12a7c0] to-[#087f95] px-5 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/18 ring-1 ring-white/25">
                  <img src="/icon.png" alt="" className="h-5 w-5 rounded-[4px]" />
                </span>
                <span className="truncate text-base font-bold">Harlo AI Agent</span>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.75)]" />
            </div>

            <div className="space-y-4 bg-white px-5 py-5">
              <div className="max-w-[82%] rounded-[17px] rounded-tl-md bg-[#f4f4f5] px-4 py-3 text-sm font-semibold leading-5 text-[#111827]">
                Hi, I can answer questions and book the right next step.
              </div>
              <div className="ml-auto max-w-[78%] rounded-[17px] rounded-tr-md bg-gradient-to-br from-[#12a7c0] to-[#087f95] px-4 py-3 text-sm font-semibold leading-5 text-white">
                I need emergency service today.
              </div>

              <div className="rounded-[20px] border border-[#e2e8ee] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-black leading-none text-[#111827]">Capturing lead...</p>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-harlo-mist text-harlo-blue">
                    <Sparkles size={17} strokeWidth={2.4} />
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="meta-hero-progress-fill h-full rounded-full bg-harlo-blue" />
                </div>
              </div>

              <div className="meta-hero-chat-reply rounded-[20px] border border-harlo-blue/20 bg-harlo-blue/5 p-4">
                <p className="text-sm font-black text-[#111827]">Lead captured</p>
                <p className="mt-1 text-sm font-medium leading-5 text-[#526174]">Name, phone, service need, and conversation context sent to your team.</p>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[14px] border border-harlo-blue/20 bg-white px-3 py-2">
                  <span className="text-xs font-bold text-[#5f6876]">Ready for follow-up</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-harlo-blue text-white">
                    <ArrowUp size={15} strokeWidth={2.5} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="meta-hero-solved-card absolute left-[8%] top-[38%] z-30 w-[260px] rounded-[24px] border border-white/35 bg-white px-5 py-5 text-[#111827] shadow-[0_28px_70px_rgba(3,16,32,0.22)]">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-harlo-blue text-white">
              <CheckCircle2 size={23} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-2xl font-black leading-none tracking-[-0.04em] text-[#111827]">Solved in</p>
              <p className="mt-1 text-2xl font-black leading-none tracking-[-0.04em] text-harlo-blue">3 seconds</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold leading-5 text-[#5f6876]">Question answered, lead routed, and next step queued.</p>
        </div>
      </div>
    </div>
  );
}

function HeroIntegrationsOrbit() {
  return (
    <div className="meta-hero-integration-stage absolute inset-0 z-10" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/24" />
      <div className="meta-hero-orbit-ring absolute left-1/2 top-1/2 h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18 border-r-white/55" />
      <div className="meta-hero-orbit-ring absolute left-1/2 top-1/2 h-[238px] w-[238px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 border-l-white/50" />
      <div className="absolute left-1/2 top-1/2 z-20 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-harlo-blue shadow-[0_24px_60px_rgba(3,16,32,0.18)]">
        <img src="/icon.png" alt="" className="h-11 w-11 rounded-[10px]" />
      </div>

      {heroIntegrations.map((integration, index) => {
        const radius = integration.orbit === "outer" ? 205 : 119;
        const radians = (integration.angle * Math.PI) / 180;
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;

        return (
          <div
            key={integration.name}
            className="meta-hero-integration-icon absolute z-20 grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white shadow-[0_14px_30px_rgba(3,16,32,0.16)]"
            style={{
              left: `calc(50% + ${x.toFixed(1)}px)`,
              top: `calc(50% + ${y.toFixed(1)}px)`,
              animationDelay: `${index * 170}ms`
            }}
            title={integration.name}
          >
            <img src={integration.src} alt="" className="h-6 w-6 object-contain" />
          </div>
        );
      })}
    </div>
  );
}

function IndustryCarouselCard({ card, signupHref }: { card: IndustryCard; signupHref: Route }) {
  return (
    <article className="relative min-w-[219px] max-w-[219px] transition-transform duration-200 focus-within:z-10 sm:min-w-[237px] sm:max-w-[237px] sm:hover:z-10 lg:min-w-[250px] lg:max-w-[250px]">
      <p className="mb-4 text-center text-sm font-black leading-none text-[#222222] sm:text-base">{card.label}</p>
      <Link
        href={signupHref}
        aria-label={`Start with Harlo for ${card.label}`}
        className="group pointer-events-none relative block aspect-[941/1672] overflow-hidden rounded-[22px] border border-[#dedede] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition duration-200 focus-visible:scale-[1.035] focus-visible:shadow-[0_16px_36px_rgba(15,23,42,0.16)] sm:pointer-events-auto sm:hover:scale-[1.035] sm:hover:shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
      >
        <img src={card.imageSrc} alt={`${card.label} website mockup`} className="h-full w-full object-cover" />
        <IphoneStatusBar tone={card.statusTone ?? "light"} />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-black/55 to-black/90 opacity-0 transition-opacity duration-200 group-focus-visible:opacity-100 sm:group-hover:opacity-100" />
        <p className="pointer-events-none absolute inset-x-4 bottom-5 z-20 translate-y-1 text-center text-xs font-extrabold text-white opacity-0 transition duration-200 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          Click to start with Harlo
        </p>
        <HarloWidgetLauncher accent={card.widgetAccent} />
      </Link>
    </article>
  );
}

function HarloWidgetLauncher({ accent }: { accent: string }) {
  return (
    <div
      data-mock-harlo-widget
      className="absolute bottom-3 right-3 z-30 grid h-8 w-8 place-items-center rounded-full text-white sm:bottom-3.5 sm:right-3.5 sm:h-9 sm:w-9"
      style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 82%, #111827))` }}
      aria-label="Harlo chat widget preview"
    >
      <svg aria-hidden="true" className="h-[17px] w-[17px] sm:h-[19px] sm:w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.75 17.25 4 20l3.2-.86A8.5 8.5 0 1 0 3.5 12a8.46 8.46 0 0 0 1.25 5.25Z" />
        <path d="M8.5 12h.01" />
        <path d="M12 12h.01" />
        <path d="M15.5 12h.01" />
      </svg>
    </div>
  );
}

function IphoneStatusBar({ tone }: { tone: "light" | "dark" }) {
  const toneClass =
    tone === "dark"
      ? "bg-gradient-to-b from-white/35 via-white/10 to-transparent text-black [text-shadow:0_1px_1px_rgba(255,255,255,0.55)]"
      : "bg-gradient-to-b from-black/25 via-black/10 to-transparent text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]";

  return (
    <div
      data-iphone-status-bar
      className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-[18px] ${toneClass}`}
    >
      <span className="min-w-8 text-[11px] font-semibold leading-none tracking-normal">9:41</span>
      <div className="flex items-center gap-[5px]">
        <IphoneCellularIcon />
        <IphoneWifiIcon />
        <IphoneBatteryIcon />
      </div>
    </div>
  );
}

function IphoneCellularIcon() {
  return (
    <span aria-hidden="true" className="flex h-[11px] w-[14px] items-end gap-[1.5px]">
      <span className="h-[4px] w-[2px] rounded-[1px] bg-current" />
      <span className="h-[6px] w-[2px] rounded-[1px] bg-current" />
      <span className="h-[8px] w-[2px] rounded-[1px] bg-current" />
      <span className="h-[10px] w-[2px] rounded-[1px] bg-current" />
    </span>
  );
}

function IphoneWifiIcon() {
  return (
    <svg aria-hidden="true" className="h-[11px] w-[15px]" viewBox="0 0 18 13" fill="none">
      <path d="M1.4 4.1C5.7 0.7 12.3 0.7 16.6 4.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4.3 7C7 5 11 5 13.7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7.1 9.8C8.2 9.1 9.8 9.1 10.9 9.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="9" cy="11.2" r="1" fill="currentColor" />
    </svg>
  );
}

function IphoneBatteryIcon() {
  return (
    <span aria-hidden="true" className="relative h-[10px] w-[22px]">
      <span className="absolute inset-y-[1px] left-0 w-[19px] rounded-[3px] border border-current" />
      <span className="absolute left-[2px] top-[3px] h-[4px] w-[14px] rounded-[1.5px] bg-current" />
      <span className="absolute right-0 top-[4px] h-[3px] w-[2px] rounded-r-[1px] bg-current" />
    </span>
  );
}
