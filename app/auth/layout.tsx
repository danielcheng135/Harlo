import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  UsersRound
} from "lucide-react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#06111b] text-white lg:h-screen lg:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(8,127,149,0.22),transparent_32%),radial-gradient(circle_at_72%_90%,rgba(8,170,190,0.48),transparent_34%),linear-gradient(135deg,#05101b_0%,#071622_50%,#075b6b_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:68px_68px] opacity-20" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-center px-5 pt-8 sm:px-8 lg:absolute lg:inset-x-0 lg:justify-start lg:pt-7">
        <Link href="/" className="inline-flex items-center gap-3 text-white">
          <img src="/icon.png" alt="Harlo logo" className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11 lg:h-9 lg:w-9" />
          <span className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-3xl">Harlo</span>
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-8 pt-8 sm:px-8 lg:min-h-screen lg:grid-cols-[0.86fr_1.14fr] lg:gap-10 lg:pb-5 lg:pt-20 xl:gap-14">
        <section className="flex justify-center lg:justify-start">{children}</section>
        <AuthShowcase />
      </div>
    </main>
  );
}

function AuthShowcase() {
  const recent = [
    { initials: "AJ", name: "Alex Johnson", message: "I need pricing and a callback.", status: "Captured", time: "Just now" },
    { initials: "SM", name: "Sarah Miller", message: "How does onboarding work?", status: "Captured", time: "2m ago" },
    { initials: "VL", name: "Visitor", message: "Do you integrate with HubSpot?", status: "In progress", time: "5m ago" }
  ];

  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="mb-5 max-w-2xl">
        <h2 className="text-[2.7rem] font-semibold leading-[1.06] tracking-tight xl:text-5xl">
          Turn website visitors
          <span className="block">into <span className="text-harlo-blue">qualified leads.</span></span>
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
          Harlo learns your site, answers instantly, and captures intent so your team can focus on what matters.
        </p>
      </div>

      <div className="relative max-w-[670px] shadow-[0_32px_110px_rgba(0,0,0,0.34)]">
        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-harlo-blue/20 blur-2xl" />
        <div className="relative grid grid-cols-[210px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#071623]/88">
          <div className="min-w-0 border-r border-white/10 bg-white/[0.04] p-4">
            <Sparkles size={22} className="text-white" />
            <nav className="mt-5 space-y-1.5 text-sm text-slate-200">
              <PreviewNavItem icon={<LayoutDashboard size={16} strokeWidth={2.1} />} label="Overview" active />
              <PreviewNavItem icon={<MessageSquare size={16} strokeWidth={2.3} />} label="Conversations" badge="83" />
              <PreviewNavItem icon={<UsersRound size={16} strokeWidth={2.1} />} label="Leads" badge="32" />
              <PreviewNavItem icon={<Database size={16} strokeWidth={2.1} />} label="Knowledge" />
              <PreviewNavItem icon={<BarChart3 size={16} strokeWidth={2.1} />} label="Analytics" />
              <PreviewNavItem icon={<Settings size={16} strokeWidth={2.1} />} label="Settings" />
            </nav>
          </div>

          <div className="min-w-0 space-y-2.5 p-4">
            <div className="rounded-lg bg-white p-3.5 text-harlo-ink shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Lead captured</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-harlo-mist text-xs font-bold text-harlo-teal">AJ</span>
                    <div>
                      <p className="text-sm font-semibold">Alex Johnson</p>
                      <p className="text-xs text-harlo-muted">alex@acme.com <span className="mx-1">-</span> Pricing</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-harlo-teal">View lead -&gt;</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">New lead</span>
                  <p className="mt-3 text-xs text-harlo-muted">Just now</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <MetricCard title="Conversations" value="2.4K" caption="Handled this month" />
              <div className="rounded-lg bg-white p-3.5 text-harlo-ink shadow-sm">
                <p className="text-sm font-semibold">Answered</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">84%</p>
                <p className="text-xs text-harlo-muted">Without human help</p>
                <div className="mt-3 flex justify-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full border-[7px] border-harlo-teal border-t-harlo-mist text-xs font-bold">84%</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3.5 text-harlo-ink shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent conversations</p>
                <p className="text-sm font-semibold text-harlo-teal">View all -&gt;</p>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {recent.map((item) => (
                  <div key={item.name} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-harlo-teal text-xs font-bold text-white">{item.initials}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{item.name}</p>
                      <p className="truncate text-xs text-harlo-muted">{item.message}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.status}</span>
                      <p className="mt-1 text-[10px] text-harlo-muted">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewNavItem({ icon, label, active, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string }) {
  return (
    <div className={`flex min-w-0 items-center justify-between gap-5 rounded-md px-3 py-1.5 ${active ? "bg-white/12 text-white" : "text-slate-300"}`}>
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-4 w-4 shrink-0 place-items-center">{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
      </span>
      {badge ? <span className="shrink-0 rounded-full bg-harlo-teal px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span> : null}
    </div>
  );
}

function MetricCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div className="rounded-lg bg-white p-3.5 text-harlo-ink shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-harlo-muted">{caption}</p>
      <div className="mt-3 flex items-end gap-1.5 text-harlo-teal">
        {[18, 28, 20, 34, 27, 39, 31, 46].map((height, index) => (
          <span key={index} style={{ height }} className="w-4 rounded-t-sm bg-current opacity-80" />
        ))}
      </div>
    </div>
  );
}
