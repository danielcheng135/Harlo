"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

export type ToastMessage = {
  id: number;
  tone: "success" | "error";
  message: string;
};

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(tone: ToastMessage["tone"], message: string) {
    setToast({
      id: Date.now(),
      tone,
      message
    });
  }

  return {
    toast,
    showToast,
    dismissToast: () => setToast(null)
  };
}

export function ToastViewport({
  toast,
  onDismiss
}: {
  toast: ToastMessage | null;
  onDismiss: () => void;
}) {
  const [visibleToast, setVisibleToast] = useState<ToastMessage | null>(toast);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsExiting(true);
      return;
    }

    setVisibleToast(toast);
    setIsExiting(true);
    const frame = window.requestAnimationFrame(() => setIsExiting(false));

    return () => window.cancelAnimationFrame(frame);
  }, [toast]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(onDismiss, 3600);

    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  useEffect(() => {
    if (!isExiting) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleToast(null);
      setIsExiting(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [isExiting]);

  if (!visibleToast) {
    return null;
  }

  const Icon = visibleToast.tone === "success" ? CheckCircle2 : TriangleAlert;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] w-[min(360px,calc(100vw-40px))] transition duration-200 ease-out ${
        isExiting ? "translate-x-6 opacity-0" : "translate-x-0 opacity-100"
      }`}
      role={visibleToast.tone === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3 rounded-lg border border-harlo-line bg-white p-4 text-sm text-harlo-ink shadow-soft">
        <span className={visibleToast.tone === "success" ? "text-harlo-teal" : "text-red-600"}>
          <Icon size={18} />
        </span>
        <p className="flex-1 leading-5">{visibleToast.message}</p>
        <button type="button" onClick={onDismiss} className="text-harlo-muted transition hover:text-harlo-ink" aria-label="Dismiss notification">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
