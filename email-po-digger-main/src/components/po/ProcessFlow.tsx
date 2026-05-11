import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export interface FlowStep {
  key: string;
  label: string;
  state: "pending" | "active" | "done" | "error";
  detail?: string;
}

export function ProcessFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.key} className="flex gap-3 animate-fade-in-up">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                s.state === "done" && "border-success bg-success/15 text-success",
                s.state === "active" &&
                  "border-primary bg-primary/15 text-primary animate-pulse-glow",
                s.state === "error" &&
                  "border-destructive bg-destructive/15 text-destructive",
                s.state === "pending" && "border-border text-muted-foreground"
              )}
            >
              {s.state === "done" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : s.state === "active" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-px flex-1 mt-1",
                  s.state === "done" ? "bg-success/40" : "bg-border"
                )}
              />
            )}
          </div>
          <div className="pb-4">
            <p
              className={cn(
                "text-sm font-medium",
                s.state === "pending" && "text-muted-foreground",
                s.state === "error" && "text-destructive"
              )}
            >
              {s.label}
            </p>
            {s.detail && (
              <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}