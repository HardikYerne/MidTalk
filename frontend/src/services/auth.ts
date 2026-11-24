import { ApiError, apiRequest } from "./api-client";

export const TOKEN_KEY = "midtalk_access_token";

export type AuthUser = { id: string; email: string; username: string; displayName: string; createdAt: string };
export type SessionInfo = { deviceId: string; deviceName: string; createdAt: string; lastActiveAt: string; current: boolean };
type LoginResult = { user: AuthUser; accessToken: string };

function deviceName() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` on ${os}` : ""}`;
}

const json = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const keepToken = (r: LoginResult) => { sessionStorage.setItem(TOKEN_KEY, r.accessToken); return r.user; };

export const signIn = (identifier: string, password: string) =>
  apiRequest<LoginResult>("/auth/login", json({ identifier, password, deviceName: deviceName() })).then(keepToken);

export const reactivate = (identifier: string, password: string) =>
  apiRequest<LoginResult>("/auth/reactivate", json({ identifier, password, deviceName: deviceName() })).then(keepToken);

export const signUp = (input: { email: string; username: string; displayName: string; password: string }) =>
  apiRequest<{ user: AuthUser }>("/auth/register", json(input));

export async function signOut() {
  try { await apiRequest<void>("/auth/logout", { method: "POST" }); }
  finally { sessionStorage.removeItem(TOKEN_KEY); }
}
export async function signOutEverywhere() {
  try { await apiRequest<void>("/auth/logout-all", { method: "POST" }); }
  finally { sessionStorage.removeItem(TOKEN_KEY); }
}
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiRequest<void>("/auth/change-password", json({ currentPassword, newPassword }));
export const listSessions = () => apiRequest<{ items: SessionInfo[] }>("/auth/sessions").then(r => r.items);
export const revokeSession = (deviceId: string) => apiRequest<void>(`/auth/sessions/${encodeURIComponent(deviceId)}`, { method: "DELETE" });
export async function deactivateAccount(password: string) {
  await apiRequest<void>("/auth/deactivate", json({ password }));
  sessionStorage.removeItem(TOKEN_KEY);
}

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "That username/email and password don't match.",
  INVALID_PASSWORD: "That password is incorrect.",
  IDENTITY_UNAVAILABLE: "That email or username is already taken.",
  USERNAME_TAKEN: "That username is already taken.",
  ACCOUNT_DEACTIVATED: "This account is deactivated.",
};

/** Turns any thrown value into a sentence that tells the person what to fix. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Try again."): string {
  if (e instanceof ApiError) {
    const p = e.payload as { error?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } } | null;
    const field = p?.details?.fieldErrors && Object.values(p.details.fieldErrors).flat()[0];
    if (p?.error === "VALIDATION_ERROR") return field ? `Check your details: ${field}` : "Check your details and try again.";
    if (e.status === 429) return "Too many attempts. Wait a minute and try again.";
    return (p?.error && MESSAGES[p.error]) || p?.message || fallback;
  }
  if (e instanceof TypeError) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}
export const errorCode = (e: unknown) => (e instanceof ApiError ? (e.payload as { error?: string } | null)?.error : undefined);
