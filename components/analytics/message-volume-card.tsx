"use client";

import { useMemo, useState } from "react";
import { MessageVolumeLineChart, type MessageVolumePoint } from "@/components/analytics/message-volume-line-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 14 days", value: "14" },
  { label: "Last 30 days", value: "30" }
];

type MessageVolumeCardProps = {
  data: MessageVolumePoint[];
  chartClassName?: string;
};

export function MessageVolumeCard({ data, chartClassName }: MessageVolumeCardProps) {
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

        <Select
          name="message-volume-range"
          value={String(range)}
          onValueChange={(value) => setRange(Number(value))}
          options={RANGE_OPTIONS}
          className="w-44"
        />
      </CardHeader>
      <CardBody>
        <MessageVolumeLineChart data={visibleData} className={chartClassName} />
      </CardBody>
    </Card>
  );
}
