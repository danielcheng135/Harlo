import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Bot, Check, FileCheck2, MessageCircle, Route, Send, Sparkles, UserRoundCheck} from "lucide-react";

type OutcomeKind = "support" | "sales" | "operations" | "routing";

type OutcomeVideoProps = {
  kind: OutcomeKind;
};

const colors = {
  ink: "#111827",
  muted: "#5f6876",
  line: "#dce6ea",
  canvas: "#f7faf8",
  surface: "#ffffff",
  teal: "#087f95",
  tealDark: "#066375",
  mist: "#e6f3f6",
  coral: "#ff7a66",
  coralSoft: "#fff0ed",
  gold: "#f2b84b",
  goldSoft: "#fff7de",
  green: "#22c55e",
  greenSoft: "#eafbf2",
  blue: "#38bdf8",
  blueSoft: "#edf8ff"
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const variants = {
  support: {
    eyebrow: "Answer repeat questions",
    title: "Answers that stay useful.",
    accent: colors.teal,
    soft: colors.mist,
    Icon: MessageCircle
  },
  sales: {
    eyebrow: "Capture qualified leads",
    title: "Turn intent into context.",
    accent: colors.coral,
    soft: colors.coralSoft,
    Icon: UserRoundCheck
  },
  operations: {
    eyebrow: "Ground every answer",
    title: "One approved source of truth.",
    accent: colors.green,
    soft: colors.greenSoft,
    Icon: FileCheck2
  },
  routing: {
    eyebrow: "Route with context",
    title: "Escalate the right moments.",
    accent: colors.gold,
    soft: colors.goldSoft,
    Icon: Route
  }
} satisfies Record<OutcomeKind, {eyebrow: string; title: string; accent: string; soft: string; Icon: typeof MessageCircle}>;

const appear = (frame: number, fps: number, at: number, duration = 0.42) =>
  interpolate(frame, [at * fps, (at + duration) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

const move = (frame: number, fps: number, at: number, distance: number) =>
  interpolate(appear(frame, fps, at), [0, 1], [distance, 0]);

const progress = (frame: number, fps: number, from: number, to: number) =>
  interpolate(frame, [from * fps, to * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

export const OutcomeVideo = ({kind}: OutcomeVideoProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const variant = variants[kind];
  const Icon = variant.Icon;
  const pulse = spring({frame: frame - 18, fps, config: {damping: 14, stiffness: 90}});

  return (
    <AbsoluteFill style={shell}>
      <Background accent={variant.accent} soft={variant.soft} />
      <div style={stage}>
        <div style={{...topBar, opacity: appear(frame, fps, 0.12), transform: `translateY(${move(frame, fps, 0.12, -22)}px)`}}>
          <div style={{...brandMark, background: variant.accent}}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={brandName}>Harlo</div>
            <div style={brandSub}>Website assistant</div>
          </div>
          <span style={statusPill}>Online</span>
        </div>

        <div
          style={{
            ...eyebrow,
            background: variant.soft,
            color: variant.accent,
            opacity: appear(frame, fps, 0.32),
            transform: `translateY(${move(frame, fps, 0.32, 18)}px)`
          }}
        >
          <Icon size={20} />
          {variant.eyebrow}
        </div>

        <h1 style={{...headline, opacity: appear(frame, fps, 0.52), transform: `translateY(${move(frame, fps, 0.52, 28)}px)`}}>{variant.title}</h1>

        <div
          style={{
            ...orb,
            borderColor: variant.accent,
            color: variant.accent,
            opacity: appear(frame, fps, 0.62),
            transform: `scale(${interpolate(pulse, [0, 1], [0.84, 1])})`
          }}
        >
          <Icon size={30} />
        </div>

        {kind === "support" ? <SupportScene accent={variant.accent} soft={variant.soft} /> : null}
        {kind === "sales" ? <SalesScene accent={variant.accent} soft={variant.soft} /> : null}
        {kind === "operations" ? <OperationsScene accent={variant.accent} soft={variant.soft} /> : null}
        {kind === "routing" ? <RoutingScene accent={variant.accent} soft={variant.soft} /> : null}
      </div>
    </AbsoluteFill>
  );
};

export const SupportOutcomeVideo = () => <OutcomeVideo kind="support" />;
export const SalesOutcomeVideo = () => <OutcomeVideo kind="sales" />;
export const OperationsOutcomeVideo = () => <OutcomeVideo kind="operations" />;
export const RoutingOutcomeVideo = () => <OutcomeVideo kind="routing" />;

const SupportScene = ({accent, soft}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bar = progress(frame, fps, 1.5, 3.2);

  return (
    <div style={sceneGrid}>
      <div style={{...chatPanel, opacity: appear(frame, fps, 0.74), transform: `translateX(${move(frame, fps, 0.74, -42)}px)`}}>
        <Bubble label="Visitor" text="Do you support multi-location teams?" delay={0.95} />
        <Bubble label="Harlo" text="Yes. Harlo answers by location, service line, and policy." delay={1.35} accent={accent} />
        <Bubble label="Visitor" text="Can I see the setup steps?" delay={1.86} />
      </div>
      <div style={{...insightCard, opacity: appear(frame, fps, 1.16), transform: `translateX(${move(frame, fps, 1.16, 46)}px)`}}>
        <MiniHeader icon={<Bot size={20} />} label="Answer quality" accent={accent} />
        <h2 style={cardTitle}>Repeat questions handled instantly</h2>
        <div style={track}>
          <div style={{...trackFill, width: `${bar * 86}%`, background: accent}} />
        </div>
        <div style={sourceRow}>
          {["FAQ", "Docs", "Policy"].map((item, index) => (
            <span key={item} style={{...chip, background: index === 0 ? soft : colors.canvas, color: index === 0 ? accent : colors.muted}}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SalesScene = ({accent, soft}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const score = Math.round(interpolate(progress(frame, fps, 1.28, 3), [0, 1], [52, 92]));

  return (
    <div style={sceneGrid}>
      <div style={{...chatPanel, opacity: appear(frame, fps, 0.72), transform: `translateX(${move(frame, fps, 0.72, -42)}px)`}}>
        <Bubble label="Visitor" text="Can someone follow up about Growth?" delay={0.96} />
        <Bubble label="Harlo" text="Yes. What is the best email and team size?" delay={1.34} accent={accent} />
        <Bubble label="Visitor" text="12 people, ops@northstar.co" delay={1.78} />
      </div>
      <div style={{...insightCard, opacity: appear(frame, fps, 1.06), transform: `translateX(${move(frame, fps, 1.06, 46)}px)`}}>
        <MiniHeader icon={<UserRoundCheck size={20} />} label="Lead captured" accent={accent} />
        <h2 style={cardTitle}>Qualified with conversation history</h2>
        <div style={{...leadScore, background: soft}}>
          <span>Fit score</span>
          <strong style={{color: accent}}>{score}%</strong>
        </div>
        <div style={sourceRow}>
          {["Growth", "12 seats", "Follow-up"].map((item) => (
            <span key={item} style={{...chip, background: colors.canvas, color: colors.muted}}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const OperationsScene = ({accent, soft}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div style={sceneGrid}>
      <div style={{...sourceStack, opacity: appear(frame, fps, 0.72), transform: `translateX(${move(frame, fps, 0.72, -42)}px)`}}>
        {["Pricing page", "Support policy", "Install guide", "Team notes"].map((item, index) => (
          <div key={item} style={{...sourceCard, opacity: appear(frame, fps, 0.86 + index * 0.22), transform: `translateY(${move(frame, fps, 0.86 + index * 0.22, 24)}px)`}}>
            <span style={{...tinyIcon, background: soft, color: accent}}>
              <Check size={17} />
            </span>
            <div>
              <strong>{item}</strong>
              <small>{index === 0 ? "Synced now" : "Approved source"}</small>
            </div>
          </div>
        ))}
      </div>
      <div style={{...insightCard, opacity: appear(frame, fps, 1.24), transform: `translateX(${move(frame, fps, 1.24, 46)}px)`}}>
        <MiniHeader icon={<FileCheck2 size={20} />} label="Source grounded" accent={accent} />
        <h2 style={cardTitle}>Every answer cites approved context</h2>
        <div style={{...quoteBox, borderColor: `${accent}55`}}>
          "Use Starter for one assistant, Growth for steady traffic."
        </div>
      </div>
    </div>
  );
};

const RoutingScene = ({accent, soft}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const path = progress(frame, fps, 1.1, 3.15);

  return (
    <div style={sceneGrid}>
      <div style={{...routeBoard, opacity: appear(frame, fps, 0.72), transform: `translateX(${move(frame, fps, 0.72, -42)}px)`}}>
        <div style={routeLine}>
          <div style={{...routeLineFill, width: `${path * 100}%`, background: accent}} />
        </div>
        {["AI triage", "Sales", "Support"].map((item, index) => (
          <div key={item} style={{...routeStep, left: `${index * 38}%`, background: index === 1 ? soft : colors.surface, color: index === 1 ? accent : colors.ink}}>
            {item}
          </div>
        ))}
        <div style={{...sendBubble, transform: `translateX(${interpolate(path, [0, 1], [0, 350])}px)`}}>
          <Send size={22} />
        </div>
      </div>
      <div style={{...insightCard, opacity: appear(frame, fps, 1.2), transform: `translateX(${move(frame, fps, 1.2, 46)}px)`}}>
        <MiniHeader icon={<Route size={20} />} label="Clean handoff" accent={accent} />
        <h2 style={cardTitle}>The next team gets the full story</h2>
        <div style={sourceRow}>
          {["Intent", "Urgency", "Transcript"].map((item) => (
            <span key={item} style={{...chip, background: colors.canvas, color: colors.muted}}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

type SceneProps = {
  accent: string;
  soft: string;
};

const Bubble = ({label, text, delay, accent}: {label: string; text: string; delay: number; accent?: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const visible = appear(frame, fps, delay, 0.34);

  return (
    <div
      style={{
        ...bubble,
        marginLeft: label === "Harlo" ? 52 : 0,
        background: accent ?? colors.surface,
        color: accent ? "#fff" : colors.ink,
        opacity: visible,
        transform: `translateY(${interpolate(visible, [0, 1], [22, 0])}px)`
      }}
    >
      <small style={{opacity: accent ? 0.78 : 0.58}}>{label}</small>
      <span>{text}</span>
    </div>
  );
};

const MiniHeader = ({icon, label, accent}: {icon: ReactNode; label: string; accent: string}) => (
  <div style={{display: "flex", alignItems: "center", gap: 10, color: accent, fontSize: 17, fontWeight: 780}}>
    {icon}
    {label}
  </div>
);

const Background = ({accent, soft}: {accent: string; soft: string}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 150], [-28, 18], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{background: `linear-gradient(120deg, ${soft} 0%, #ffffff 45%, ${colors.canvas} 100%)`}}>
      <div style={grid} />
      <div style={{...mesh, left: -110 + drift, top: -130, background: `${accent}33`}} />
      <div style={{...mesh, right: -150 - drift, bottom: -150, background: "#cceee766"}} />
    </AbsoluteFill>
  );
};

const shell: CSSProperties = {
  color: colors.ink,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  overflow: "hidden"
};

const grid: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(17, 24, 39, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 24, 39, 0.055) 1px, transparent 1px)",
  backgroundSize: "54px 54px",
  maskImage: "radial-gradient(circle at 50% 48%, black 0, transparent 72%)"
};

const mesh: CSSProperties = {
  position: "absolute",
  width: 360,
  height: 360,
  borderRadius: 999,
  filter: "blur(66px)",
  opacity: 0.78
};

const stage: CSSProperties = {
  position: "absolute",
  inset: 34,
  overflow: "hidden",
  border: `1px solid ${colors.line}`,
  borderRadius: 28,
  background: "rgba(255,255,255,0.70)",
  boxShadow: "0 28px 80px rgba(17, 24, 39, 0.12)",
  padding: 38
};

const topBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12
};

const brandMark: CSSProperties = {
  display: "grid",
  width: 42,
  height: 42,
  placeItems: "center",
  borderRadius: 13,
  color: "#fff"
};

const brandName: CSSProperties = {
  fontSize: 19,
  fontWeight: 820,
  lineHeight: 1
};

const brandSub: CSSProperties = {
  marginTop: 4,
  color: colors.muted,
  fontSize: 13,
  fontWeight: 650
};

const statusPill: CSSProperties = {
  marginLeft: "auto",
  borderRadius: 999,
  background: colors.mist,
  color: colors.teal,
  padding: "7px 10px",
  fontSize: 13,
  fontWeight: 760
};

const eyebrow: CSSProperties = {
  position: "absolute",
  left: 38,
  top: 126,
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 16,
  fontWeight: 800
};

const headline: CSSProperties = {
  position: "absolute",
  left: 38,
  top: 166,
  width: 390,
  margin: 0,
  color: colors.ink,
  fontSize: 44,
  lineHeight: 0.98,
  letterSpacing: 0,
  fontWeight: 850
};

const orb: CSSProperties = {
  position: "absolute",
  right: 42,
  top: 56,
  display: "grid",
  width: 64,
  height: 64,
  placeItems: "center",
  border: "1px solid",
  borderRadius: 22,
  background: "rgba(255,255,255,0.86)",
  boxShadow: "0 16px 44px rgba(17,24,39,0.12)"
};

const sceneGrid: CSSProperties = {
  position: "absolute",
  left: 38,
  right: 38,
  bottom: 36,
  display: "grid",
  gridTemplateColumns: "1fr 0.92fr",
  gap: 24,
  alignItems: "end"
};

const chatPanel: CSSProperties = {
  minHeight: 220,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  background: "rgba(255,255,255,0.76)",
  boxShadow: "0 18px 48px rgba(17,24,39,0.10)",
  padding: 22
};

const bubble: CSSProperties = {
  display: "grid",
  gap: 6,
  maxWidth: 360,
  marginBottom: 12,
  border: `1px solid ${colors.line}`,
  borderRadius: 14,
  padding: "11px 14px",
  boxShadow: "0 10px 26px rgba(17,24,39,0.07)",
  fontSize: 15,
  lineHeight: 1.35,
  fontWeight: 690
};

const insightCard: CSSProperties = {
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 18px 48px rgba(17,24,39,0.10)",
  padding: 24
};

const cardTitle: CSSProperties = {
  margin: "12px 0 18px",
  color: colors.ink,
  fontSize: 27,
  lineHeight: 1.06,
  letterSpacing: 0,
  fontWeight: 840
};

const track: CSSProperties = {
  height: 12,
  overflow: "hidden",
  borderRadius: 999,
  background: colors.mist
};

const trackFill: CSSProperties = {
  height: "100%",
  borderRadius: 999
};

const sourceRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 16
};

const chip: CSSProperties = {
  borderRadius: 999,
  padding: "7px 9px",
  fontSize: 13,
  fontWeight: 760
};

const leadScore: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 16,
  padding: "16px 18px",
  fontSize: 17,
  fontWeight: 780
};

const sourceStack: CSSProperties = {
  display: "grid",
  gap: 12
};

const sourceCard: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: `1px solid ${colors.line}`,
  borderRadius: 16,
  background: "rgba(255,255,255,0.84)",
  padding: "13px 14px",
  boxShadow: "0 12px 30px rgba(17,24,39,0.07)"
};

const tinyIcon: CSSProperties = {
  display: "grid",
  width: 34,
  height: 34,
  placeItems: "center",
  borderRadius: 10
};

const quoteBox: CSSProperties = {
  border: "1px solid",
  borderRadius: 16,
  background: colors.canvas,
  padding: 18,
  color: colors.muted,
  fontSize: 17,
  lineHeight: 1.35,
  fontWeight: 690
};

const routeBoard: CSSProperties = {
  position: "relative",
  height: 220,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 18px 48px rgba(17,24,39,0.10)",
  padding: 24
};

const routeLine: CSSProperties = {
  position: "absolute",
  left: 64,
  right: 64,
  top: 112,
  height: 8,
  overflow: "hidden",
  borderRadius: 999,
  background: colors.mist
};

const routeLineFill: CSSProperties = {
  height: "100%",
  borderRadius: 999
};

const routeStep: CSSProperties = {
  position: "absolute",
  top: 64,
  border: `1px solid ${colors.line}`,
  borderRadius: 16,
  padding: "12px 14px",
  fontSize: 16,
  fontWeight: 800,
  boxShadow: "0 12px 28px rgba(17,24,39,0.08)"
};

const sendBubble: CSSProperties = {
  position: "absolute",
  left: 50,
  top: 96,
  display: "grid",
  width: 48,
  height: 48,
  placeItems: "center",
  borderRadius: 999,
  background: colors.ink,
  color: "#fff",
  boxShadow: "0 18px 38px rgba(17,24,39,0.18)"
};
