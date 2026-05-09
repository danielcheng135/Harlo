"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const outcomes = [
  {
    label: "Support",
    title: "Instant answers to repeat questions",
    body: "Give visitors useful responses without pulling your team into every basic question.",
    video: "/landing/outcome-support.mp4"
  },
  {
    label: "Sales",
    title: "Qualified leads with conversation history",
    body: "Capture contact details, intent, and the chat context before anyone follows up.",
    video: "/landing/outcome-sales.mp4"
  },
  {
    label: "Operations",
    title: "Consistent website replies",
    body: "Keep answers grounded in approved pages, docs, policies, and workspace guidance.",
    video: "/landing/outcome-operations.mp4"
  },
  {
    label: "Routing",
    title: "Cleaner escalation when AI is not enough",
    body: "Hand off the right moments with the details your team needs to act quickly.",
    video: "/landing/outcome-routing.mp4"
  }
];

export function OutcomesSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const active = outcomes[activeIndex];

  useEffect(() => {
    let animationFrame = 0;

    const updateProgress = () => {
      const video = videoRef.current;

      if (video?.duration) {
        setProgress(video.currentTime / video.duration);
      }

      animationFrame = requestAnimationFrame(updateProgress);
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [activeIndex]);

  const togglePlayback = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const circumference = 2 * Math.PI * 25;

  return (
    <section className="border-y border-harlo-line bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <SectionBadge>Outcomes</SectionBadge>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">One assistant for the questions that slow teams down.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-harlo-muted">
            Harlo keeps website conversations useful from the first answer through lead capture, routing, and follow-up context.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-harlo-line bg-harlo-canvas p-3 shadow-sm sm:min-h-[360px] sm:p-4 md:p-6 lg:min-h-[430px]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div key={active.label} className="relative h-full overflow-hidden rounded-lg border border-harlo-line bg-white shadow-soft [animation:harloPriceSwap_360ms_ease-out_forwards]">
              <video
                ref={videoRef}
                aria-label={`${active.label} outcome preview video`}
                className="h-full min-h-[300px] w-full bg-white object-contain sm:min-h-[360px] lg:min-h-[430px] lg:object-cover"
                autoPlay={isPlaying}
                muted
                loop
                playsInline
                preload="metadata"
                poster="/harlo-site-preview.svg"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedData={(event) => {
                  if (!isPlaying) {
                    event.currentTarget.pause();
                  }
                }}
                onLoadedMetadata={() => {
                  const video = videoRef.current;
                  setProgress(video?.duration ? video.currentTime / video.duration : 0);
                }}
              >
                <source src={active.video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-harlo-ink/20" />
              <button
                type="button"
                aria-label={isPlaying ? "Pause outcome preview video" : "Play outcome preview video"}
                onClick={togglePlayback}
                className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-white text-harlo-ink shadow-[0_12px_28px_rgba(17,24,39,0.22)] transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-harlo-ink sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
              >
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                  <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(8, 127, 149, 0.18)" strokeWidth="3" />
                  <circle
                    cx="28"
                    cy="28"
                    r="25"
                    fill="none"
                    stroke="#087f95"
                    strokeLinecap="round"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                  />
                </svg>
                {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} className="ml-0.5" fill="currentColor" />}
              </button>
            </div>
          </div>

          <div className="grid content-start gap-2">
            {outcomes.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => setActiveIndex(index)}
                  className={`group flex w-full items-start gap-4 rounded-lg border p-4 text-left transition duration-300 ${
                    isActive
                      ? "border-harlo-teal bg-white shadow-sm"
                      : "border-transparent bg-slate-50/70 opacity-60 hover:border-harlo-line hover:bg-white hover:opacity-100"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition ${
                      isActive ? "bg-harlo-teal text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${isActive ? "text-harlo-teal" : "text-slate-500"}`}>{item.label}</span>
                    <span className={`mt-1 block font-semibold leading-6 ${isActive ? "text-harlo-ink" : "text-slate-500"}`}>{item.title}</span>
                    <span className={`grid transition-all duration-300 ease-out ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <span className="overflow-hidden">
                        <span className="block pt-2 text-sm leading-6 text-harlo-muted">{item.body}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1.5 text-sm font-semibold text-harlo-teal shadow-sm">
      <span className="h-2 w-2 rounded-full bg-harlo-blue" />
      {children}
    </span>
  );
}
