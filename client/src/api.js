const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
async function fetchJson(path) {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok)
        throw new Error(`Request failed (${response.status})`);
    return (await response.json());
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
    const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(input),
    });
    const payload = await response.json();
    if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
            ? payload.error : "Unable to create ticket.";
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
export async function uploadAttachment(ticketId, requesterId, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments?requesterId=${requesterId}`, { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok)
        throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to upload attachment.");
    return payload;
}
export async function removeAttachment(attachmentId, requesterId, reason) {
    const response = await fetch(`${API_URL}/api/attachments/${attachmentId}?requesterId=${requesterId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
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
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (!healthResponse.ok) {
        throw new Error(`Health check failed (${healthResponse.status})`);
    }
    const health = (await healthResponse.json());
    if (health.status !== "ok" || !health.service) {
        throw new Error("Invalid health response");
    }
    const categoriesResponse = await fetch(`${API_URL}/api/categories`);
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
