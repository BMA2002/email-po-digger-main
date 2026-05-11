import { supabase } from "./client";
import type { Attachment, Email } from "../../lib/poAgent";

export interface SupabaseEmail {
  id: string;
  sender: string;
  to_recipients: string;
  subject: string;
  body: string;
  body_html: string | null;
  received_at: string;
  created_at: string;
  raw_email: any;
  email_attachments?:
    | Array<{
        id: string;
        name: string;
        type: string | null;
        size_kb: number | null;
        content: string | null;
      }>
    | {
        id: string;
        name: string;
        type: string | null;
        size_kb: number | null;
        content: string | null;
      };
}

/**
 * Fetch emails for mates@goglobal.group from Supabase
 */
export async function fetchMatesEmailsFromSupabase(): Promise<Email[]> {
  try {
    const { data, error } = await supabase
      .from("emails")
      .select(
        `
        id,
        sender,
        to_recipients,
        subject,
        body,
        body_html,
        received_at,
        created_at,
        raw_email,
        email_attachments(id, name, type, size_kb, content)
      `
      )
      .ilike("to_recipients", "%mates@goglobal.group%")
      .order("received_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching emails from Supabase:", error);
      throw error;
    }

    if (!data) return [];

    return (data as SupabaseEmail[]).map((dbEmail) => {
      const attachmentsData = dbEmail.email_attachments;
      const attachmentsArray = Array.isArray(attachmentsData)
        ? attachmentsData
        : attachmentsData
        ? [attachmentsData]
        : [];

      return {
        id: dbEmail.id,
        sender: dbEmail.sender,
        to: dbEmail.to_recipients,
        subject: dbEmail.subject,
        body: dbEmail.body || dbEmail.body_html || "",
        receivedAt: dbEmail.received_at,
        attachments: attachmentsArray.map((att) => ({
          name: att.name,
          type: att.type || "application/octet-stream",
          sizeKb: att.size_kb || 0,
          content: att.content,
        })),
        isRealEmail: true,
      };
    });
  } catch (error) {
    console.error("Failed to fetch emails from Supabase:", error);
    return [];
  }
}

/**
 * Get the webhook URL for email forwarding configuration
 */
export function getWebhookUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const projectId = supabaseUrl?.split(".supabase.co")[0].split("//")[1];

  if (!projectId) {
    console.warn("Could not determine Supabase project ID");
    return "";
  }

  return `https://${projectId}.supabase.co/functions/v1/receive-email`;
}

/**
 * Test the webhook by sending a sample email
 */
export async function testEmailWebhook(): Promise<boolean> {
  try {
    const webhookUrl = getWebhookUrl();
    const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret && { "x-webhook-secret": webhookSecret }),
      },
      body: JSON.stringify({
        from: "test@example.com",
        to: "mates@goglobal.group",
        subject: "Test Email",
        text: "This is a test email",
        date: new Date().toISOString(),
        messageId: `test-${Date.now()}@example.com`,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Webhook test failed:", error);
    return false;
  }
}

/**
 * Manual email import - allows importing emails from JSON or raw text
 */
export async function importEmailsManually(
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{
      name: string;
      type: string;
      sizeKb: number;
      content?: string;
    }>;
  }>
): Promise<boolean> {
  try {
    const insertData = emails.map((email) => ({
      sender: email.from,
      to_recipients: email.to,
      subject: email.subject,
      body: email.body,
      received_at: new Date().toISOString(),
      raw_email: email,
    }));

    const { error } = await supabase.from("emails").insert(insertData);

    if (error) {
      console.error("Error importing emails:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Manual import failed:", error);
    return false;
  }
}
