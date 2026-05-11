import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { FlowStep } from "@/components/po/ProcessFlow";
import {
  DUMMY_EMAILS,
  DummyEmail,
  LogEntry,
  PO_DROP_FOLDER,
  isPOFilename,
  isPORelatedEmail,
  processEmail,
} from "@/lib/poAgent";

interface DashboardState {
  logs: LogEntry[];
  activeEmailId: string | null;
  steps: FlowStep[];
  running: boolean;
  processedIds: Set<string>;
}

interface DashboardContextValue extends DashboardState {
  activeEmail: DummyEmail | null;
  stats: {
    dropped: number;
    invalid: number;
    notPo: number;
    noAtt: number;
    failed: number;
    invalidLayout: number;
    virusDetected: number;
  };
  totalProcessed: number;
  issueCount: number;
  successRate: number;
  runOne: (email: DummyEmail) => Promise<void>;
  runAll: () => Promise<void>;
  reset: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const activeEmail = useMemo(
    () => DUMMY_EMAILS.find((e) => e.id === activeEmailId) ?? null,
    [activeEmailId]
  );

  const stats = useMemo(() => {
    const counts = {
      dropped: 0,
      invalid: 0,
      notPo: 0,
      noAtt: 0,
      failed: 0,
      invalidLayout: 0,
      virusDetected: 0,
    };

    for (const l of logs) {
      if (l.status === "PO Dropped") counts.dropped++;
      else if (l.status === "Rejected - Invalid Name") counts.invalid++;
      else if (l.status === "Rejected - Not PO Email") counts.notPo++;
      else if (l.status === "No Attachment") counts.noAtt++;
      else if (l.status === "Failed") counts.failed++;
      else if (l.status === "Rejected - Invalid PO Layout") counts.invalidLayout++;
      else if (l.status === "Rejected - Virus Detected") counts.virusDetected++;
    }

    return counts;
  }, [logs]);

  const totalProcessed = logs.length;
  const issueCount =
    stats.invalid +
    stats.notPo +
    stats.invalidLayout +
    stats.virusDetected +
    stats.noAtt +
    stats.failed;
  const successRate = totalProcessed
    ? Math.round((stats.dropped / totalProcessed) * 100)
    : 0;

  async function runOne(email: DummyEmail) {
    if (running) return;

    setRunning(true);
    setActiveEmailId(email.id);

    const flow: FlowStep[] = [
      { key: "received", label: "Email received", state: "active" },
      { key: "att", label: "Check for attachments", state: "pending" },
      {
        key: "virus",
        label: "Scan attachments for viruses",
        state: "pending",
      },
      {
        key: "name",
        label: "Validate Paltrack filename POxxxyyy.zzz",
        state: "pending",
      },
      {
        key: "ctx",
        label: "Validate receiver is Mates@goglobal.group",
        state: "pending",
      },
      {
        key: "layout",
        label: "Validate Paltrack PO layout",
        state: "pending",
      },
      {
        key: "save",
        label: `Save to ${PO_DROP_FOLDER}`,
        state: "pending",
      },
      {
        key: "mark",
        label: "Mark as PO Dropped + log",
        state: "pending",
      },
    ];

    setSteps([...flow]);
    await sleep(400);

    flow[0].state = "done";
    flow[1].state = "active";
    flow[1].detail = `${email.attachments.length} attachment(s) found`;

    setSteps([...flow]);
    await sleep(500);

    if (email.attachments.length === 0) {
      flow[1].state = "done";

      setSteps([...flow]);

      const res = await processEmail(email);

      setLogs((prev) => [...res.logs, ...prev]);
      setRunning(false);
      return;
    }

    flow[1].state = "done";
    flow[2].state = "active";
    flow[2].detail = "Scanning attachments for viruses";

    setSteps([...flow]);
    await sleep(500);

    const res = await processEmail(email);
    const hasVirus = res.logs.some((l) => l.status === "Rejected - Virus Detected");

    if (hasVirus) {
      flow[2].state = "error";
      flow[2].detail = "Virus detected in attachment";

      setSteps([...flow]);
      setLogs((prev) => [...res.logs, ...prev]);
      setProcessedIds((s) => new Set(s).add(email.id));

      toast.error("Rejected - Virus Detected");
      setRunning(false);
      return;
    }

    flow[2].state = "done";
    flow[3].state = "active";

    setSteps([...flow]);
    await sleep(500);

    const validNames = email.attachments.filter((a) => isPOFilename(a.name));
    flow[3].detail = `${validNames.length}/${email.attachments.length} valid filename(s)`;

    if (validNames.length === 0) {
      flow[3].state = "error";

      setSteps([...flow]);

      const res2 = await processEmail(email);
      setLogs((prev) => [...res2.logs, ...prev]);
      setProcessedIds((s) => new Set(s).add(email.id));

      toast.error("Rejected - Invalid Name");
      setRunning(false);
      return;
    }

    flow[3].state = "done";
    flow[4].state = "active";

    setSteps([...flow]);

    await sleep(500);

    if (!isPORelatedEmail(email)) {
      flow[4].state = "error";
      flow[4].detail = "Receiver is not Mates@goglobal.group";

      setSteps([...flow]);

      const res2 = await processEmail(email);
      setLogs((prev) => [...res2.logs, ...prev]);
      setProcessedIds((s) => new Set(s).add(email.id));

      toast.error("Rejected - Not PO Email");
      setRunning(false);
      return;
    }

    flow[4].state = "done";
    flow[4].detail = "Receiver validated";

    flow[5].state = "active";
    flow[5].detail = "Checking BH, OH, OP, and BT records";

    setSteps([...flow]);
    await sleep(600);

    const invalidLayout = res.logs.some(
      (l) => l.status === "Rejected - Invalid PO Layout"
    );

    if (invalidLayout) {
      flow[5].state = "error";
      flow[5].detail = "Invalid Paltrack PO file layout";

      setSteps([...flow]);
      setLogs((prev) => [...res.logs, ...prev]);
      setProcessedIds((s) => new Set(s).add(email.id));

      toast.error("Rejected - Invalid PO Layout");
      setRunning(false);
      return;
    }

    flow[5].state = "done";
    flow[5].detail = "Paltrack layout validated";
    flow[6].state = "active";
    flow[6].detail = `Saving ${validNames.length} file(s)`;

    setSteps([...flow]);
    await sleep(500);

    flow[6].state = "done";
    flow[7].state = "active";

    setSteps([...flow]);
    await sleep(300);

    flow[7].state = "done";
    setSteps([...flow]);

    const finalResult = await processEmail(email);
    setLogs((prev) => [...finalResult.logs, ...prev]);
    setProcessedIds((s) => new Set(s).add(email.id));
    setRunning(false);
  }

  async function runAll() {
    if (running) return;

    for (const email of DUMMY_EMAILS) {
      if (processedIds.has(email.id)) continue;
      await runOne(email);
      await sleep(300);
    }
  }

  function reset() {
    setLogs([]);
    setActiveEmailId(null);
    setSteps([]);
    setProcessedIds(new Set());
  }

  return (
    <DashboardContext.Provider
      value={{
        logs,
        activeEmailId,
        steps,
        running,
        processedIds,
        activeEmail,
        stats,
        totalProcessed,
        issueCount,
        successRate,
        runOne,
        runAll,
        reset,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
