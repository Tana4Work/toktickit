const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface DevelopmentRequester {
  id: number;
  name: string;
  email: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json()) as T;
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
  const healthResponse = await fetch(`${API_URL}/api/health`);
  if (!healthResponse.ok) {
    throw new Error(`Health check failed (${healthResponse.status})`);
  }

  const health = (await healthResponse.json()) as { status?: string; service?: string };
  if (health.status !== "ok" || !health.service) {
    throw new Error("Invalid health response");
  }

  const categoriesResponse = await fetch(`${API_URL}/api/categories`);
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
