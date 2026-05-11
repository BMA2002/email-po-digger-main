import {
  AlertCircle,
  Ban,
  CheckCircle2,
  FileX,
  HelpCircle,
  Inbox,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type StatusBadgeProps = {
  status?: string | null;
};

type StatusConfig = {
  icon: LucideIcon;
  label: string;
  className: string;
};

const statusConfig: Record<string, StatusConfig> = {
  "PO Dropped": {
    icon: CheckCircle2,
    label: "PO Dropped",
    className: "bg-green-100 text-green-800 border border-green-200",
  },

  "Rejected - Invalid Name": {
    icon: FileX,
    label: "Invalid Name",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },

  "Rejected - Not PO Email": {
    icon: Ban,
    label: "Not PO Email",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
  },

  "Rejected - Disallowed File Type": {
    icon: XCircle,
    label: "Disallowed File",
    className: "bg-red-100 text-red-800 border border-red-200",
  },

  "Rejected - Invalid PO Layout": {
    icon: XCircle,
    label: "Invalid PO Layout",
    className: "bg-red-100 text-red-800 border border-red-200",
  },

  "No Attachments": {
    icon: Inbox,
    label: "No Attachment",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },

  Failed: {
    icon: AlertCircle,
    label: "Failed",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

const fallbackConfig: StatusConfig = {
  icon: HelpCircle,
  label: "Infected file",
  className: "bg-gray-100 text-gray-700 border border-gray-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = String(status ?? "").trim();
  const config = statusConfig[normalized] ?? fallbackConfig;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}
      title={normalized || "Unknown"}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}