"use client";

import { useMemo, useState } from "react";
import { MessageVolumeLineChart, type MessageVolumePoint } from "@/components/analytics/message-volume-line-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 14 days", value: 14 },
  { label: "Last 30 days", value: 30 }
];

type MessageVolumeCardProps = {
  data: MessageVolumePoint[];
};

export function MessageVolumeCard({ data }: MessageVolumeCardProps) {
  const [range, setRange] = useState(14);
  const visibleData = useMemo(() => data.slice(-range), [data, range]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-harlo-ink">Message volume</h2>
          <p className="mt-1 text-sm text-harlo-muted">
            Last {range} days across visitor and assistant messages.
          </p>
        </div>

        <label className="sr-only" htmlFor="message-volume-range">Message volume date range</label>
        <select
          id="message-volume-range"
          value={range}
          onChange={(event) => setRange(Number(event.target.value))}
          className="h-10 rounded-lg border border-harlo-line bg-white px-3 text-sm font-medium text-harlo-ink outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/20"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardBody>
        <MessageVolumeLineChart data={visibleData} />
      </CardBody>
    </Card>
  );
}
