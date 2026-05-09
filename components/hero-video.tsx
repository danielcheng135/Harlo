"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroVideoProps = {
  className?: string;
};

export function HeroVideo({ className }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

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
  }, []);

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
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/70 bg-harlo-ink shadow-[0_32px_80px_rgba(17,24,39,0.18)] sm:rounded-[22px]",
        className
      )}
    >
      <video
        ref={videoRef}
        aria-label="Harlo product overview video"
        className="aspect-video w-full bg-white object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/harlo-site-preview.svg"
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          setProgress(video?.duration ? video.currentTime / video.duration : 0);
        }}
      >
        <source src="/harlo-marketing.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        aria-label={isPlaying ? "Pause Harlo overview video" : "Play Harlo overview video"}
        onClick={togglePlayback}
        className="absolute bottom-3 left-3 grid h-12 w-12 place-items-center rounded-full bg-white text-harlo-ink shadow-[0_12px_28px_rgba(17,24,39,0.22)] transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-harlo-ink sm:bottom-5 sm:left-5 sm:h-14 sm:w-14"
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
  );
}
