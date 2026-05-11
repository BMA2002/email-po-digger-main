import { Link } from "react-router-dom";
import { CheckCircle2, Inbox, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/po/StatCard";
import { useDashboard } from "@/lib/dashboard-context";

const Dashboard = () => {
  const {
    stats,
    totalProcessed,
    successRate,
    issueCount,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground font-semibold">
              High-level overview
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              PO pipeline dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-sm">
              Monitor inbound purchase order ingestion health, exception volume, and process reliability across the inbox.
            </p>
          </div>

          <Link to="/" className="self-start md:self-auto">
            <Button asChild variant="outline" size="sm">
              <span>Back to inbox</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 md:px-8">
        <section className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg shadow-slate-950/10 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:items-center">
            <div className="space-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                  Summary
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Overall pipeline health
                </h2>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                PO intake metrics and exception volume in a clean, executive overview.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Processed emails"
                value={totalProcessed}
                icon={Inbox}
                tone="primary"
              />
              <StatCard
                label="Success rate"
                value={`${successRate}%`}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Issues flagged"
                value={issueCount}
                icon={XCircle}
                tone="destructive"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 grid-cols-1 xl:grid-cols-[1.5fr_0.95fr]">
          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-lg shadow-slate-950/10 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                  Status breakdown
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                  Exception volume by category
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Live
              </span>
            </div>

            <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="PO Dropped"
                value={stats.dropped}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Invalid Name"
                value={stats.invalid}
                icon={XCircle}
                tone="destructive"
              />
              <StatCard
                label="Not Mates"
                value={stats.notPo}
                icon={XCircle}
                tone="warning"
              />
              <StatCard
                label="Invalid Layout"
                value={stats.invalidLayout}
                icon={XCircle}
                tone="destructive"
              />
              <StatCard
                label="Infected File"
                value={stats.virusDetected}
                icon={XCircle}
                tone="destructive"
              />
              <StatCard
                label="No Attachment"
                value={stats.noAtt}
                icon={Inbox}
              />
              <StatCard
                label="Failed"
                value={stats.failed}
                icon={XCircle}
                tone="destructive"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-lg shadow-slate-950/10 sm:p-5">
            <div className="pb-3 border-b border-border">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                Insights
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                What this means
              </h3>
            </div>

            <div className="mt-3 space-y-3 text-xs text-muted-foreground sm:text-sm">
              <div className="rounded-2xl bg-muted/70 p-3">
                <p className="font-medium text-foreground text-xs">Pipeline stability</p>
                <p className="mt-1 leading-5">
                  High success rate and low issue volume means steady PO intake flow.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/70 p-3">
                <p className="font-medium text-foreground text-xs">Review focus</p>
                <p className="mt-1 leading-5">
                  Monitor rejected attachments and invalid layout errors.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/70 p-3">
                <p className="font-medium text-foreground text-xs">Next action</p>
                <p className="mt-1 leading-5">
                  Use the inbox page to process emails and keep metrics updated in real time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
