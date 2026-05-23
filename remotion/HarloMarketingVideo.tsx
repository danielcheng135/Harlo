import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  Check,
  Clock3,
  FileText,
  Globe2,
  MessageCircle,
  MousePointer2,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap
} from "lucide-react";
import "./styles.css";

const fps = 30;
const sceneLength = 180;
const totalFrames = sceneLength * 5;

const brand = {
  ink: "#17201f",
  teal: "#087f95",
  green: "#0f8f78",
  mint: "#d8f4ef",
  canvas: "#f7faf8",
  blue: "#2f6fed",
  coral: "#ff7a66",
  gold: "#f2b84b",
  violet: "#7c5cff"
};

const scenes = [
  {start: 0, end: 180, kicker: "Outcome", title: "Answer every website question"},
  {start: 180, end: 360, kicker: "Knowledge", title: "Stay accurate and on brand"},
  {start: 360, end: 540, kicker: "Leads", title: "Capture buying intent"},
  {start: 540, end: 720, kicker: "Routing", title: "Send context to the right team"},
  {start: 720, end: 900, kicker: "Launch", title: "Go live fast"}
];

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

const appear = (frame: number, from: number, duration = 24) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

const progress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

const lift = (frame: number, from: number, distance = 36) =>
  interpolate(appear(frame, from), [0, 1], [distance, 0]);

export const HarloMarketingVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="harlo-video">
      <Background />
      <Sequence from={0} durationInFrames={sceneLength}>
        <HeroScene />
      </Sequence>
      <Sequence from={180} durationInFrames={sceneLength}>
        <KnowledgeScene />
      </Sequence>
      <Sequence from={360} durationInFrames={sceneLength}>
        <LeadScene />
      </Sequence>
      <Sequence from={540} durationInFrames={sceneLength}>
        <RoutingScene />
      </Sequence>
      <Sequence from={720} durationInFrames={sceneLength}>
        <FinalScene />
      </Sequence>
      <SceneRail activeFrame={frame} />
    </AbsoluteFill>
  );
};

const Background = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, totalFrames], [0, -120]);

  return (
    <AbsoluteFill className="background">
      <div className="mesh mesh-one" style={{transform: `translate3d(${drift}px, ${drift * 0.24}px, 0)`}} />
      <div className="mesh mesh-two" style={{transform: `translate3d(${-drift * 0.36}px, ${drift * 0.18}px, 0)`}} />
      <div className="grid" />
      <div className="texture" />
    </AbsoluteFill>
  );
};

const BrandLockup = ({compact = false}: {compact?: boolean}) => (
  <div className={compact ? "brand-lockup compact" : "brand-lockup"}>
    <div className="brand-mark">
      <Sparkles size={compact ? 23 : 30} strokeWidth={2.4} />
    </div>
    <div>
      <div className="brand-name">Harlo</div>
      {!compact && <div className="brand-subtitle">AI chat for business websites</div>}
    </div>
  </div>
);

const SceneHeader = ({kicker, title, body, icon}: {kicker: string; title: string; body: string; icon: React.ReactNode}) => {
  const frame = useCurrentFrame();

  return (
    <div className="scene-header" style={{opacity: appear(frame, 8), transform: `translateY(${lift(frame, 8, 42)}px)`}}>
      <div className="scene-kicker">
        {icon}
        <span>{kicker}</span>
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
};

const HeroScene = () => {
  const frame = useCurrentFrame();
  const phone = spring({frame: frame - 24, fps, config: {damping: 18, stiffness: 88}});
  const cursor = progress(frame, 86, 130);

  return (
    <AbsoluteFill className="scene hero-scene">
      <div className="hero-copy" style={{opacity: appear(frame, 8), transform: `translateY(${lift(frame, 8, 46)}px)`}}>
        <BrandLockup />
        <h1>Turn website visits into booked revenue.</h1>
        <p>Harlo answers instantly, captures intent, and gives your team the next best action before the lead cools off.</p>
      </div>
      <div className="hero-device-wrap" style={{opacity: phone, transform: `translateY(${interpolate(phone, [0, 1], [82, 0])}px) scale(${interpolate(phone, [0, 1], [0.93, 1])})`}}>
        <DashboardMockup />
        <div
          className="cursor"
          style={{
            left: `${interpolate(cursor, [0, 1], [79, 63])}%`,
            top: `${interpolate(cursor, [0, 1], [70, 53])}%`,
            opacity: appear(frame, 74, 12)
          }}
        >
          <MousePointer2 size={34} fill={brand.ink} />
        </div>
      </div>
      <div className="outcome-strip">
        <OutcomePill icon={<Zap size={20} />} label="1.3s answers" delay={118} />
        <OutcomePill icon={<CalendarCheck size={20} />} label="More booked calls" delay={132} />
        <OutcomePill icon={<ShieldCheck size={20} />} label="Approved knowledge" delay={146} />
      </div>
    </AbsoluteFill>
  );
};

const KnowledgeScene = () => {
  const frame = useCurrentFrame();
  const scan = progress(frame, 50, 150);

  return (
    <AbsoluteFill className="scene stack-scene">
      <SceneHeader
        icon={<Globe2 size={26} />}
        kicker="Business-aware answers"
        title="Harlo learns the pages your customers already trust."
        body="Pricing, FAQs, service details, policies, and docs become a reliable answer layer for every visitor."
      />
      <div className="knowledge-board">
        {["Homepage", "Pricing", "Service pages", "Policies", "Help docs"].map((item, index) => (
          <SourceCard key={item} label={item} delay={38 + index * 14} />
        ))}
        <div className="scan-line" style={{transform: `translateY(${interpolate(scan, [0, 1], [0, 450])}px)`}} />
        <div className="answer-card" style={{opacity: appear(frame, 118), transform: `translateY(${lift(frame, 118, 28)}px)`}}>
          <div className="answer-label"><Bot size={21} /> Harlo answer</div>
          <p>"Yes. The Growth plan includes lead capture, routing, brand voice, and monthly conversation credits."</p>
          <div className="citation-row">
            <span>Sources</span>
            <b>Pricing</b>
            <b>Docs</b>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LeadScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="scene stack-scene">
      <SceneHeader
        icon={<MessageCircle size={26} />}
        kicker="Lead capture"
        title="Qualify visitors while they are still engaged."
        body="Harlo asks the right follow-up, saves useful details, and turns vague interest into a clean lead record."
      />
      <div className="phone-chat">
        <ChatBubble who="Visitor" text="Do you handle emergency HVAC installs?" delay={44} />
        <ChatBubble who="Harlo" text="Yes. What city are you in, and when do you need service?" delay={74} accent />
        <ChatBubble who="Visitor" text="Atlanta. Today if possible." delay={106} />
        <LeadCard delay={130} />
      </div>
    </AbsoluteFill>
  );
};

const RoutingScene = () => {
  const frame = useCurrentFrame();
  const route = progress(frame, 64, 142);

  return (
    <AbsoluteFill className="scene stack-scene">
      <SceneHeader
        icon={<Route size={26} />}
        kicker="Smart routing"
        title="Send every high-intent moment to the team that can act."
        body="Route by service line, urgency, location, page intent, or custom fields so nobody has to chase missing context."
      />
      <div className="routing-system">
        <div className="route-card visitor-card" style={{opacity: appear(frame, 42), transform: `translateY(${lift(frame, 42, 24)}px)`}}>
          <UserRound size={26} />
          <div>
            <strong>New lead</strong>
            <span>Atlanta install request</span>
          </div>
        </div>
        <div className="route-line">
          <i style={{transform: `scaleX(${route})`}} />
        </div>
        <div className="team-grid">
          <TeamCard label="Sales" active={frame > 120} delay={74} />
          <TeamCard label="Support" active={false} delay={88} />
          <TeamCard label="Operations" active={false} delay={102} />
        </div>
        <div className="handoff-card" style={{opacity: appear(frame, 132), transform: `translateY(${lift(frame, 132, 28)}px)`}}>
          <div className="route-head">
            <Clock3 size={22} />
            <span>Priority lead</span>
            <strong>92%</strong>
          </div>
          <div className="route-meta">
            <span>HVAC install</span>
            <span>Atlanta</span>
            <span>Call today</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinalScene = () => {
  const frame = useCurrentFrame();
  const {fps: currentFps} = useVideoConfig();
  const pulse = spring({frame: frame - 70, fps: currentFps, config: {damping: 9, stiffness: 78}});

  return (
    <AbsoluteFill className="scene final-scene">
      <div className="final-main" style={{opacity: appear(frame, 10), transform: `translateY(${lift(frame, 10, 44)}px)`}}>
        <BrandLockup compact />
        <h2>Launch a better first conversation.</h2>
        <p>Train Harlo on your business, install the widget, and start turning customer questions into qualified pipeline.</p>
      </div>
      <div className="metrics-stack">
        <MetricCard icon={<MessageCircle />} label="Conversations handled" value="2,418" delay={62} />
        <MetricCard icon={<BarChart3 />} label="Qualified leads" value="+38%" delay={80} />
        <MetricCard icon={<Check />} label="Avg. response time" value="1.3s" delay={98} />
      </div>
      <div className="cta-row" style={{opacity: appear(frame, 126), transform: `translateY(${lift(frame, 126, 24)}px)`}}>
        <span className="primary-cta">Book a demo</span>
        <span className="secondary-cta">Start free trial <ArrowRight size={20} /></span>
      </div>
      <div className="launch-ring" style={{opacity: appear(frame, 118), transform: `scale(${interpolate(pulse, [0, 1], [0.76, 1])})`}}>
        <Sparkles size={54} />
      </div>
    </AbsoluteFill>
  );
};

const SceneRail = ({activeFrame}: {activeFrame: number}) => (
  <div className="scene-rail">
    {scenes.map((scene, index) => {
      const fill = progress(activeFrame, scene.start, scene.end);
      const active = activeFrame >= scene.start && activeFrame < scene.end;

      return (
        <div className={active ? "rail-item active" : "rail-item"} key={scene.kicker}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{scene.kicker}</strong>
            <em>{scene.title}</em>
            <i style={{transform: `scaleX(${active ? fill : activeFrame > scene.end ? 1 : 0})`}} />
          </div>
        </div>
      );
    })}
  </div>
);

const DashboardMockup = () => {
  const frame = useCurrentFrame();

  return (
    <div className="dashboard">
      <div className="browser-bar">
        <span />
        <span />
        <span />
        <b>harlo.ai/live-demo</b>
      </div>
      <div className="dashboard-body">
        <div className="topline">
          <div>
            <span>Live site assistant</span>
            <h3>Ready for visitors</h3>
          </div>
          <div className="status"><span /> Online</div>
        </div>
        <div className="site-card">
          <Img src={staticFile("harlo-site-preview.svg")} />
          <div className="chat-widget" style={{transform: `translateY(${Math.sin(frame / 9) * 4}px)`}}>
            <div className="widget-head"><Bot size={19} /> Ask Harlo</div>
            <p>How can I help with pricing, services, or booking?</p>
          </div>
        </div>
        <div className="activity-card">
          {["FAQ answered", "Lead captured", "Demo routed"].map((item, i) => (
            <div className="activity-row" key={item}>
              <span style={{background: [brand.green, brand.blue, brand.coral][i]}} />
              <b>{item}</b>
              <em>{["24", "9", "3"][i]}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OutcomePill = ({icon, label, delay}: {icon: React.ReactNode; label: string; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 18);

  return (
    <div className="outcome-pill" style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [22, 0])}px)`}}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

const SourceCard = ({label, delay}: {label: string; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 16);

  return (
    <div className="source-card" style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`}}>
      <div className="source-icon"><FileText size={21} /></div>
      <div>
        <strong>{label}</strong>
        <span>{Math.round(visible * 100)}% indexed</span>
      </div>
      <Check size={21} />
    </div>
  );
};

const ChatBubble = ({who, text, delay, accent = false}: {who: string; text: string; delay: number; accent?: boolean}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 14);

  return (
    <div className={accent ? "chat-bubble accent" : "chat-bubble"} style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`}}>
      <span>{who}</span>
      <p>{text}</p>
    </div>
  );
};

const LeadCard = ({delay}: {delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 18);

  return (
    <div className="lead-card" style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`}}>
      <div className="lead-score">
        <Sparkles size={22} />
        <span>Qualified lead</span>
        <strong>92%</strong>
      </div>
      <div className="lead-fields">
        <span>Service: HVAC install</span>
        <span>Location: Atlanta</span>
        <span>Timing: Today</span>
      </div>
    </div>
  );
};

const TeamCard = ({label, active, delay}: {label: string; active: boolean; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 18);

  return (
    <div className={active ? "team-card active" : "team-card"} style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [22, 0])}px)`}}>
      <Bot size={22} />
      <span>{label}</span>
    </div>
  );
};

const MetricCard = ({icon, label, value, delay}: {icon: React.ReactNode; label: string; value: string; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 18);

  return (
    <div className="metric-card" style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [26, 0])}px)`}}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};
