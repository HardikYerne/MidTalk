const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
export class ApiError extends Error { constructor(public status: number, public payload: unknown) { super(typeof payload === "object" && payload && "message" in payload ? String((payload as {message: unknown}).message) : `API request failed (${status})`); } }
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") { const token = sessionStorage.getItem("midtalk_access_token"); if (token) headers.set("Authorization", `Bearer ${token}`); }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}
