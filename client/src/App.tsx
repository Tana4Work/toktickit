import { useEffect, useState } from "react";
import { checkSystem, Category, DevelopmentRequester, fetchDevelopmentRequesters } from "./api.js";
import { useRequester } from "./requesterContext.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [requesters, setRequesters] = useState<DevelopmentRequester[]>([]);
  const [requesterState, setRequesterState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const { currentRequester, selectRequester, clearRequester } = useRequester();

  async function loadRequesters() {
    setRequesterState("loading");
    try {
      setRequesters(await fetchDevelopmentRequesters());
      setRequesterState("success");
    } catch {
      setRequesters([]);
      setRequesterState("error");
    }
  }

  useEffect(() => {
    void loadRequesters();
  }, []);

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

      <section className="mt-5" aria-labelledby="requester-selection-heading">
        <h2 id="requester-selection-heading" className="h5">Development Requester Selection</h2>
        <p className="text-secondary">This selector is for Lab 2 testing only. It is not authentication.</p>
        {requesterState === "loading" && <p role="status">Loading Requesters...</p>}
        {requesterState === "error" && <div role="status" className="text-danger"><p>Unable to load Development Requesters. Please try again.</p><button className="btn btn-outline-success" onClick={loadRequesters}>Try Again</button></div>}
        {requesterState === "success" && requesters.length === 0 && <p role="status">No active Development Requesters are available.</p>}
        {requesterState === "success" && requesters.length > 0 && (
          <div>
            <label className="d-block" htmlFor="development-requester">
              <span className="d-block mb-2">Development Requester</span>
            </label>
            <select id="development-requester" className="form-select" value={currentRequester?.id ?? ""} onChange={(event) => {
              const requester = requesters.find((item) => String(item.id) === event.target.value);
              if (requester) {
                selectRequester(requester);
                setSelectionConfirmed(false);
              }
            }}>
              <option value="">Select a Requester</option>
              {requesters.map((requester) => <option key={requester.id} value={requester.id}>{requester.name} ({requester.email})</option>)}
            </select>
            <button className="btn btn-success mt-3" disabled={!currentRequester} onClick={() => setSelectionConfirmed(true)}>Continue</button>
          </div>
        )}
        {selectionConfirmed && currentRequester && <div className="mt-3" role="status"><p className="text-success">Current testing Requester: {currentRequester.name}</p><button className="btn btn-link px-0" onClick={() => { clearRequester(); setSelectionConfirmed(false); }}>Change Requester</button></div>}
      </section>
    </div>
  );
}
