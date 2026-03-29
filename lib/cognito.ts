const STORAGE_KEY = "rak-inc-cognito-tokens";
const PKCE_VERIFIER_KEY = "rak-inc-pkce-verifier";

export type CognitoTokens = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_at: number;
};

export function getCognitoConfig() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim() || "";
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim() || "";
  const redirectUri =
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI?.trim() ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "");
  return { domain, clientId, redirectUri };
}

export function cognitoAuthEnabled(): boolean {
  const { domain, clientId } = getCognitoConfig();
  return Boolean(domain && clientId);
}

export function parseJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const p = jwt.split(".")[1];
    const json = atob(p.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getStoredTokens(): CognitoTokens | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || "null",
    ) as CognitoTokens | null;
  } catch {
    return null;
  }
}

export function setStoredTokens(obj: CognitoTokens) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function clearStoredTokens() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function base64UrlEncode(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Base64Url(str: string) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

function randomString(len: number) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  let s = "";
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startCognitoLogin() {
  const { domain, clientId, redirectUri } = getCognitoConfig();
  if (!domain || !clientId) {
    throw new Error("Cognito is not configured");
  }
  const verifier = randomString(32);
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const challenge = await sha256Base64Url(verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.assign(
    `https://${domain}/oauth2/authorize?${params.toString()}`,
  );
}

export async function exchangeCodeForTokens(code: string) {
  const { domain, clientId, redirectUri } = getCognitoConfig();
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier");
  if (!domain || !clientId) throw new Error("Cognito is not configured");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = (await res.json()) as {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Token error");
  }
  setStoredTokens({
    access_token: data.access_token!,
    id_token: data.id_token!,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  });
}

export function getCognitoLogoutUrl(): string | null {
  const { domain, clientId, redirectUri } = getCognitoConfig();
  if (!domain || !clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: redirectUri,
  });
  return `https://${domain}/logout?${params.toString()}`;
}
