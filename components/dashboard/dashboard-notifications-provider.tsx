"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type {
  DashboardNotificationCounts,
  DashboardNotificationSection
} from "@/lib/dashboard/notifications";

type DashboardNotificationsContextValue = {
  counts: DashboardNotificationCounts;
  markItemRead: (section: DashboardNotificationSection, itemId: string) => void;
};

const DashboardNotificationsContext = createContext<DashboardNotificationsContextValue | null>(null);

export function DashboardNotificationsProvider({
  children,
  initialCounts
}: {
  children: ReactNode;
  initialCounts: DashboardNotificationCounts;
}) {
  const [counts, setCounts] = useState(initialCounts);

  const refreshCounts = useCallback(async () => {
    const response = await fetch("/api/dashboard/notifications", {
      cache: "no-store"
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as { counts?: DashboardNotificationCounts };

    if (payload.counts) {
      setCounts(payload.counts);
    }
  }, []);

  const markItemRead = useCallback((section: DashboardNotificationSection, itemId: string) => {
    setCounts((current) => ({
      ...current,
      [section]: Math.max(0, current[section] - 1)
    }));

    void fetch("/api/dashboard/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ section, itemId })
    })
      .then((response) => {
        if (!response.ok) {
          void refreshCounts();
        }
      })
      .catch(() => {
        void refreshCounts();
      });
  }, [refreshCounts]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshCounts();
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCounts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCounts]);

  const value = useMemo(() => ({ counts, markItemRead }), [counts, markItemRead]);

  return (
    <DashboardNotificationsContext.Provider value={value}>
      {children}
    </DashboardNotificationsContext.Provider>
  );
}

export function useDashboardNotifications() {
  return useContext(DashboardNotificationsContext);
}
