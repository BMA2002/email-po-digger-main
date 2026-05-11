import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Inbox,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessFlow } from "@/components/po/ProcessFlow";
import { StatusBadge } from "@/components/po/StatusBadge";
import { StatCard } from "@/components/po/StatCard";
import { useDashboard } from "@/lib/dashboard-context";
import { DUMMY_EMAILS } from "@/lib/poAgent";

const Dashboard = () => {
  const {
    logs,
    stats,
    totalProcessed,
    successRate,
    issueCount,
    processedIds,
    steps,
    running,
  } = useDashboard();

  const pendingCount = Math.max(0, DUMMY_EMAILS.length - processedIds.size);
  const latestEvent = logs[0];
  const recentEvents = logs.slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground font-semibold">
              PO dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Purchase order pipeline overview
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Executive-grade monitoring for PO email ingestion, exception volume, and pipeline reliability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm">
                Back to inbox
              </Button>
            </Link>
            <Button variant="secondary" size="sm" disabled>
              Live status
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
        <section className="grid gap-4 xl:grid-cols-[1.85fr_1.15fr]">
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg shadow-slate-950/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
                  Executive summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  PO pipeline performance at a glance
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                {pendingCount} emails pending
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Processed" value={totalProcessed} icon={Inbox} tone="primary" />
              <StatCard label="Success rate" value={`${successRate}%`} icon={CheckCircle2} tone="success" />
              <StatCard label="Issues" value={issueCount} icon={XCircle} tone="destructive" />
              <StatCard label="Pending" value={pendingCount} icon={TrendingUp} tone="warning" />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg shadow-slate-950/10">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
                Operational health
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                Pipeline readiness
              </h3>

              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl border border-border bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active pipeline</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {running ? "Processing now" : latestEvent ? latestEvent.status : "No activity yet"}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Recent alert</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {latestEvent?.reason ?? "No critical alerts"}
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg shadow-slate-950/10">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
                Guidance
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                Recommended next steps
              </h3>

              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-muted/70 p-4">
                  <p className="font-semibold text-foreground">Review exceptions</p>
                  <p className="mt-2 leading-6">
                    Prioritize invalid layout and non-Mates email rejections to improve ingestion accuracy.
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/70 p-4">
                  <p className="font-semibold text-foreground">Maintain throughput</p>
                  <p className="mt-2 leading-6">
                    Run the inbox processor regularly and clear exceptions to keep the pipeline healthy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg shadow-slate-950/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                  Current pipeline
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
                  PO ingestion workflow
                </h3>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {running ? "Running" : steps.length ? "Idle" : "Ready"}
              </span>
            </div>

            <div className="mt-5">
              {steps.length ? (
                <ProcessFlow steps={steps} />
              ) : (
                <div className="rounded-3xl border border-border bg-muted/70 p-6 text-sm text-muted-foreground">
                  No pipeline run has started yet. Run the inbox simulation to begin tracking activity here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg shadow-slate-950/10">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                Recent activity
              </p>
              <h3 className="text-lg font-semibold text-foreground">Latest processed emails</h3>
            </div>

            <div className="mt-4 h-[360px] rounded-3xl border border-border bg-background/80">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader className="bg-background border-b border-border sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[26%]">Time</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEvents.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-sm">{entry.sender}</TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
