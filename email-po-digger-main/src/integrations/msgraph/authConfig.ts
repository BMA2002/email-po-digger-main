/**
 * Authentication configuration for Microsoft Graph API
 * Update with your Azure AD app registration details
 */

const rawClientId = import.meta.env.VITE_MSGRAPH_CLIENT_ID?.trim() || "";
const rawTenantId = import.meta.env.VITE_MSGRAPH_TENANT_ID?.trim() || "";

const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTenantId);
const isDomain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(rawTenantId);
const tenant = isGuid || isDomain ? rawTenantId : "common";

if (rawTenantId && tenant === "common") {
  console.warn(
    "Invalid VITE_MSGRAPH_TENANT_ID value, falling back to 'common'.",
    rawTenantId
  );
}

export const msalConfig = {
  auth: {
    clientId: rawClientId,
    authority: `https://login.microsoftonline.com/${tenant}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["Mail.Read"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages",
};
