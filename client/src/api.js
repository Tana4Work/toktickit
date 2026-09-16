const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const AUTH_TOKEN_KEY = "toktickit.auth.token";
const AUTH_USER_KEY = "toktickit.auth.user";
export function getAuthToken() {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
}
export function getStoredUser() {
    const value = window.localStorage.getItem(AUTH_USER_KEY);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
function saveAuth(token, user) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
function clearAuth() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
}
function errorMessage(payload, fallback) {
    if (typeof payload === "object" && payload !== null && "error" in payload) {
        const error = payload.error;
        if (typeof error === "string")
            return error;
        if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string")
            return error.message;
    }
    return fallback;
}
async function fetchJson(path) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) {
        let payload;
        try {
            payload = await response.json();
        }
        catch {
            payload = undefined;
        }
        throw new Error(errorMessage(payload, `Request failed (${response.status})`));
    }
    return (await response.json());
}
export async function login(email, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const payload = await response.json();
    if (!response.ok || !payload.token || !payload.user)
        throw new Error(errorMessage(payload, "Unable to sign in."));
    saveAuth(payload.token, payload.user);
    return payload.user;
}
export async function fetchCurrentUser() {
    const user = await fetchJson("/api/auth/me");
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.user));
    return user.user;
}
export async function changePassword(newPassword, confirmPassword, currentPassword = "") {
    const response = await fetch(`${API_URL}/api/auth/change-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
    const payload = await response.json();
    if (!response.ok || !payload.user)
        throw new Error(errorMessage(payload, "Unable to change password."));
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
    return payload.user;
}
export async function logout() {
    const token = getAuthToken();
    if (token)
        await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
    clearAuth();
}
export async function fetchDevelopmentRequesters() {
    const requesters = await fetchJson("/api/requesters");
    if (!Array.isArray(requesters) || requesters.some((item) => {
        if (typeof item !== "object" || item === null)
            return true;
        const requester = item;
        return typeof requester.id !== "number" || typeof requester.name !== "string" || typeof requester.email !== "string";
    }))
        throw new Error("Invalid requester response");
    return requesters;
}
export async function fetchRelatedSystems() {
    const systems = await fetchJson("/api/related-systems");
    if (!Array.isArray(systems) || systems.some((item) => {
        if (typeof item !== "object" || item === null)
            return true;
        const system = item;
        return typeof system.id !== "number" || typeof system.name !== "string";
    }))
        throw new Error("Invalid related systems response");
    return systems;
}
export async function fetchCategories() {
    return fetchJson("/api/categories");
}
export async function createTicket(input, idempotencyKey) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(input),
    });
    const payload = await response.json();
    if (!response.ok) {
        const message = errorMessage(payload, "Unable to create ticket.");
        throw new Error(message);
    }
    if (typeof payload !== "object" || payload === null || typeof payload.ticketNumber !== "string") {
        throw new Error("Invalid ticket response");
    }
    return payload;
}
export async function fetchTickets(params) {
    return fetchJson(`/api/tickets?${params.toString()}`);
}
export async function fetchTicket(ticketId, requesterId) {
    return fetchJson(`/api/tickets/${ticketId}?requesterId=${requesterId}`);
}
export async function addPublicComment(ticketId, content) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ content }) });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(errorMessage(payload, "Unable to add Public Comment."));
    return payload;
}
export async function indicateProblemResolved(ticketId) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/problem-resolved`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` } });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(errorMessage(payload, "Unable to record the resolution indication."));
    return payload;
}
export async function fetchStaffTickets(params = new URLSearchParams()) {
    return fetchJson(`/api/staff/tickets?${params.toString()}`);
}
export async function fetchStaffOwners() {
    return fetchJson("/api/staff/owners");
}
export async function fetchStaffTicket(ticketId) {
    return fetchJson(`/api/staff/tickets/${ticketId}`);
}
async function patchStaff(path, body) {
    const response = await fetch(`${API_URL}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(errorMessage(payload, "Unable to update the Ticket."));
    return payload;
}
export function updateStaffTicketOwner(ticketId, ownerId) { return patchStaff(`/api/staff/tickets/${ticketId}/owner`, { ownerId }); }
export function updateStaffTicketPriority(ticketId, itPriority) { return patchStaff(`/api/staff/tickets/${ticketId}/priority`, { itPriority }); }
export function updateStaffTicketStatus(ticketId, status) { return patchStaff(`/api/staff/tickets/${ticketId}/status`, { status }); }
export async function addStaffPublicComment(ticketId, content) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ content }) });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(errorMessage(payload, "Unable to add Public Comment."));
    return payload;
}
export async function addInternalNote(ticketId, content) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ content }) });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(errorMessage(payload, "Unable to add Internal Note."));
    return payload;
}
export async function uploadAttachment(ticketId, requesterId, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments?requesterId=${requesterId}`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: form });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to upload attachment.");
    return payload;
}
export async function removeAttachment(attachmentId, requesterId, reason) {
    const response = await fetch(`${API_URL}/api/attachments/${attachmentId}?requesterId=${requesterId}`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken() ?? ""}` }, body: JSON.stringify({ reason }) });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to remove attachment.");
    return payload;
}
export function attachmentDownloadUrl(attachmentId, requesterId) {
    return `${API_URL}/api/attachments/${attachmentId}/download?requesterId=${requesterId}`;
}
// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem() {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const healthResponse = await fetch(`${API_URL}/api/health`, { headers });
    if (!healthResponse.ok) {
        throw new Error(`Health check failed (${healthResponse.status})`);
    }
    const health = (await healthResponse.json());
    if (health.status !== "ok" || !health.service) {
        throw new Error("Invalid health response");
    }
    const categoriesResponse = await fetch(`${API_URL}/api/categories`, { headers });
    if (!categoriesResponse.ok) {
        throw new Error(`Category request failed (${categoriesResponse.status})`);
    }
    const categories = (await categoriesResponse.json());
    if (!Array.isArray(categories) ||
        categories.some((category) => typeof category !== "object" ||
            category === null ||
            typeof category.id !== "number" ||
            typeof category.name !== "string")) {
        throw new Error("Invalid categories response");
    }
    return {
        online: true,
        status: health.status,
        service: health.service,
        categories,
    };
}
