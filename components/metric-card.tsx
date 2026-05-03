import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, delta, icon: Icon }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-harlo-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-harlo-ink">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-harlo-teal">{delta}</p>
    </Card>
  );
}
