import { Client } from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import {
  BrowserAuthError,
  InteractionType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { msalConfig, loginRequest, graphConfig } from "./authConfig";
import type { DummyEmail, Attachment } from "../../lib/poAgent";

let pca: PublicClientApplication | null = null;
let graphClient: Client | null = null;

function createMsalConfig(authorityOverride?: string) {
  if (!authorityOverride) return msalConfig;

  return {
    ...msalConfig,
    auth: {
      ...msalConfig.auth,
      authority: authorityOverride,
    },
  };
}

export async function initializeMSAL(authorityOverride?: string) {
  if (!pca || authorityOverride) {
    if (pca && authorityOverride) {
      pca = null;
      graphClient = null;
    }

    pca = new PublicClientApplication(createMsalConfig(authorityOverride));
    await pca.initialize();
  }
  return pca;
}

export async function getGraphClient() {
  if (graphClient) return graphClient;

  const pca = await initializeMSAL();

  const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(pca, {
    account: pca.getActiveAccount() || undefined,
    scopes: loginRequest.scopes,
    interactionType: InteractionType.Redirect,
  });

  graphClient = Client.initWithMiddleware({ authProvider });
  return graphClient;
}

export async function loginToMicrosoftGraph() {
  const msalClient = await initializeMSAL();

  try {
    const activeAccount = msalClient.getActiveAccount();

    if (!activeAccount) {
      return await msalClient.loginPopup(loginRequest);
    }

    try {
      return await msalClient.acquireTokenSilent(loginRequest);
    } catch (silentError) {
      console.warn("Silent token acquisition failed, falling back to popup", silentError);
      return await msalClient.acquireTokenPopup(loginRequest);
    }
  } catch (error) {
    if (error instanceof BrowserAuthError && error.errorCode === "popup_window_error") {
      console.warn("Popup blocked or timed out, redirecting instead", error);
      await msalClient.loginRedirect(loginRequest);
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("AADSTS700016") || message.includes("Application with identifier")) {
      console.warn(
        "Tenant mismatch or app not found in tenant, retrying with common authority",
        error
      );

      pca = null;
      graphClient = null;
      const fallbackPca = await initializeMSAL("https://login.microsoftonline.com/common");

      try {
        return await fallbackPca.loginPopup(loginRequest);
      } catch (popupError) {
        console.warn("Popup fallback failed, redirecting with common authority", popupError);
        await fallbackPca.loginRedirect(loginRequest);
        return;
      }
    }

    console.error("Login failed:", error);
    throw error;
  }
}

interface MSGraphMessage {
  id: string;
  from: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  receivedDateTime: string;
  hasAttachments: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    contentType: string;
    "@odata.type": string;
  }>;
}

export async function fetchEmailsForMates(): Promise<DummyEmail[]> {
  try {
    const client = await getGraphClient();

    // Fetch emails sent to mates@goglobal.group
    const messages = await client
      .api(graphConfig.graphMailEndpoint)
      .filter("toRecipients/any(c:c/emailAddress/address eq 'mates@goglobal.group')")
      .select([
        "id",
        "from",
        "toRecipients",
        "subject",
        "bodyPreview",
        "body",
        "receivedDateTime",
        "hasAttachments",
        "attachments",
      ])
      .orderby("receivedDateTime desc")
      .top(50)
      .get();

    const emails: DummyEmail[] = messages.value.map((msg: MSGraphMessage, index: number) => {
      const attachments: Attachment[] = msg.attachments?.map((att) => ({
        name: att.name,
        type: att.contentType,
        sizeKb: Math.ceil(att.size / 1024),
        // Note: We can't fetch attachment content directly from the list response
        // You would need a separate call to get the content if needed
      })) || [];

      return {
        id: msg.id,
        sender: msg.from.emailAddress.address,
        to: msg.toRecipients[0]?.emailAddress.address || "mates@goglobal.group",
        subject: msg.subject,
        body: msg.body?.content || msg.bodyPreview || "",
        receivedAt: msg.receivedDateTime,
        attachments,
      };
    });

    return emails;
  } catch (error) {
    console.error("Failed to fetch emails from Microsoft Graph:", error);
    throw error;
  }
}

export async function downloadEmailAttachment(messageId: string, attachmentId: string) {
  try {
    const client = await getGraphClient();

    const attachment = await client
      .api(`/me/messages/${messageId}/attachments/${attachmentId}`)
      .get();

    return attachment;
  } catch (error) {
    console.error("Failed to download attachment:", error);
    throw error;
  }
}

export async function checkMSGraphAuthentication(): Promise<boolean> {
  try {
    const pca = await initializeMSAL();
    const account = pca.getActiveAccount();
    return !!account;
  } catch {
    return false;
  }
}
