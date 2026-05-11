# Email Forwarding Configuration Guide

This guide provides step-by-step instructions for configuring email forwarding to your Supabase webhook for different email services.

## Quick Reference

| Service | Method | Difficulty | Direct Webhook Support |
|---------|--------|------------|------------------------|
| **Microsoft Exchange/Outlook** | Forwarding + Bridge Service | Medium | No |
| **Gmail/Google Workspace** | Filters + Bridge Service | Medium | No |
| **Postfix/Sendmail** | Virtual Maps | Advanced | Yes |
| **Webhook.email** | Bridge Service | Easy | Yes |
| **Pipedream** | Automation Platform | Medium | Yes |
| **AWS SES** | SNS + Lambda | Advanced | Yes |
| **Mailgun** | Webhooks | Easy | Yes |

---

## Microsoft Outlook / Exchange

### Method 1: Using Outlook Forwarding + Webhook.email

**Step 1: Set Up Webhook.email Bridge**

1. Go to [webhook.email](https://webhook.email)
2. Note your unique webhook.email address (e.g., `webhook@webhook.email`)
3. Create a custom action to forward to your Supabase webhook:
   - In webhook.email dashboard, add your Supabase webhook URL
   - Choose HTTP POST
   - Set payload type to JSON

**Step 2: Configure Outlook Forwarding**

1. Open [Outlook on the Web](https://outlook.office.com)
2. Click **Settings** (gear icon) → **Mail** → **Forwarding**
3. Enable "Forwarding"
4. Enter the webhook.email address
5. Check "Keep a copy in mailbox"
6. Save

**Note:** When an email arrives at `mates@goglobal.group`, it will be forwarded to webhook.email, which sends it to your Supabase function.

### Method 2: Direct Postfix/Exchange (on-premises)

If you control the Exchange server:

```
# Exchange PowerShell
New-InboxRule -Name "Forward to Webhook" `
  -Mailbox mates@goglobal.group `
  -From * `
  -ForwardTo webhook-handler@yourdomain.com `
  -Enabled $true
```

Then configure a mail-to-HTTP gateway on your server.

---

## Gmail / Google Workspace

### Method 1: Gmail Filters + Webhook.email

**Step 1: Set Up Webhook.email (as above)**

**Step 2: Create Gmail Filter**

1. Open [Gmail](https://mail.google.com)
2. Click **Settings** (gear) → **Filters and Blocked Addresses**
3. Click **Create a new filter**
4. Set filter criteria:
   - **To:** `mates@goglobal.group`
5. Click **Create filter**
6. Check "Forward it to" and enter webhook.email address
7. Check "Also apply filter to matching conversations"
8. Click **Create filter**

**Note:** Emails will be forwarded but Gmail won't delete the original.

### Method 2: Google Workspace Admin (for organizations)

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Users and accounts** → **User settings**
3. Enable "Allow per-user outbound gateways"
4. For the mates user account, set up forwarding rules

### Method 3: Gmail API + Webhooks (most reliable)

Use a service like **Pipedream** (see Pipedream section below) to listen to Gmail API and forward emails.

---

## Webhook.email (Simplest Bridge Service)

### Setup Instructions

**Step 1: Create Webhook.email Account**

1. Go to [webhook.email](https://webhook.email)
2. Click **Start Now**
3. No login required - you get a unique URL immediately
4. Note the URL format: `https://webhook.email/unique-id`

**Step 2: Configure Forwarding Action**

1. In webhook.email, click **Webhook**
2. Add your Supabase webhook URL: `https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email`
3. Select **POST** method
4. Choose **JSON** format
5. Enable "Parse email and convert to JSON"
6. Save

**Step 3: Test**

1. Send an email to the webhook.email address
2. Check webhook.email dashboard for incoming email
3. Check your Supabase Edge Functions logs to verify it forwarded

**Step 4: Update Main Email Forwarding**

Set your primary email service (Outlook/Gmail) to forward to your webhook.email address.

---

## Pipedream (Most Flexible)

### Setup Instructions

**Step 1: Create Pipedream Workflow**

1. Go to [Pipedream](https://pipedream.com)
2. Sign up / Log in
3. Click **Create Workflow**

**Step 2: Add Email Trigger**

1. Search for "Email" trigger
2. Choose "Incoming Email"
3. Note the generated email address (e.g., `wf_abc123@mail.pipedream.net`)

**Step 3: Parse Email Data**

Add a "Run Node.js Code" step:

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const email = steps.trigger.event;
    
    return {
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      date: email.date,
      messageId: email.messageId,
      attachments: email.attachments || []
    };
  }
});
```

**Step 4: Forward to Supabase**

Add an "HTTP" step:

1. Method: **POST**
2. URL: `https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email`
3. Headers:
   ```
   Content-Type: application/json
   x-webhook-secret: your-secret-key
   ```
4. Body: Use the previous step's output:
   ```json
   {
     "from": "{{ steps.parse_email.$return_value.from }}",
     "to": "{{ steps.parse_email.$return_value.to }}",
     "subject": "{{ steps.parse_email.$return_value.subject }}",
     "text": "{{ steps.parse_email.$return_value.text }}",
     "html": "{{ steps.parse_email.$return_value.html }}",
     "date": "{{ steps.parse_email.$return_value.date }}",
     "attachments": "{{ steps.parse_email.$return_value.attachments }}"
   }
   ```

**Step 5: Configure Email Forwarding**

Forward emails from your primary service to your Pipedream email address.

---

## Mailgun (if using Mailgun for email service)

### Setup Instructions

**Step 1: Create Mailgun Webhook**

1. Log in to [Mailgun Dashboard](https://app.mailgun.com)
2. Go to **Sending** → **Domain Settings**
3. Click **Webhooks** tab
4. Add new webhook:
   - **Event:** Message delivered, Message failed, etc.
   - **URL:** `https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email`

**Step 2: Configure Route**

1. Go to **Sending** → **Routes**
2. Create new route:
   - **Priority:** 10
   - **Filter:** `match_recipient("mates@goglobal.group")`
   - **Action:** `forward("https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email")`
3. Save

---

## AWS SES + Lambda

### Setup Instructions

**Step 1: Create Lambda Function**

```python
import json
import requests

def lambda_handler(event, context):
    # Parse SES message
    message = event['Records'][0]['Ses']['mail']
    
    payload = {
        'from': message['source'],
        'to': message['destination'][0],
        'subject': message['headers'][0]['value'],  # Find Subject header
        'text': 'See email content',
        'date': message['timestamp'],
        'messageId': message['messageId']
    }
    
    # Forward to Supabase
    response = requests.post(
        'https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email',
        json=payload,
        headers={'x-webhook-secret': 'your-secret'}
    )
    
    return {'statusCode': response.status_code}
```

**Step 2: Create SES Receipt Rule**

1. Go to AWS SES console
2. **Email Receiving** → **Rule Sets**
3. Create rule:
   - **Recipients:** `mates@goglobal.group`
   - **Actions:** Lambda
   - **Function:** Select the Lambda you created
4. Save

---

## Self-Hosted Postfix/Sendmail

### Postfix Configuration

Add to `/etc/postfix/virtual_regexp`:

```
/^mates@goglobal\.group$/ forward-webhook
```

Create `/etc/postfix/forward-webhook`:

```
| curl -X POST https://qzskmhcnxlyaavjnssfr.supabase.co/functions/v1/receive-email \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: your-secret' \
  -d '{"from": "SENDER", "to": "mates@goglobal.group", "subject": "EMAIL_SUBJECT", "text": "EMAIL_BODY"}'
```

Reload postfix:
```bash
postmap /etc/postfix/virtual_regexp
postfix reload
```

---

## Troubleshooting

### Emails Not Reaching Webhook

1. Check email forwarding is enabled
2. Verify webhook URL is correct
3. Check firewall/network issues
4. Test with curl:
   ```bash
   curl -X POST https://your-webhook.url \
     -H 'Content-Type: application/json' \
     -d '{"from": "test@example.com", "to": "mates@goglobal.group", "subject": "Test", "text": "Test"}'
   ```

### Check Supabase Function Logs

```bash
supabase functions fetch receive-email --logs
```

Or via dashboard: **Edge Functions** → **receive-email** → **Invocations**

### Email Forwarding Creates Loop

Ensure:
- Don't forward from webhook.url back to original email
- Disable "Keep copy" if experiencing loops
- Use rule-based filtering, not global forwarding

---

## Which Method to Choose?

| Use Case | Recommended Method |
|----------|-------------------|
| Quick setup, Outlook/Gmail | **Webhook.email** |
| Organization with control | **Pipedream** or **Direct SMTP Gateway** |
| Using Mailgun already | **Mailgun Routes** |
| AWS infrastructure | **SES + Lambda** |
| Self-hosted mail server | **Postfix/Sendmail Configuration** |
| Maximum flexibility | **Pipedream** |

---

## Need Help?

- Check Supabase Edge Functions logs
- Verify webhook URL in app UI (Mates Emails → Show Webhook URL)
- Test webhook manually with curl
- Review email forwarding rules in your email service
