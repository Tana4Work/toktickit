import { useEffect, useState } from "react";
import { checkSystem, Category, DevelopmentRequester, fetchDevelopmentRequesters } from "./api.js";
import { useRequester } from "./requesterContext.js";
import CreateTicket from "./CreateTicket.js";
import MyTickets from "./MyTickets.js";
import TicketDetail from "./TicketDetail.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [requesters, setRequesters] = useState<DevelopmentRequester[]>([]);
  const [requesterState, setRequesterState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [activePage, setActivePage] = useState<"create" | "tickets">("create");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
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

  function handleChangeRequester() {
    clearRequester();
    setSelectionConfirmed(false);
    setSelectedTicketId(null);
    setActivePage("tickets");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">◷</span><span>TokTickIT</span></div>
        <div className="topbar-nav" aria-label="Primary navigation">
          <button aria-label="My Tickets" disabled={!selectionConfirmed} className={selectionConfirmed && activePage === "tickets" ? "topbar-link active" : "topbar-link"} onClick={() => { setActivePage("tickets"); setSelectedTicketId(null); }}>&#9776; <span aria-hidden="true">My Tickets</span></button>
          <button aria-label="Create Ticket" disabled={!selectionConfirmed} className={selectionConfirmed && activePage === "create" ? "topbar-link active" : "topbar-link"} onClick={() => setActivePage("create")}>&#43; <span aria-hidden="true">Create Ticket</span></button>
        </div>
        {selectionConfirmed && currentRequester && <div className="requester-chip"><span className="user-mark" aria-hidden="true" /><span>{currentRequester.name}</span><button className="change-requester-button" onClick={handleChangeRequester}>Change Requester</button></div>}
      </header>

      <main className="page-content">
      {!selectionConfirmed && <div className="requester-screen-heading"><span className="home-icon" aria-hidden="true">⌂</span><span aria-hidden="true">›</span><strong>Development Requester Selection</strong></div>}

      {!selectionConfirmed && <button className="visually-hidden" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>}

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

      <section className={selectionConfirmed ? "requester-context compact" : "requester-context requester-selection-card"} aria-labelledby="requester-selection-heading">
        {!selectionConfirmed && <div className="requester-hero-icon" aria-hidden="true" />}
        <h2 id="requester-selection-heading" className="h5">{selectionConfirmed ? "Development Requester Selection" : "Select Development Requester"}</h2>
        <p className="text-secondary">Choose a development requester to simulate the current requester context for Lab 2.<br />This is for testing only and is not a login screen.</p>
        {!selectionConfirmed && <hr />}
        {requesterState === "loading" && <p role="status">Loading Requesters...</p>}
        {requesterState === "error" && <div role="status" className="text-danger"><p>Unable to load Development Requesters. Please try again.</p><button className="btn btn-outline-success" onClick={loadRequesters}>Try Again</button></div>}
        {requesterState === "success" && requesters.length === 0 && <p role="status">No active Development Requesters are available.</p>}
        {requesterState === "success" && requesters.length > 0 && (
          <div>
            <label className="d-block" htmlFor="development-requester">
              <span className="d-block mb-2">Development Requester <span className="required-mark">*</span></span>
            </label>
            <select id="development-requester" aria-label="Development Requester" className="form-select" value={currentRequester?.id ?? ""} onChange={(event) => {
              const requester = requesters.find((item) => String(item.id) === event.target.value);
              if (requester) {
                selectRequester(requester);
                setSelectionConfirmed(false); setSelectedTicketId(null);
              }
            }}>
              <option value="">Select a Requester</option>
              {requesters.map((requester) => <option key={requester.id} value={requester.id}>{requester.name} ({requester.email})</option>)}
            </select>
            {!selectionConfirmed && <div className="active-requester-note"><span aria-hidden="true">ⓘ</span> Only active development requesters are shown.</div>}
            <button className="btn btn-success mt-3" disabled={!currentRequester} onClick={() => { setActivePage("tickets"); setSelectionConfirmed(true); }}>Continue</button>
          </div>
        )}
        {selectionConfirmed && currentRequester && <div className="mt-3" role="status"><p className="text-success">Current testing Requester: {currentRequester.name}</p></div>}
        {!selectionConfirmed && <div className="lab-auth-note"><span className="note-icon" aria-hidden="true">♢</span><div><strong>Authentication coming in Lab 3</strong><p>In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.</p></div></div>}
      </section>
      {selectionConfirmed && currentRequester && activePage === "create" && <CreateTicket />}
      {selectionConfirmed && currentRequester && activePage === "tickets" && !selectedTicketId && <MyTickets onOpenTicket={(ticketId) => setSelectedTicketId(ticketId)} />}
      {selectionConfirmed && currentRequester && activePage === "tickets" && selectedTicketId && <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />}
      </main>
    </div>
  );
}
