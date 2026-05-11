import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  FolderDown,
  Mail,
  Paperclip,
  Play,
  RefreshCw,
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

import { StatusBadge } from "@/components/po/StatusBadge";
import { ProcessFlow } from "@/components/po/ProcessFlow";

import { DUMMY_EMAILS, PO_DROP_FOLDER, isPOFilename } from "@/lib/poAgent";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
    logs,
    activeEmail,
    steps,
    running,
    processedIds,
    runOne,
    runAll,
    reset,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="container py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground font-semibold">
              Inbox
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              PO Email Processor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Process incoming PO emails and review ingestion status using a dedicated inbox page.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard">
              <Button asChild variant="outline" size="sm" disabled={running}>
                <span>Open dashboard</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={reset} disabled={running}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={runAll}
              disabled={running}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Play className="h-4 w-4 mr-2" />
              {running ? "Running…" : "Run agent on inbox"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Outlook Inbox simulated</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {DUMMY_EMAILS.length} emails · {processedIds.size} processed
              </span>
            </div>

            <ScrollArea className="h-[420px]">
              <ul className="divide-y divide-border">
                {DUMMY_EMAILS.map((email) => {
                  const isActive = activeEmail?.id === email.id;
                  const isDone = processedIds.has(email.id);

                  return (
                    <li
                      key={email.id}
                      className={cn(
                        "p-4 transition-colors",
                        isActive && "bg-primary/5",
                        isDone && !isActive && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{email.sender}</p>
                            {isDone && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">To: {email.to}</p>
                          <p className="text-sm text-foreground/90 truncate mt-0.5">{email.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{email.body}</p>
                          {email.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {email.attachments.map((a) => (
                                <span
                                  key={a.name}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-mono",
                                    isPOFilename(a.name)
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : "border-border bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isDone ? "outline" : "secondary"}
                          disabled={running}
                          onClick={() => runOne(email)}
                        >
                          {isDone ? "Re-run" : "Process"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Agent process flow</h2>
            </div>
            {activeEmail ? (
              <>
                <div className="rounded-lg border border-border bg-muted/40 p-3 mb-4">
                  <p className="text-xs text-muted-foreground">Currently processing</p>
                  <p className="text-sm font-medium truncate">{activeEmail.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">from {activeEmail.sender}</p>
                  <p className="text-xs text-muted-foreground truncate">to {activeEmail.to}</p>
                </div>
                <ProcessFlow steps={steps} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                <FolderDown className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Run the agent to see the live flow</p>
                <p className="text-xs mt-1">
                  Drop folder:
                  <code className="font-mono text-foreground/70 ml-1">{PO_DROP_FOLDER}</code>
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-background">
            <h2 className="font-semibold">Tracking log</h2>
            <span className="text-xs text-muted-foreground">{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No entries yet. Click <span className="text-foreground">Run agent on inbox</span> to start.
            </div>
          ) : (
            <ScrollArea className="h-[460px] w-full">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background border-b border-border">
                  <TableRow>
                    <TableHead className="w-[170px]">Time</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id} className="animate-fade-in-up">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-xs">{l.sender}</TableCell>
                      <TableCell className="text-xs max-w-[220px] truncate">{l.subject}</TableCell>
                      <TableCell className="font-mono text-xs">{l.fileName ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{l.destinationFolder ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px]">{l.reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
