import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  async function handleCheck() {
    setState("loading");
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch {
      setState("error");
      setCategories([]);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "loading" && <p className="mt-4 text-secondary">Checking API status...</p>}

      {state === "success" && (
        <div className="mt-4">
          <p className="text-success fw-semibold">System Status: Online</p>
          <ul aria-label="Categories">
            {categories.map((category) => <li key={category.id}>{category.name}</li>)}
          </ul>
        </div>
      )}

      {state === "error" && (
        <p className="mt-4 text-danger" role="alert">
          System Status: Offline. Unable to reach the service desk API. Please try again.
        </p>
      )}
    </div>
  );
}
