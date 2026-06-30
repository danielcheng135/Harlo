import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Sparkles,
  UsersRound
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[#031020]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[54px] max-w-[940px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-7 lg:px-9">
          <Link
            href="/"
            aria-label="Harlo home"
            className="inline-flex h-10 shrink-0 items-center rounded-lg px-2 transition hover:bg-slate-100"
          >
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href="/docs"
              className="inline-flex h-8 items-center justify-center rounded-md px-2.5 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:px-3"
            >
              Docs
            </Link>
            <Link
              href="/"
              className="inline-flex h-8 items-center justify-center rounded-md px-2.5 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:px-3"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pt-8">
        <div className="relative mx-auto flex min-h-[calc(100svh-86px)] overflow-hidden rounded-[22px] bg-harlo-blue px-5 py-8 text-white sm:min-h-[calc(100svh-102px)] sm:rounded-[24px] sm:px-10 sm:py-10 lg:min-h-[calc(100svh-119px)] lg:px-16 xl:px-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_33%,rgba(255,255,255,0.14),transparent_23%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
          <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.72fr)] lg:gap-12">
            <AuthShowcase />
            <section className="flex min-w-0 justify-center lg:justify-end">{children}</section>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthShowcase() {
  return (
    <aside className="min-w-0">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] text-harlo-blue">
        <Sparkles size={14} />
        Website AI agent
      </span>
      <h1 className="mt-6 max-w-[760px] text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl xl:text-7xl">
        Start turning visitors into{" "}
        <span className="inline-block rounded-[13px] bg-white px-[0.12em] pb-[0.04em] text-harlo-blue sm:rounded-[16px]">qualified leads.</span>
      </h1>
      <p className="mt-6 max-w-[640px] text-lg leading-7 text-white/92 sm:text-xl sm:leading-8">
        Sign in to manage Harlo, or create an account to launch a no-card trial in minutes.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-white/88 sm:text-base">
        {["14-day free trial", "50 trial credits", "Cancel anytime"].map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={18} strokeWidth={2.4} />
            {item}
          </span>
        ))}
      </div>

      <div className="mt-9 hidden max-w-[620px] overflow-hidden rounded-[22px] border border-white/35 bg-white shadow-[0_24px_80px_rgba(3,16,32,0.22)] md:block">
        <div className="flex h-11 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f6c453]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4fc98b]" />
          </div>
          <span className="text-xs font-semibold text-slate-400">dashboard.harloai.co</span>
        </div>
        <div className="grid gap-4 p-5 text-[#031020] sm:grid-cols-[0.9fr_1fr]">
          <div className="rounded-[18px] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-harlo-mist text-harlo-blue">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="text-sm font-black">Questions answered</p>
                <p className="text-xs text-slate-500">Without human help</p>
              </div>
            </div>
            <p className="mt-5 text-4xl font-black tracking-[-0.05em]">84%</p>
          </div>
          <div className="grid gap-3">
            <PreviewRow icon={MessageSquare} title="Conversation captured" body="Do you offer a free trial?" />
            <PreviewRow icon={UsersRound} title="Lead ready" body="Name, email, and context saved." />
            <div className="flex items-center justify-between rounded-[16px] bg-harlo-blue px-4 py-3 text-sm font-bold text-white">
              Open dashboard
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewRow({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-harlo-mist text-harlo-blue">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-black">{title}</p>
        <p className="truncate text-xs text-slate-500">{body}</p>
      </div>
    </div>
  );
}
