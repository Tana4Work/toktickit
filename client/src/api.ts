const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
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

  return {
    online: true,
    status: health.status,
    service: health.service,
    categories: [],
  };
}
