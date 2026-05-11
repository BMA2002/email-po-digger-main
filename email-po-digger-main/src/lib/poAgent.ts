export interface Attachment {

  name: string;
  type: string;
  sizeKb: number;
  content?: string;
}

export interface Email {
  id: string;
  sender: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  attachments: Attachment[];
  forceSaveFailure?: boolean;
  isRealEmail?: boolean;
}

/**
 * @deprecated Use Email instead. DummyEmail is kept for backwards compatibility.
 */
export type DummyEmail = Email;

export type POStatus =
  | "PO Dropped"
  | "Rejected - Invalid Name"
  | "Rejected - Not PO Email"
  | "Rejected - Disallowed File Type"
  | "Rejected - Invalid PO Layout"
  | "Rejected - Virus Detected"
  | "No Attachment"
  | "Failed";

export interface LogEntry {
  id: string;
  timestamp: string;
  sender: string;
  subject: string;
  fileName: string | null;
  destinationFolder: string | null;
  status: POStatus;
  reason?: string;
}

export const PO_DROP_FOLDER =
  "C:\\Users\\brenzill.mcmaster.GOSOLUTIONS\\Desktop\\TEST PO FILE AUTOMATION";

const MATES_RECEIVER = "mates@goglobal.group";

function getUniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const DUMMY_EMAILS: DummyEmail[] = [
  {
    id: "1",
    sender: "supplier@vendor.com",
    to: "Mates@goglobal.group",
    subject: "Paltrack PO dispatch file",
    body: "Please import attached PO file",
    receivedAt: new Date().toISOString(),
    attachments: [
      {
        name: "POABC001.TIL",
        type: "text/plain",
        sizeKb: 12,
        content: [
          "BHABC0000012024112208:00  Paltrack                      Version",
          "OHABC-000001TRUCK001",
          "OLABC-000001DP0812",
          "OCABC-0000010812",
          "OPABC-00000100001P",
          "BTABC0000010000006000010000100001000000000000001000000010",
        ].join("\n"),
      },
    ],
  },
  {
    id: "2",
    sender: "random@company.com",
    to: "someone@goglobal.group",
    subject: "Invoice attached",
    body: "Not sent to Mates mailbox",
    receivedAt: new Date().toISOString(),
    attachments: [
      {
        name: "POABC002.TIL",
        type: "text/plain",
        sizeKb: 8,
        content: [
          "BHABC0000022024112208:00",
          "OHABC-000002TRUCK001",
          "OPABC-00000200001P",
          "BTABC0000020000004000010000000000000000000000000000000000",
        ].join("\n"),
      },
    ],
  },
  {
    id: "3",
    sender: "ops@vendor.com",
    to: "Mates@goglobal.group",
    subject: "PO Request",
    body: "No attachment example",
    receivedAt: new Date().toISOString(),
    attachments: [],
  },
  {
    id: "4",
    sender: "security@test.com",
    to: "Mates@goglobal.group",
    subject: "PO for Mates",
    body: "Bad file type",
    receivedAt: new Date().toISOString(),
    attachments: [
      {
        name: "POABC003.exe",
        type: "application/octet-stream",
        sizeKb: 400,
      },
    ],
  },
  {
    id: "5",
    sender: "Virus@test.com",
    to: "Mates@goglobal.group",
    subject: "PO with Virus",
    body: "PO File Import",
    receivedAt: new Date().toISOString(),
    attachments: [
      {
        name: "POABC004.TIL",
        type: "text/plain",
        sizeKb: 10,
        content: "MALWARE detected in this file",
      },
    ],
  },
  {
    id: "6",
    sender: "badlayout@test.com",
    to: "Mates@goglobal.group",
    subject: "PO for Mates",
    body: "Invalid Paltrack layout",
    receivedAt: new Date().toISOString(),
    attachments: [
      {
        name: "POABC004.TIL",
        type: "text/plain",
        sizeKb: 10,
        content: "This is not a Paltrack PO transmission file",
      },
    ],
  },
  {
    id: "7",
    sender: "failure@test.com",
    to: "Mates@goglobal.group",
    subject: "PO for Mates",
    body: "Simulate save failure",
    receivedAt: new Date().toISOString(),
    forceSaveFailure: true,
    attachments: [
      {
        name: "POABC005.TIL",
        type: "text/plain",
        sizeKb: 10,
        content: [
          "BHABC0000052024112208:00",
          "OHABC-000005TRUCK001",
          "OPABC-00000500001P",
          "BTABC0000050000004000010000000000000000000000000000000000",
        ].join("\n"),
      },
    ],
  },
];

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase().trim() ?? "";
}

export function isPOFilename(name: string) {
  const clean = name.trim();

  // Paltrack Dispatch PO filename format:
  // POxxxyyy.zzz
  // xxx = source address
  // yyy = sequence number 000-999
  // zzz = destination address
  return /^PO[A-Za-z0-9]{3}[0-9]{3}\.[A-Za-z0-9]{1,10}$/i.test(clean);
}

export function isAllowedPOFileType(name: string) {
  return ["txt", "dat", "til"].includes(ext(name));
}

export function isPORelatedEmail(email: Email) {
  return email.to.toLowerCase().trim() === MATES_RECEIVER;
}

export function isValidPOFileContent(content?: string) {
  if (!content || !content.trim()) return false;

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length < 4) return false;

  const recordTypes = lines.map((line) => line.slice(0, 2).toUpperCase());

  const allowedRecordTypes = new Set(["BH", "OH", "OL", "OC", "OK", "OP", "BT"]);

  return (
    recordTypes[0] === "BH" &&
    recordTypes.includes("OH") &&
    recordTypes.includes("OP") &&
    recordTypes[recordTypes.length - 1] === "BT" &&
    recordTypes.every((type) => allowedRecordTypes.has(type))
  );
}

export async function processEmail(email: Email): Promise<{
  logs: LogEntry[];
}> {
  const logs: LogEntry[] = [];
  const now = new Date().toISOString();

  if (!email.attachments.length) {
    logs.push({
      id: getUniqueId(),
      timestamp: now,
      sender: email.sender,
      subject: email.subject,
      fileName: null,
      destinationFolder: null,
      status: "No Attachment",
      reason: "No attachment found",
    });

    return { logs };
  }

  for (const file of email.attachments) {
    // Virus scan - mock for browser environment
    if (file.content) {
      // In a real server environment, this would scan the actual file
      // For demo, check for mock virus signature
      const hasMockVirus = file.content.includes('MALWARE') || file.name.includes('virus');
      if (hasMockVirus) {
        logs.push({
          id: getUniqueId(),
          timestamp: now,
          sender: email.sender,
          subject: email.subject,
          fileName: file.name,
          destinationFolder: null,
          status: "Rejected - Virus Detected",
          reason: "Mock virus detected in file content",
        });
        return { logs };
      }
    }

    if (!isPOFilename(file.name)) {
      logs.push({
        id: getUniqueId(),
        timestamp: now,
        sender: email.sender,
        subject: email.subject,
        fileName: file.name,
        destinationFolder: null,
        status: "Rejected - Invalid Name",
        reason: "Filename must match Paltrack format POxxxyyy.zzz",
      });

      continue;
    }

    if (!isPORelatedEmail(email)) {
      logs.push({
        id: getUniqueId(),
        timestamp: now,
        sender: email.sender,
        subject: email.subject,
        fileName: file.name,
        destinationFolder: null,
        status: "Rejected - Not PO Email",
        reason: "Receiver is not Mates@goglobal.group",
      });

      continue;
    }

    if (!isAllowedPOFileType(file.name)) {
      logs.push({
        id: getUniqueId(),
        timestamp: now,
        sender: email.sender,
        subject: email.subject,
        fileName: file.name,
        destinationFolder: null,
        status: "Rejected - Disallowed File Type",
        reason: "Only Paltrack PO transmission file types are allowed",
      });

      continue;
    }

    if (!isValidPOFileContent(file.content)) {
      logs.push({
        id: getUniqueId(),
        timestamp: now,
        sender: email.sender,
        subject: email.subject,
        fileName: file.name,
        destinationFolder: null,
        status: "Rejected - Invalid PO Layout",
        reason: "File must contain valid Paltrack records: BH, OH, OP, and BT",
      });

      continue;
    }

    if (email.forceSaveFailure) {
      logs.push({
        id: getUniqueId(),
        timestamp: now,
        sender: email.sender,
        subject: email.subject,
        fileName: file.name,
        destinationFolder: PO_DROP_FOLDER,
        status: "Failed",
        reason: "Could not save file",
      });

      continue;
    }

    logs.push({
      id: getUniqueId(),
      timestamp: now,
      sender: email.sender,
      subject: email.subject,
      fileName: file.name,
      destinationFolder: PO_DROP_FOLDER,
      status: "PO Dropped",
    });
  }

  return { logs };
}

/**
 * Fetches real emails from Supabase webhook
 * Requires emails to be forwarded to the Supabase webhook endpoint
 */
export interface EmailFetchResult {
  emails: Email[];
  isDummyData: boolean;
}

export async function getRealEmails(): Promise<EmailFetchResult> {
  try {
    const { fetchMatesEmailsFromSupabase } = await import(
      "../integrations/supabase/emails"
    );
    const emails = await fetchMatesEmailsFromSupabase();
    return {
      emails: emails.length > 0 ? emails : DUMMY_EMAILS,
      isDummyData: emails.length === 0,
    };
  } catch (error) {
    console.warn("Could not fetch real emails from Supabase, using dummy emails:", error);
    return { emails: DUMMY_EMAILS, isDummyData: true };
  }
}

/**
 * Gets emails - real emails from Supabase if available, otherwise dummy emails
 * @param useDummy Force use of dummy emails even if real emails are available
 */
export async function getEmails(
  useDummy = false
): Promise<EmailFetchResult> {
  if (useDummy) {
    return { emails: DUMMY_EMAILS, isDummyData: true };
  }

  return getRealEmails();
}

/**
 * Gets the webhook URL for email forwarding configuration
 */
export function getEmailWebhookUrl(): string {
  try {
    const { getWebhookUrl } = require("../integrations/supabase/emails");
    return getWebhookUrl();
  } catch {
    return "";
  }
}

/**
 * Tests the email webhook
 */
export async function testEmailWebhook(): Promise<boolean> {
  try {
    const { testEmailWebhook } = await import("../integrations/supabase/emails");
    return await testEmailWebhook();
  } catch {
    return false;
  }
}