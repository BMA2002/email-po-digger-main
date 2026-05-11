# Supabase Email Webhook Setup Guide

This guide explains how to set up real email delivery to the email-po-digger application using Supabase webhooks.

## Overview

Instead of polling an email API, this approach uses **email forwarding** to send emails directly to a Supabase Edge Function. When an email arrives at `mates@goglobal.group`, your email service forwards it to a webhook endpoint, and it gets stored in your Supabase database.

## Prerequisites

- Supabase account and project already set up
- Ability to configure email forwarding rules in your email service
- Access to `mates@goglobal.group` mailbox

## Setup Steps

### 1. Deploy the Supabase Function

The webhook receiver function is located at `supabase/functions/receive-email/index.ts`.

#### Option A: Deploy via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the function
supabase functions deploy receive-email
```

#### Option B: Deploy via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `receive-email`
5. Copy the contents of `supabase/functions/receive-email/index.ts` into the editor
6. Deploy

### 2. Set Up Database Tables

Run the SQL migration to create the email tables:

```bash
# Via Supabase CLI
supabase db push

# Or manually:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of supabase/migrations/create_email_tables.sql
# 3. Run the query
```

The migration creates:
- `emails` table - stores email metadata
- `email_attachments` table - stores attachment information

### 3. Get Your Webhook URL

The webhook URL is automatically generated based on your Supabase project:

```
https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email
```

**In the app UI**, go to the "Mates Emails" section and click "Show Webhook URL" to see your endpoint.

Or programmatically:
```typescript
import { getEmailWebhookUrl } from "@/lib/poAgent";
const url = getEmailWebhookUrl();
console.log(url);
```

### 4. Configure Email Forwarding

Choose your email service and set up forwarding rules:

#### **Option A: Microsoft Exchange / Outlook**

1. Open Outlook on the web
2. Go to **Settings** → **Mail** → **Forwarding**
3. Enable forwarding
4. Forward to your webhook URL (or use a mail-to-http service)
5. Keep a copy in the mailbox

**Note:** Outlook doesn't support direct HTTP webhooks. Use one of these alternatives:
- [webhook.email](https://webhook.email) - Email to HTTP bridge
- [Pipedream](https://pipedream.com) - Email forwarding automation
- Custom SMTP gateway

#### **Option B: Gmail / Google Workspace**

1. Open Gmail settings
2. Go to **Forwarding and POP/IMAP**
3. Add a forwarding address
4. **Alternative:** Use Gmail filters with a mail-to-HTTP service

#### **Option C: Custom SMTP Server**

If you control the mail server, configure it to forward emails to your webhook:

```bash
# Example: Postfix configuration
# Add to /etc/postfix/virtual_regexp:
/^mates@goglobal\.group$/ "| curl -X POST https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email -H 'Content-Type: application/json' -d @-"
```

#### **Option D: Mail-to-HTTP Bridge Services**

Use a third-party service to convert email to HTTP:

**Webhook.email Setup:**
1. Go to [webhook.email](https://webhook.email)
2. Create an endpoint
3. Set up email forwarding to that service
4. Configure it to forward to your Supabase webhook

**Pipedream Setup:**
1. Create a Pipedream account
2. Create a workflow that listens for emails
3. Use HTTP requests to post to your webhook

### 5. (Optional) Add Webhook Security

For additional security, you can require a secret header:

1. Set the `WEBHOOK_SECRET` environment variable in Supabase:
   ```
   WEBHOOK_SECRET=your-secret-key-here
   ```

2. Update your email forwarding to include the header:
   ```
   X-Webhook-Secret: your-secret-key-here
   ```

### 6. Test the Webhook

In the app, click the "Refresh" button to fetch emails. If no emails appear yet, test the webhook:

```typescript
import { testEmailWebhook } from "@/lib/poAgent";

const success = await testEmailWebhook();
console.log("Webhook test:", success ? "Passed" : "Failed");
```

## Usage in Components

### Using the Hook

```typescript
import { useMatesEmails } from "@/hooks/useMatesEmails";

export function EmailList() {
  const { emails, isLoading, error, refreshEmails } = useMatesEmails();

  return (
    <div>
      <button onClick={refreshEmails}>Refresh</button>
      {emails.map((email) => (
        <div key={email.id}>
          <h3>{email.subject}</h3>
          <p>From: {email.sender}</p>
        </div>
      ))}
    </div>
  );
}
```

### Using Functions Directly

```typescript
import { getEmails, processEmail } from "@/lib/poAgent";

const emails = await getEmails();
for (const email of emails) {
  const { logs } = processEmail(email);
  console.log(logs);
}
```

## Email Data Structure

Emails stored in Supabase are converted to the `Email` interface:

```typescript
interface Email {
  id: string;
  sender: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  attachments: Attachment[];
  isRealEmail: boolean;
}

interface Attachment {
  name: string;
  type: string;
  sizeKb: number;
  content?: string;
}
```

## Webhook Payload Format

When sending emails to the webhook, use this format:

```json
{
  "from": "sender@example.com",
  "to": "mates@goglobal.group",
  "subject": "PO Dispatch",
  "text": "Email body text",
  "html": "<p>Optional HTML version</p>",
  "date": "2024-05-07T10:30:00Z",
  "messageId": "unique-message-id@example.com",
  "attachments": [
    {
      "filename": "POABC001.TIL",
      "contentType": "text/plain",
      "size": 1024,
      "content": "base64-encoded-or-text-content"
    }
  ]
}
```

## Database Queries

Query emails directly from Supabase:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Get all emails for mates@goglobal.group
const { data } = await supabase
  .from("emails")
  .select("*, email_attachments(*)")
  .ilike("to_recipients", "%mates@goglobal.group%")
  .order("received_at", { ascending: false });

// Get emails by sender
const { data } = await supabase
  .from("emails")
  .select("*")
  .eq("sender", "supplier@vendor.com");

// Get emails with attachments
const { data } = await supabase
  .from("emails")
  .select("*, email_attachments(*)")
  .gt("email_attachments.size_kb", 0);
```

## Troubleshooting

### Webhook Not Receiving Emails

- Check that your email forwarding rule is configured correctly
- Verify the webhook URL is correct (check in app UI)
- Test with a manual HTTP request:
  ```bash
  curl -X POST https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email \
    -H "Content-Type: application/json" \
    -d '{"from": "test@example.com", "to": "mates@goglobal.group", "subject": "Test", "text": "Test email"}'
  ```

### Emails Not Appearing in App

- Click "Refresh" button to fetch latest emails
- Check Supabase dashboard → SQL Editor and query the `emails` table
- Check function logs: Supabase Dashboard → Edge Functions → receive-email → Logs

### "Permission not found" Errors

- Ensure Row Level Security policies are enabled
- Check that the `receive-email` function has `SUPABASE_SERVICE_ROLE_KEY` access
- Verify CORS settings allow requests from your app domain

### Attachments Not Saved

- Check attachment size limits
- Ensure attachment `size` is correctly provided in webhook payload
- Verify `email_attachments` table exists

## Security Notes

- Never commit `.env.local` with sensitive data
- Webhook secret (if used) prevents unauthorized email injection
- Row Level Security allows only authenticated users to read emails
- Supabase service role key is only used server-side in Edge Functions

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Email to HTTP Services Comparison](https://www.ory.sh/email-to-http-webhooks)
