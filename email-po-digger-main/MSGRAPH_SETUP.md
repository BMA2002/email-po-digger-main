# Microsoft Graph Email Integration Setup

This guide explains how to set up and use real emails from `mates@goglobal.group` in the email-po-digger application.

## Prerequisites

- Microsoft 365 account with access to `mates@goglobal.group`
- Azure AD tenant access to register an application

## Setup Steps

### 1. Register an Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Fill in the form:
   - **Name**: email-po-digger (or your preferred name)
   - **Supported account types**: Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant)" or your organization's type
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:5173` (for development) or your production URL

4. Click **Register**

### 2. Grant API Permissions

1. In the app registration, go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph**
3. Select **Delegated permissions**
4. Search for and select:
   - `Mail.Read` - Read user mail
5. Click **Add permissions**
6. Grant admin consent if available

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Azure AD credentials in `.env.local`:
   ```
   VITE_MSGRAPH_CLIENT_ID=your-application-client-id
   VITE_MSGRAPH_TENANT_ID=your-tenant-id
   ```

   You can find these values in the Azure Portal under your app registration:
   - **Client ID**: Application (client) ID
   - **Tenant ID**: Directory (tenant) ID

### 4. Start the Application

```bash
npm run dev
```

## Usage in Components

### Using the Hook

```typescript
import { useMatesEmails } from "@/hooks/useMatesEmails";

export function EmailListComponent() {
  const { emails, isLoading, error, isAuthenticated, login } = useMatesEmails();

  if (!isAuthenticated) {
    return (
      <div>
        <p>Sign in to access real emails</p>
        <button onClick={login}>Sign In with Microsoft</button>
      </div>
    );
  }

  if (isLoading) return <div>Loading emails...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {emails.map((email) => (
        <div key={email.id}>
          <h3>{email.subject}</h3>
          <p>From: {email.sender}</p>
          <p>Received: {new Date(email.receivedAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Using the Functions Directly

```typescript
import {
  getEmails,
  isMicrosoftGraphAuthenticated,
  processEmail,
} from "@/lib/poAgent";
import { loginToMicrosoftGraph } from "@/integrations/msgraph/client";

async function processEmails() {
  // Check if authenticated
  const isAuth = await isMicrosoftGraphAuthenticated();

  if (!isAuth) {
    // Login to Microsoft Graph
    await loginToMicrosoftGraph();
  }

  // Get real emails (or dummy if not authenticated)
  const emails = await getEmails();

  // Process each email
  for (const email of emails) {
    const { logs } = processEmail(email);
    console.log(logs);
  }
}
```

## Email Data Structure

Real emails from Microsoft Graph are converted to the `Email` interface:

```typescript
interface Email {
  id: string;
  sender: string; // sender's email address
  to: string; // receiver's email address
  subject: string;
  body: string; // email body text
  receivedAt: string; // ISO 8601 datetime
  attachments: Attachment[]; // list of attachments
  isRealEmail?: boolean; // true if from Microsoft Graph, false if dummy
}

interface Attachment {
  name: string; // filename
  type: string; // MIME type
  sizeKb: number; // file size in kilobytes
  content?: string; // file content (if available for text files)
}
```

## Fallback Behavior

- If authentication fails, the app automatically falls back to **dummy emails**
- Use `getEmails(true)` to force dummy emails even if authenticated
- Real emails include `isRealEmail: true` to help distinguish them

## Fetching Attachment Content

For text-based PO files (`.til`, `.txt`, `.dat`), the attachment content is available in the `Attachment.content` field.

For binary files, you would need to:

```typescript
import { downloadEmailAttachment } from "@/integrations/msgraph/client";

// Download specific attachment
const attachment = await downloadEmailAttachment(messageId, attachmentId);
```

## Troubleshooting

### "VITE_MSGRAPH_CLIENT_ID is empty"
- Make sure `.env.local` is properly configured
- Client ID must be set in environment variables
- Restart dev server after updating `.env.local`

### "Login popup blocked"
- Ensure popup windows aren't being blocked by browser extensions
- Try in a private/incognito window

### "403 Forbidden" errors
- Check that API permissions are granted in Azure AD
- Ensure `Mail.Read` permission is added
- Grant admin consent if available

### "Permission not found or not consented"
- Re-login to refresh the authentication token
- Use `loginToMicrosoftGraph()` again

## Security Notes

- Never commit `.env.local` to version control (it's in `.gitignore`)
- Client IDs are safe to expose (they're for public authentication flows)
- Tenant ID is also safe to expose
- The app uses OAuth 2.0 Authorization Code Flow (secure for SPAs)
- Email content is only accessible after user authentication

## Additional Resources

- [Microsoft Graph Mail API Docs](https://docs.microsoft.com/en-us/graph/api/user-list-messages)
- [Azure AD Application Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL Browser Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser)
