const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const AUTH_TOKEN_KEY = "toktickit.auth.token";
const AUTH_USER_KEY = "toktickit.auth.user";

export interface Category {
  id: number;
  name: string;
}

export interface DevelopmentRequester {
  id: number;
  name: string;
  email: string;
}

export type UserRole = "Requester" | "ITStaff" | "Administrator";

export interface AuthUser extends DevelopmentRequester {
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const value = window.localStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { return null; }
}

function saveAuth(token: string, user: AuthUser) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

function errorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") return (error as { message: string }).message;
  }
  return fallback;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface CreateTicketInput {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  requestedPriority: TicketPriority;
  description: string;
}

export interface CreatedTicket extends CreateTicketInput {
  id: number;
  ticketNumber: string;
  ticketDate: string;
  currentStatus: "New";
  createdAt: string;
  updatedAt: string;
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: Category;
  relatedSystem: RelatedSystem;
  requestedPriority: string;
  currentStatus: string;
  ticketDate: string;
  updatedAt: string;
}

export interface TicketListResponse {
  data: TicketListItem[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface TicketAttachmentMetadata {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  removedAt: string | null;
  removalReason: string | null;
}

export interface TicketDetail extends TicketListItem {
  ticketDate: string;
  description: string;
  createdAt: string;
  requester: DevelopmentRequester;
  attachments: TicketAttachmentMetadata[];
  problemAppearsResolvedAt?: string | null;
  publicComments?: PublicComment[];
}

export interface PublicComment {
  id: number;
  content: string;
  createdAt: string;
  author: Pick<AuthUser, "id" | "name" | "email" | "role">;
}

async function fetchJson<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { payload = undefined; }
    throw new Error(errorMessage(payload, `Request failed (${response.status})`));
  }
  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const payload = await response.json() as { token?: string; user?: AuthUser; error?: unknown };
  if (!response.ok || !payload.token || !payload.user) throw new Error(errorMessage(payload, "Unable to sign in."));
  saveAuth(payload.token, payload.user);
  return payload.user;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = await fetchJson<{ user: AuthUser }>("/api/auth/me");
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.user));
  return user.user;
}

export async function changePassword(newPassword: string, confirmPassword: string, currentPassword = ""): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/change-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
  const payload = await response.json() as { user?: AuthUser; error?: unknown };
  if (!response.ok || !payload.user) throw new Error(errorMessage(payload, "Unable to change password."));
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  return payload.user;
}

export async function logout() {
  const token = getAuthToken();
  if (token) await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
  clearAuth();
}

export async function fetchDevelopmentRequesters(): Promise<DevelopmentRequester[]> {
  const requesters = await fetchJson<unknown>("/api/requesters");
  if (!Array.isArray(requesters) || requesters.some((item) => {
    if (typeof item !== "object" || item === null) return true;
    const requester = item as Partial<DevelopmentRequester>;
    return typeof requester.id !== "number" || typeof requester.name !== "string" || typeof requester.email !== "string";
  })) throw new Error("Invalid requester response");
  return requesters as DevelopmentRequester[];
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const systems = await fetchJson<unknown>("/api/related-systems");
  if (!Array.isArray(systems) || systems.some((item) => {
    if (typeof item !== "object" || item === null) return true;
    const system = item as Partial<RelatedSystem>;
    return typeof system.id !== "number" || typeof system.name !== "string";
  })) throw new Error("Invalid related systems response");
  return systems as RelatedSystem[];
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchJson<Category[]>("/api/categories");
}

export async function createTicket(input: CreateTicketInput, idempotencyKey: string): Promise<CreatedTicket> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(input),
  });
  const payload = await response.json() as unknown;
  if (!response.ok) {
    const message = errorMessage(payload, "Unable to create ticket.");
    throw new Error(message);
  }
  if (typeof payload !== "object" || payload === null || typeof (payload as CreatedTicket).ticketNumber !== "string") {
    throw new Error("Invalid ticket response");
  }
  return payload as CreatedTicket;
}

export async function fetchTickets(params: URLSearchParams): Promise<TicketListResponse> {
  return fetchJson<TicketListResponse>(`/api/tickets?${params.toString()}`);
}

export async function fetchTicket(ticketId: number, requesterId: number): Promise<TicketDetail> {
  return fetchJson<TicketDetail>(`/api/tickets/${ticketId}?requesterId=${requesterId}`);
}

export async function addPublicComment(ticketId: number, content: string): Promise<PublicComment> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ content }) });
  const payload = await response.json() as unknown;
  if (!response.ok) throw new Error(errorMessage(payload, "Unable to add Public Comment."));
  return payload as PublicComment;
}

export async function indicateProblemResolved(ticketId: number): Promise<{ problemAppearsResolvedAt: string }> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/problem-resolved`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` } });
  const payload = await response.json() as unknown;
  if (!response.ok) throw new Error(errorMessage(payload, "Unable to record the resolution indication."));
  return payload as { problemAppearsResolvedAt: string };
}

export async function uploadAttachment(ticketId: number, requesterId: number, file: File): Promise<TicketAttachmentMetadata> {
  const form = new FormData(); form.append("file", file);
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments?requesterId=${requesterId}`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: form });
  const payload = await response.json() as unknown;
  if (!response.ok) throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to upload attachment.");
  return payload as TicketAttachmentMetadata;
}

export async function removeAttachment(attachmentId: number, requesterId: number, reason: string): Promise<TicketAttachmentMetadata> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}?requesterId=${requesterId}`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ reason }) });
  const payload = await response.json() as unknown;
  if (!response.ok) throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to remove attachment.");
  return payload as TicketAttachmentMetadata;
}

export function attachmentDownloadUrl(attachmentId: number, requesterId: number) {
  return `${API_URL}/api/attachments/${attachmentId}/download?requesterId=${requesterId}`;
}

export interface SystemStatus {
  online: boolean;
  status: string;
  service: string;
  categories: Category[];
}

// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const healthResponse = await fetch(`${API_URL}/api/health`, { headers });
  if (!healthResponse.ok) {
    throw new Error(`Health check failed (${healthResponse.status})`);
  }

  const health = (await healthResponse.json()) as { status?: string; service?: string };
  if (health.status !== "ok" || !health.service) {
    throw new Error("Invalid health response");
  }

  const categoriesResponse = await fetch(`${API_URL}/api/categories`, { headers });
  if (!categoriesResponse.ok) {
    throw new Error(`Category request failed (${categoriesResponse.status})`);
  }

  const categories = (await categoriesResponse.json()) as unknown;
  if (
    !Array.isArray(categories) ||
    categories.some(
      (category) =>
        typeof category !== "object" ||
        category === null ||
        typeof (category as Category).id !== "number" ||
        typeof (category as Category).name !== "string",
    )
  ) {
    throw new Error("Invalid categories response");
  }

  return {
    online: true,
    status: health.status,
    service: health.service,
    categories,
  };
}
