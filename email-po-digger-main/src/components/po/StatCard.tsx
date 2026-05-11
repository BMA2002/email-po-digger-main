import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "success" | "destructive" | "warning" | "primary";
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
  primary: "text-primary",
};

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-slate-950/80 p-5 shadow-xl shadow-slate-950/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="relative min-h-[120px] flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground font-semibold">
            {label}
          </p>
          <p className={cn("mt-3 text-3xl font-semibold leading-tight tabular-nums sm:text-4xl", toneMap[tone])}>
            {value}
          </p>
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950/10 shadow-inner",
          toneMap[tone]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}