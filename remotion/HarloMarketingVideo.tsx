import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame
} from "remotion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  History,
  Inbox,
  MessageCircle,
  Route,
  Sparkles,
  UserRound,
  Zap
} from "lucide-react";
import "./styles.css";

const SCENE_FRAMES = 96;
const TOTAL_FRAMES = SCENE_FRAMES * 10;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const integrations = [
  { name: "Calendly", logo: "integrations/calendly.png", action: "Book meetings" },
  { name: "Cal.com", logo: "integrations/calcom.png", action: "Open scheduler" },
  { name: "Jobber", logo: "integrations/jobber.png", action: "Create requests" },
  { name: "Slack", logo: "integrations/slack.svg", action: "Alert the team" },
  { name: "HubSpot", logo: "integrations/hubspot.png", action: "Sync contacts" },
  { name: "Mailchimp", logo: "integrations/mailchimp.png", action: "Add audiences" },
  { name: "Google Sheets", logo: "integrations/google-sheets.svg", action: "Append lead rows" }
];

const reveal = (frame: number, start = 0, duration = 14) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease
  });

const sceneOpacity = (frame: number) =>
  Math.min(
    reveal(frame, 0, 10),
    interpolate(frame, [82, 94], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease
    })
  );

const enterStyle = (frame: number, start = 0, distance = 24) => {
  const progress = reveal(frame, start);
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`
  };
};

export const HarloMarketingVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="story-video">
      <StoryBackground />
      <StoryBrand />
      <Sequence durationInFrames={SCENE_FRAMES}><OpeningScene /></Sequence>
      <Sequence from={SCENE_FRAMES} durationInFrames={SCENE_FRAMES}><AnswerScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 2} durationInFrames={SCENE_FRAMES}><KnowledgeScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 3} durationInFrames={SCENE_FRAMES}><AgentScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 4} durationInFrames={SCENE_FRAMES}><LeadScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 5} durationInFrames={SCENE_FRAMES}><BookingScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 6} durationInFrames={SCENE_FRAMES}><IntegrationsScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 7} durationInFrames={SCENE_FRAMES}><InboxScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 8} durationInFrames={SCENE_FRAMES}><AnalyticsScene /></Sequence>
      <Sequence from={SCENE_FRAMES * 9} durationInFrames={SCENE_FRAMES}><OutcomeScene /></Sequence>
      <StoryProgress frame={frame} />
    </AbsoluteFill>
  );
};

function StoryBackground() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="story-background">
      <div
        className="story-grid"
        style={{ transform: `translateY(${interpolate(frame, [0, TOTAL_FRAMES], [0, 48])}px)` }}
      />
      <div className="story-light" />
    </AbsoluteFill>
  );
}

function StoryBrand() {
  return (
    <div className="story-brand">
      <span><Sparkles size={22} /></span>
      <strong>Harlo</strong>
    </div>
  );
}

function Scene({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className={`story-scene ${className}`} style={{ opacity: sceneOpacity(frame) }}>
      {children}
    </AbsoluteFill>
  );
}

function SceneHeading({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  const frame = useCurrentFrame();
  return (
    <div className="story-heading" style={enterStyle(frame, 4)}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{body}</span>
    </div>
  );
}

function OpeningScene() {
  const frame = useCurrentFrame();
  return (
    <Scene className="story-opening">
      <div className="story-opening-copy" style={enterStyle(frame, 4, 30)}>
        <p className="story-kicker">AI agent for websites</p>
        <h1>Turn more website traffic into action.</h1>
        <span>
          Harlo answers, qualifies, books, and routes every serious visitor.
        </span>
      </div>
      <div className="story-outcome-row">
        {[
          ["Instant answers", MessageCircle],
          ["Qualified leads", UserRound],
          ["Faster follow-up", Zap]
        ].map(([label, Icon], index) => (
          <div
            className="story-outcome-card"
            key={label as string}
            style={enterStyle(frame, 22 + index * 7)}
          >
            <Icon size={24} />
            <strong>{label as string}</strong>
          </div>
        ))}
      </div>
      <div className="story-flow-line" style={{ opacity: reveal(frame, 48) }}>
        Visitor <ArrowRight size={18} /> Harlo <ArrowRight size={18} /> Your team
      </div>
    </Scene>
  );
}

function AnswerScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="01 · Answer"
        title="Every question gets a useful response."
        body="Harlo responds from approved business knowledge and stays honest when information is missing."
      />
      <div className="story-chat-window" style={enterStyle(frame, 22)}>
        <WidgetHeader />
        <div className="story-chat-body">
          <div className="story-bubble visitor">Do you support multiple website agents?</div>
          <div className="story-bubble assistant" style={enterStyle(frame, 40, 14)}>
            Yes. Growth and Pro can add agents with separate knowledge, behavior, and page routing.
          </div>
          <div className="story-grounded-row" style={{ opacity: reveal(frame, 58) }}>
            <CheckCircle2 size={17} /> Answered from Pricing and Agent setup
          </div>
        </div>
      </div>
    </Scene>
  );
}

function KnowledgeScene() {
  const frame = useCurrentFrame();
  const sources = [
    ["Website pages", Globe2],
    ["Uploaded documents", FileText],
    ["Manual knowledge", BookOpen]
  ] as const;

  return (
    <Scene>
      <SceneHeading
        eyebrow="02 · Knowledge"
        title="Keep every answer accurate and on brand."
        body="Build the agent from your site, documents, and business guidance, then retrain as the company changes."
      />
      <div className="story-knowledge-layout">
        <div className="story-source-stack">
          {sources.map(([label, Icon], index) => (
            <div className="story-source-card" key={label} style={enterStyle(frame, 22 + index * 6)}>
              <span><Icon size={22} /></span>
              <strong>{label}</strong>
              <Check size={18} />
            </div>
          ))}
        </div>
        <div className="story-knowledge-status" style={enterStyle(frame, 44)}>
          <Sparkles size={28} />
          <small>Knowledge status</small>
          <strong>Ready for visitors</strong>
          <p>Sources are processed, searchable, and available to the AI agent.</p>
          <div><i /> Auto-retrain enabled</div>
        </div>
      </div>
    </Scene>
  );
}

function AgentScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="03 · Build"
        title="Shape the agent around your business."
        body="Control its identity, tone, suggestions, lead questions, accent color, and where each agent appears."
      />
      <div className="story-agent-layout">
        <div className="story-agent-preview" style={enterStyle(frame, 22)}>
          <div className="story-agent-icon"><Bot size={30} /></div>
          <small>Website sales</small>
          <strong>Harlo AI Agent</strong>
          <div className="story-agent-tags">
            <span>Helpful tone</span><span>Lead capture</span><span>Booking</span>
          </div>
        </div>
        <div className="story-settings" style={enterStyle(frame, 34)}>
          <SettingRow label="Page routing" value="/pricing, /services" />
          <SettingRow label="Suggestions" value="4 active prompts" />
          <SettingRow label="Lead questions" value="Name, email, project" />
          <SettingRow label="Widget position" value="Bottom right" />
        </div>
      </div>
    </Scene>
  );
}

function LeadScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="04 · Qualify"
        title="Capture intent without interrupting the conversation."
        body="Harlo waits for real buying or contact intent, then asks only for the details your team needs."
      />
      <div className="story-lead-layout">
        <div className="story-lead-chat" style={enterStyle(frame, 22)}>
          <div className="story-bubble visitor">Can someone help me choose a plan?</div>
          <div className="story-bubble assistant">Of course. What is the best email for your team?</div>
          <div className="story-intent"><Zap size={16} /> Buying intent detected</div>
        </div>
        <ArrowRight className="story-middle-arrow" size={28} />
        <div className="story-lead-card" style={enterStyle(frame, 38)}>
          <small>New qualified lead</small>
          <strong>Alex Morgan</strong>
          <LeadRow label="Email" value="alex@northstar.co" />
          <LeadRow label="Interest" value="Growth vs. Pro" />
          <LeadRow label="Source" value="/pricing" />
        </div>
      </div>
    </Scene>
  );
}

function BookingScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="05 · Book"
        title="Move high-intent visitors straight to a meeting."
        body="When someone wants to schedule, Harlo offers the right connected event without losing the conversation."
      />
      <div className="story-booking-layout">
        <div className="story-booking-copy" style={enterStyle(frame, 22)}>
          <CalendarCheck size={34} />
          <small>Scheduling intent</small>
          <strong>“Can I book a demo?”</strong>
          <p>The visitor can choose a meeting type immediately.</p>
        </div>
        <div className="story-event-list">
          <EventRow frame={frame} start={30} logo="integrations/calendly.png" title="Product demo" meta="30 min · Calendly" />
          <EventRow frame={frame} start={40} logo="integrations/calcom.png" title="Quick consultation" meta="15 min · Cal.com" />
        </div>
      </div>
    </Scene>
  );
}

function IntegrationsScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="06 · Connect"
        title="Send the next step to the tools you already use."
        body="Harlo turns conversations into connected actions for scheduling, CRM, service operations, alerts, audiences, and spreadsheets."
      />
      <div className="story-integration-grid">
        {integrations.map((integration, index) => (
          <div
            className="story-integration-card"
            key={integration.name}
            style={enterStyle(frame, 20 + index * 4, 16)}
          >
            <span><Img src={staticFile(integration.logo)} /></span>
            <div>
              <strong>{integration.name}</strong>
              <small>{integration.action}</small>
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

function InboxScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="07 · Review"
        title="See every conversation and lead in one place."
        body="Your team gets the full transcript, visitor details, source page, and a clear review state."
      />
      <div className="story-inbox" style={enterStyle(frame, 22)}>
        <div className="story-inbox-list">
          <ConversationRow name="Alex Morgan" text="Asked about Growth vs. Pro" status="Needs review" active />
          <ConversationRow name="Maya Thompson" text="Booked a product demo" status="Resolved" />
          <ConversationRow name="Jordan Lee" text="Requested a service estimate" status="Needs review" />
        </div>
        <div className="story-inbox-detail">
          <div className="story-profile">
            <span><UserRound size={20} /></span>
            <div><small>Qualified lead</small><strong>Alex Morgan</strong></div>
          </div>
          <p>Interested in comparing Growth and Pro for a multi-site business.</p>
          <div className="story-detail-actions">
            <span><Inbox size={16} /> Needs review</span>
            <span><Check size={16} /> Mark resolved</span>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function AnalyticsScene() {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <SceneHeading
        eyebrow="08 · Improve"
        title="Know what visitors need and what Harlo did next."
        body="Track conversation volume, lead outcomes, knowledge gaps, connected actions, and failures that need attention."
      />
      <div className="story-analytics-layout">
        <div className="story-chart-card" style={enterStyle(frame, 22)}>
          <div className="story-card-title"><BarChart3 size={20} /> Message volume</div>
          <div className="story-bars">
            {[42, 58, 48, 72, 64, 88, 76].map((height, index) => (
              <i key={index} style={{ height: `${height}%`, opacity: reveal(frame, 30 + index * 4) }} />
            ))}
          </div>
          <div className="story-chart-labels"><span>Mon</span><span>Sun</span></div>
        </div>
        <div className="story-history-card" style={enterStyle(frame, 34)}>
          <div className="story-card-title"><History size={20} /> Action history</div>
          <HistoryRow logo="integrations/hubspot.png" title="HubSpot contact synced" status="Success" />
          <HistoryRow logo="integrations/slack.svg" title="Slack lead alert sent" status="Success" />
          <HistoryRow logo="integrations/google-sheets.svg" title="Lead row appended" status="Success" />
        </div>
      </div>
    </Scene>
  );
}

function OutcomeScene() {
  const frame = useCurrentFrame();
  return (
    <Scene className="story-final">
      <div className="story-final-copy" style={enterStyle(frame, 4, 30)}>
        <p className="story-kicker">The outcome</p>
        <h2>Fewer unanswered questions. More qualified conversations.</h2>
        <span>
          Harlo helps your business respond instantly, capture demand, and follow up while intent is still high.
        </span>
      </div>
      <div className="story-final-steps">
        {[
          ["Questions answered", MessageCircle],
          ["Leads captured", UserRound],
          ["Meetings booked", CalendarCheck],
          ["Team aligned", Route]
        ].map(([label, Icon], index) => (
          <div key={label as string} style={enterStyle(frame, 24 + index * 7)}>
            <span><Icon size={23} /></span>
            <strong>{label as string}</strong>
            {index < 3 && <ChevronRight size={18} />}
          </div>
        ))}
      </div>
      <div className="story-final-brand" style={enterStyle(frame, 58)}>
        <span><Sparkles size={28} /></span>
        <div><strong>Harlo</strong><small>AI agent for websites</small></div>
        <b>harloai.co</b>
      </div>
    </Scene>
  );
}

function WidgetHeader() {
  return (
    <div className="story-widget-head">
      <span><Sparkles size={15} /></span>
      <strong>Harlo AI Agent</strong>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="story-setting-row">
      <span>{label}</span><strong>{value}</strong><ChevronRight size={17} />
    </div>
  );
}

function LeadRow({ label, value }: { label: string; value: string }) {
  return <div className="story-lead-row"><span>{label}</span><strong>{value}</strong></div>;
}

function EventRow({
  frame,
  start,
  logo,
  title,
  meta
}: {
  frame: number;
  start: number;
  logo: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="story-event-row" style={enterStyle(frame, start, 16)}>
      <span><Img src={staticFile(logo)} /></span>
      <div><strong>{title}</strong><small>{meta}</small></div>
      <ChevronRight size={20} />
    </div>
  );
}

function ConversationRow({
  name,
  text,
  status,
  active = false
}: {
  name: string;
  text: string;
  status: string;
  active?: boolean;
}) {
  return (
    <div className={`story-conversation-row ${active ? "active" : ""}`}>
      <span><UserRound size={18} /></span>
      <div><strong>{name}</strong><small>{text}</small></div>
      <i>{status}</i>
    </div>
  );
}

function HistoryRow({
  logo,
  title,
  status
}: {
  logo: string;
  title: string;
  status: string;
}) {
  return (
    <div className="story-history-row">
      <span><Img src={staticFile(logo)} /></span>
      <strong>{title}</strong>
      <i><Check size={13} /> {status}</i>
    </div>
  );
}

function StoryProgress({ frame }: { frame: number }) {
  return (
    <div className="story-progress">
      <i
        style={{
          transform: `scaleX(${interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          })})`
        }}
      />
    </div>
  );
}
