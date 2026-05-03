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
  BarChart3,
  Bot,
  Check,
  Clock3,
  Globe2,
  MessageCircle,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import "./styles.css";

const brand = {
  ink: "#17201f",
  green: "#0f8f78",
  mint: "#cceee7",
  cream: "#f7faf8",
  blue: "#2f6fed",
  coral: "#ff7a66",
  gold: "#f2b84b"
};

const scenes = [
  {start: 0, end: 88, kicker: "Meet Harlo", title: "Your website's calm, capable AI concierge"},
  {start: 88, end: 174, kicker: "Trained on your business", title: "Answers from pages, docs, and policies"},
  {start: 174, end: 264, kicker: "Works while you work", title: "Qualifies leads and routes urgent moments"},
  {start: 264, end: 360, kicker: "Launch fast", title: "Install once. Improve every conversation."}
];

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

const appear = (frame: number, from: number, duration = 24) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

const slideY = (frame: number, from: number, distance = 40) =>
  interpolate(appear(frame, from), [0, 1], [distance, 0]);

const progress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

export const HarloMarketingVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="harlo-video">
      <Background />
      <Sequence from={0} durationInFrames={88}>
        <HeroScene />
      </Sequence>
      <Sequence from={88} durationInFrames={86}>
        <KnowledgeScene />
      </Sequence>
      <Sequence from={174} durationInFrames={90}>
        <LeadScene />
      </Sequence>
      <Sequence from={264} durationInFrames={96}>
        <FinalScene />
      </Sequence>
      <SceneRail activeFrame={frame} />
    </AbsoluteFill>
  );
};

const Background = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 360], [0, -90]);

  return (
    <AbsoluteFill className="background">
      <div className="mesh mesh-one" style={{transform: `translate3d(${drift}px, ${drift * 0.25}px, 0)`}} />
      <div className="mesh mesh-two" style={{transform: `translate3d(${-drift * 0.45}px, ${drift * 0.2}px, 0)`}} />
      <div className="grid" />
      <div className="texture" />
    </AbsoluteFill>
  );
};

const BrandLockup = ({compact = false}: {compact?: boolean}) => (
  <div className={compact ? "brand-lockup compact" : "brand-lockup"}>
    <div className="brand-mark">
      <Sparkles size={compact ? 24 : 30} strokeWidth={2.4} />
    </div>
    <div>
      <div className="brand-name">Harlo</div>
      {!compact && <div className="brand-subtitle">AI chatbot for business websites</div>}
    </div>
  </div>
);

const HeroScene = () => {
  const frame = useCurrentFrame();
  const titleIn = appear(frame, 8);
  const phoneIn = spring({frame: frame - 14, fps: 30, config: {damping: 18, stiffness: 90}});
  const cursor = progress(frame, 46, 70);

  return (
    <AbsoluteFill className="scene hero-scene">
      <div className="copy hero-copy" style={{opacity: titleIn, transform: `translateY(${slideY(frame, 8, 52)}px)`}}>
        <BrandLockup />
        <h1>Turn visitors into customers before they leave.</h1>
        <p>Harlo learns your site, answers instantly, captures intent, and hands your team the clean context.</p>
        <div className="hero-pills">
          <span><Zap size={22} /> Live in minutes</span>
          <span><ShieldCheck size={22} /> On-brand answers</span>
        </div>
      </div>
      <div
        className="hero-device-wrap"
        style={{
          opacity: phoneIn,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [80, 0])}px) scale(${interpolate(phoneIn, [0, 1], [0.94, 1])})`
        }}
      >
        <DashboardMockup />
        <div
          className="cursor"
          style={{
            left: `${interpolate(cursor, [0, 1], [78, 66])}%`,
            top: `${interpolate(cursor, [0, 1], [71, 53])}%`,
            opacity: appear(frame, 42, 8)
          }}
        >
          <MousePointer2 size={34} fill={brand.ink} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const KnowledgeScene = () => {
  const frame = useCurrentFrame();
  const scan = progress(frame, 20, 74);

  return (
    <AbsoluteFill className="scene split-scene">
      <div className="copy" style={{opacity: appear(frame, 5), transform: `translateY(${slideY(frame, 5)}px)`}}>
        <SceneKicker icon={<Globe2 size={28} />} label="Business-aware" />
        <h2>Harlo studies the pages your customers already trust.</h2>
        <p>Pricing, FAQs, support policies, product docs, and custom instructions become a reliable answer layer.</p>
      </div>
      <div className="knowledge-board">
        {["Homepage", "Pricing", "Returns policy", "Product docs", "Help center"].map((item, index) => (
          <SourceCard key={item} label={item} delay={8 + index * 8} />
        ))}
        <div className="scan-line" style={{transform: `translateY(${interpolate(scan, [0, 1], [0, 510])}px)`}} />
        <div className="answer-card" style={{opacity: appear(frame, 58), transform: `translateY(${slideY(frame, 58, 32)}px)`}}>
          <div className="answer-label"><Bot size={22} /> Harlo answer</div>
          <p>"The Growth plan includes 5,000 AI conversations, custom brand voice, lead routing, and Slack alerts."</p>
          <div className="citation-row">
            <span>Sources</span>
            <b>Pricing</b>
            <b>Product docs</b>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LeadScene = () => {
  const frame = useCurrentFrame();
  const route = progress(frame, 40, 76);

  return (
    <AbsoluteFill className="scene lead-scene">
      <div className="chat-panel" style={{opacity: appear(frame, 4), transform: `translateX(${interpolate(appear(frame, 4), [0, 1], [-60, 0])}px)`}}>
        <ChatBubble who="Visitor" text="Do you support multi-location service teams?" delay={12} />
        <ChatBubble who="Harlo" text="Yes. Harlo can route by location, service line, and urgency." delay={28} accent />
        <ChatBubble who="Visitor" text="Great. Can someone call me this afternoon?" delay={48} />
        <ChatBubble who="Harlo" text="I can help with that. What area are you in?" delay={62} accent />
      </div>
      <div className="copy lead-copy" style={{opacity: appear(frame, 10), transform: `translateY(${slideY(frame, 10)}px)`}}>
        <SceneKicker icon={<MessageCircle size={28} />} label="Lead capture" />
        <h2>Every conversation becomes useful customer context.</h2>
        <p>Harlo tags intent, collects the right details, and sends high-value moments to the team that can act.</p>
        <div className="routing-card">
          <div className="route-head">
            <Clock3 size={24} />
            <span>Priority lead</span>
            <strong>92%</strong>
          </div>
          <div className="route-track">
            <div className="route-fill" style={{width: `${route * 100}%`}} />
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
  const {fps} = useVideoConfig();
  const pulse = spring({frame: frame - 36, fps, config: {damping: 8, stiffness: 80}});

  return (
    <AbsoluteFill className="scene final-scene">
      <div className="final-shell">
        <div className="final-main" style={{opacity: appear(frame, 6), transform: `translateY(${slideY(frame, 6, 46)}px)`}}>
          <BrandLockup compact />
          <h2>Launch a better first conversation.</h2>
          <p>Train Harlo on your business, add the widget to your site, and start turning intent into booked revenue.</p>
          <div className="cta-row">
            <span className="primary-cta">Book a demo</span>
            <span className="secondary-cta">See Harlo in action</span>
          </div>
        </div>
        <div className="metrics-stack">
          <MetricCard icon={<MessageCircle />} label="Conversations handled" value="2,418" delay={18} />
          <MetricCard icon={<BarChart3 />} label="Qualified leads" value="+38%" delay={28} />
          <MetricCard icon={<Check />} label="Avg. response time" value="1.3s" delay={38} />
        </div>
        <div
          className="launch-ring"
          style={{
            opacity: appear(frame, 34),
            transform: `scale(${interpolate(pulse, [0, 1], [0.78, 1])})`
          }}
        >
          <Sparkles size={58} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneRail = ({activeFrame}: {activeFrame: number}) => {
  return (
    <div className="scene-rail">
      {scenes.map((scene, index) => {
        const active = activeFrame >= scene.start && activeFrame < scene.end;
        const fill = progress(activeFrame, scene.start, scene.end);

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
};

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
        <aside>
          <BrandLockup compact />
          <nav>
            <b>Inbox</b>
            <b>Knowledge</b>
            <b>Leads</b>
            <b>Insights</b>
          </nav>
        </aside>
        <main>
          <div className="topline">
            <div>
              <span>Live site assistant</span>
              <h3>Ready for visitors</h3>
            </div>
            <div className="status"><span /> Online</div>
          </div>
          <div className="dashboard-grid">
            <div className="site-card">
              <Img src={staticFile("harlo-site-preview.svg")} />
              <div className="chat-widget" style={{transform: `translateY(${Math.sin(frame / 9) * 4}px)`}}>
                <div className="widget-head"><Bot size={20} /> Ask Harlo</div>
                <p>How can I help with pricing, services, or booking?</p>
              </div>
            </div>
            <div className="activity-card">
              <h4>Today</h4>
              {["FAQ answered", "Lead captured", "Demo routed"].map((item, i) => (
                <div className="activity-row" key={item}>
                  <span style={{background: [brand.green, brand.blue, brand.coral][i]}} />
                  <b>{item}</b>
                  <em>{["24", "9", "3"][i]}</em>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SourceCard = ({label, delay}: {label: string; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 16);

  return (
    <div className="source-card" style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [28, 0])}px)`}}>
      <div className="source-icon"><Globe2 size={22} /></div>
      <div>
        <strong>{label}</strong>
        <span>{Math.round(visible * 100)}% indexed</span>
      </div>
      <Check size={22} />
    </div>
  );
};

const ChatBubble = ({who, text, delay, accent = false}: {who: string; text: string; delay: number; accent?: boolean}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 14);

  return (
    <div className={accent ? "chat-bubble accent" : "chat-bubble"} style={{opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [26, 0])}px)`}}>
      <span>{who}</span>
      <p>{text}</p>
    </div>
  );
};

const SceneKicker = ({icon, label}: {icon: React.ReactNode; label: string}) => (
  <div className="scene-kicker">
    {icon}
    <span>{label}</span>
  </div>
);

const MetricCard = ({icon, label, value, delay}: {icon: React.ReactNode; label: string; value: string; delay: number}) => {
  const frame = useCurrentFrame();
  const visible = appear(frame, delay, 18);

  return (
    <div className="metric-card" style={{opacity: visible, transform: `translateX(${interpolate(visible, [0, 1], [46, 0])}px)`}}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};
