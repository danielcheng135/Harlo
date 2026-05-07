import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill} from "remotion";
import {
  Bot,
  CheckCircle2,
  Database,
  Globe2,
  MessageSquare,
  Route,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Zap
} from "lucide-react";

const colors = {
  ink: "#111827",
  muted: "#5f6876",
  line: "#dce6ea",
  canvas: "#f7faf8",
  surface: "#ffffff",
  teal: "#087f95",
  mist: "#e6f3f6",
  navy: "#066375",
  coral: "#ff7a66",
  gold: "#f2b84b",
  emerald: "#22c55e",
  blue: "#38bdf8"
};

const shell: CSSProperties = {
  background: colors.canvas,
  color: colors.ink,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  overflow: "hidden"
};

const gridBackground: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(17, 24, 39, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 24, 39, 0.055) 1px, transparent 1px)",
  backgroundSize: "52px 52px",
  maskImage: "linear-gradient(110deg, rgba(0,0,0,0.9), rgba(0,0,0,0.22))"
};

const frame: CSSProperties = {
  position: "absolute",
  inset: 52,
  border: `1px solid ${colors.line}`,
  borderRadius: 36,
  background: "rgba(255, 255, 255, 0.82)",
  boxShadow: "0 28px 80px rgba(17, 24, 39, 0.12)",
  overflow: "hidden"
};

const eyebrow: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 999,
  background: colors.mist,
  color: colors.teal,
  fontSize: 22,
  fontWeight: 760
};

const title: CSSProperties = {
  margin: "26px 0 0",
  color: colors.ink,
  fontSize: 58,
  lineHeight: 1,
  letterSpacing: 0,
  fontWeight: 830
};

const body: CSSProperties = {
  margin: "18px 0 0",
  color: colors.muted,
  fontSize: 25,
  lineHeight: 1.38,
  fontWeight: 520
};

const card: CSSProperties = {
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  background: colors.surface,
  boxShadow: "0 18px 44px rgba(17, 24, 39, 0.08)"
};

export const LandingFeaturesGraphic = () => (
  <GraphicShell>
    <div style={{...frame, display: "grid", gridTemplateColumns: "0.86fr 1.14fr"}}>
      <div style={{padding: 58}}>
        <span style={eyebrow}>
          <Database size={24} />
          Knowledge layer
        </span>
        <h1 style={title}>Answers from approved sources.</h1>
        <p style={body}>Pages, policies, docs, and team notes become a reliable website assistant.</p>
      </div>
      <div style={{padding: "54px 58px 54px 0", display: "grid", gap: 18}}>
        {[
          {label: "Website pages", detail: "Synced and indexed", Icon: Globe2, color: colors.teal},
          {label: "Support policy", detail: "Used for source-grounded replies", Icon: ShieldCheck, color: colors.emerald},
          {label: "Lead fields", detail: "Captured when a person is needed", Icon: UserRoundCheck, color: colors.coral},
          {label: "Widget install", detail: "One snippet across the site", Icon: CodeSymbol, color: colors.gold}
        ].map(({label, detail, Icon, color}) => (
          <div key={label} style={{...card, display: "flex", alignItems: "center", gap: 18, padding: 22}}>
            <span style={{display: "grid", placeItems: "center", width: 58, height: 58, borderRadius: 15, background: `${color}1f`, color}}>
              <Icon size={28} />
            </span>
            <div>
              <div style={{fontSize: 25, fontWeight: 790}}>{label}</div>
              <div style={{marginTop: 6, fontSize: 18, color: colors.muted, fontWeight: 620}}>{detail}</div>
            </div>
            <CheckCircle2 size={28} color={colors.teal} style={{marginLeft: "auto"}} />
          </div>
        ))}
      </div>
    </div>
  </GraphicShell>
);

export const LandingWorkflowGraphic = () => (
  <GraphicShell>
    <div style={{...frame, padding: 54}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <span style={eyebrow}>
          <Zap size={24} />
          Launch path
        </span>
        <div style={{fontSize: 20, color: colors.muted, fontWeight: 700}}>setup.harlo/workflow</div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 62, position: "relative"}}>
        <div style={{position: "absolute", left: "16%", right: "16%", top: 54, height: 3, background: colors.line}} />
        {[
          {step: "01", title: "Connect", detail: "Pages, docs, FAQs"},
          {step: "02", title: "Tune", detail: "Voice, color, fields"},
          {step: "03", title: "Capture", detail: "Intent and handoff"}
        ].map((item, index) => (
          <div key={item.step} style={{...card, position: "relative", padding: 28, minHeight: 270}}>
            <div style={{display: "grid", placeItems: "center", width: 108, height: 108, borderRadius: 999, background: index === 1 ? colors.teal : colors.mist, color: index === 1 ? "#fff" : colors.teal, fontSize: 30, fontWeight: 840}}>
              {item.step}
            </div>
            <h2 style={{margin: "32px 0 0", fontSize: 34, lineHeight: 1, fontWeight: 820}}>{item.title}</h2>
            <p style={{margin: "12px 0 0", fontSize: 20, lineHeight: 1.35, color: colors.muted, fontWeight: 590}}>{item.detail}</p>
          </div>
        ))}
      </div>
      <div style={{...card, marginTop: 26, display: "flex", alignItems: "center", gap: 16, padding: 20}}>
        <Bot size={28} color={colors.teal} />
        <span style={{fontSize: 22, fontWeight: 760}}>Harlo is ready for website visitors.</span>
        <span style={{marginLeft: "auto", borderRadius: 999, background: colors.mist, color: colors.teal, padding: "8px 12px", fontSize: 18, fontWeight: 780}}>
          Online
        </span>
      </div>
    </div>
  </GraphicShell>
);

export const LandingOutcomesGraphic = () => (
  <GraphicShell>
    <div style={{...frame, display: "grid", gridTemplateColumns: "1.05fr 0.95fr"}}>
      <div style={{padding: 58}}>
        <span style={eyebrow}>
          <MessageSquare size={24} />
          Customer moments
        </span>
        <div style={{marginTop: 42, display: "grid", gap: 18}}>
          {[
            ["Visitor asks about pricing", "Answered from plan docs"],
            ["Lead asks for callback", "Captured and tagged"],
            ["Policy question appears", "Cited from support source"]
          ].map(([prompt, answer], index) => (
            <div key={prompt} style={{...card, padding: 22}}>
              <div style={{fontSize: 19, color: colors.muted, fontWeight: 700}}>0{index + 1}</div>
              <div style={{marginTop: 8, fontSize: 25, fontWeight: 800}}>{prompt}</div>
              <div style={{marginTop: 8, fontSize: 19, color: colors.teal, fontWeight: 720}}>{answer}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding: "58px 58px 58px 0", display: "grid", gridTemplateRows: "1fr 1fr", gap: 20}}>
        <Metric label="Answered" value="84%" color={colors.teal} />
        <Metric label="Lead intent" value="32" color={colors.coral} />
        <div style={{...card, gridColumn: "1 / -1", padding: 24}}>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <Route size={28} color={colors.teal} />
            <span style={{fontSize: 24, fontWeight: 820}}>Routed with context</span>
          </div>
          <div style={{marginTop: 18, height: 12, borderRadius: 999, background: colors.mist, overflow: "hidden"}}>
            <div style={{width: "72%", height: "100%", borderRadius: 999, background: colors.teal}} />
          </div>
        </div>
      </div>
    </div>
  </GraphicShell>
);

export const LandingPricingGraphic = () => (
  <GraphicShell>
    <div style={{...frame, padding: 54}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <span style={eyebrow}>
          <Sparkles size={24} />
          Plans
        </span>
        <span style={{borderRadius: 999, background: colors.ink, color: "#fff", padding: "10px 15px", fontSize: 18, fontWeight: 780}}>
          Start with 50 trial credits
        </span>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 54}}>
        {[
          {name: "Starter", price: "$39", credits: "500 credits", active: false},
          {name: "Growth", price: "$129", credits: "4,000 credits", active: true},
          {name: "Pro", price: "$399", credits: "15,000 credits", active: false}
        ].map((plan) => (
          <div key={plan.name} style={{...card, borderColor: plan.active ? colors.teal : colors.line, padding: 26, minHeight: 390}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
              <div style={{fontSize: 29, fontWeight: 840}}>{plan.name}</div>
              {plan.active ? (
                <span style={{borderRadius: 999, background: colors.mist, color: colors.teal, padding: "8px 12px", fontSize: 17, fontWeight: 780}}>
                  Popular
                </span>
              ) : null}
            </div>
            <div style={{marginTop: 34, fontSize: 56, fontWeight: 860, lineHeight: 1}}>{plan.price}</div>
            <div style={{marginTop: 10, color: colors.muted, fontSize: 19, fontWeight: 650}}>per month</div>
            <div style={{marginTop: 34, display: "grid", gap: 14}}>
              {[plan.credits, "Lead capture", "Analytics"].map((feature) => (
                <div key={feature} style={{display: "flex", alignItems: "center", gap: 10, color: colors.muted, fontSize: 20, fontWeight: 700}}>
                  <CheckCircle2 size={22} color={colors.teal} />
                  {feature}
                </div>
              ))}
            </div>
            <div style={{marginTop: 32, height: 10, borderRadius: 999, background: colors.mist, overflow: "hidden"}}>
              <div style={{height: "100%", width: plan.active ? "72%" : "42%", borderRadius: 999, background: plan.active ? colors.teal : colors.gold}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </GraphicShell>
);

export const LandingFaqCtaGraphic = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(105deg, ${colors.navy} 0%, ${colors.teal} 43%, ${colors.mist} 100%)`,
      color: "#fff",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      overflow: "hidden"
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
        backgroundSize: "58px 58px",
        opacity: 0.38
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(95deg, rgba(6, 99, 117, 0.96) 0%, rgba(8, 127, 149, 0.84) 46%, rgba(230, 243, 246, 0.62) 76%, rgba(255,255,255,0.2) 100%)`
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 84,
        top: 88,
        width: 560,
        height: 310,
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 34,
        background: "rgba(255,255,255,0.1)"
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 124,
        top: 140,
        display: "grid",
        gap: 22
      }}
    >
      {[460, 360, 520].map((width, index) => (
        <div
          key={width}
          style={{
            width,
            height: index === 1 ? 34 : 42,
            borderRadius: 999,
            background: index === 2 ? "rgba(255,255,255,0.92)" : "rgba(230,243,246,0.28)"
          }}
        />
      ))}
      <div style={{display: "flex", alignItems: "center", gap: 18, marginTop: 8}}>
        <div style={{width: 210, height: 62, borderRadius: 999, background: colors.surface}} />
        <div style={{width: 170, height: 18, borderRadius: 999, background: "rgba(242,184,75,0.72)"}} />
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        right: 126,
        top: 160,
        width: 386,
        height: 420,
        borderRadius: 28,
        background: colors.surface,
        color: colors.ink,
        boxShadow: "0 34px 90px rgba(6, 63, 76, 0.28)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          height: 70,
          borderBottom: `1px solid ${colors.line}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 22px"
        }}
      >
        <span style={{display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 9, background: colors.teal, color: "#fff"}}>
          <Sparkles size={17} />
        </span>
        <span style={{fontSize: 20, fontWeight: 830}}>Harlo</span>
        <span style={{marginLeft: "auto", fontSize: 14, color: colors.teal, fontWeight: 720}}>Online</span>
      </div>
      <div style={{padding: 22, display: "grid", gap: 16}}>
        <ChatBubble align="right" width={238} tone="light">
          I need pricing and a callback.
        </ChatBubble>
        <ChatBubble align="left" width={292} tone="teal">
          Starter includes 500 credits. I can capture your details for the team.
        </ChatBubble>
        <ChatBubble align="right" width={188} tone="light">
          Perfect.
        </ChatBubble>
        <div style={{...card, padding: 15, marginTop: 2}}>
          <div style={{fontSize: 14, color: colors.muted, fontWeight: 760}}>Lead captured</div>
          <div style={{marginTop: 11, display: "grid", gap: 9}}>
            {[72, 92, 58].map((width) => (
              <div key={width} style={{height: 9, width: `${width}%`, borderRadius: 999, background: colors.mist}} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        right: 72,
        bottom: 70,
        width: 180,
        height: 180,
        borderRadius: 32,
        border: "1px solid rgba(255,255,255,0.26)",
        transform: "rotate(10deg)",
        background: "rgba(242,184,75,0.14)"
      }}
    />
  </AbsoluteFill>
);

function GraphicShell({children}: {children: ReactNode}) {
  return (
    <AbsoluteFill style={shell}>
      <div style={gridBackground} />
      {children}
    </AbsoluteFill>
  );
}

function ChatBubble({
  align,
  children,
  tone,
  width
}: {
  align: "left" | "right";
  children: ReactNode;
  tone: "teal" | "light";
  width: number;
}) {
  return (
    <div
      style={{
        justifySelf: align === "right" ? "end" : "start",
        width,
        borderRadius: 13,
        padding: "13px 14px",
        background: tone === "teal" ? colors.teal : "#eef2f6",
        color: tone === "teal" ? "#fff" : colors.ink,
        fontSize: 17,
        lineHeight: 1.25,
        fontWeight: 620
      }}
    >
      {children}
    </div>
  );
}

function Metric({label, value, color}: {label: string; value: string; color: string}) {
  return (
    <div style={{...card, padding: 24}}>
      <div style={{fontSize: 20, color: colors.muted, fontWeight: 720}}>{label}</div>
      <div style={{marginTop: 22, fontSize: 64, lineHeight: 1, fontWeight: 870, color}}>{value}</div>
      <div style={{marginTop: 24, height: 11, borderRadius: 999, background: colors.mist, overflow: "hidden"}}>
        <div style={{width: label === "Answered" ? "84%" : "58%", height: "100%", borderRadius: 999, background: color}} />
      </div>
    </div>
  );
}

function CodeSymbol({size = 24}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 5-4 14" />
    </svg>
  );
}
