import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchRelatedSystems, fetchTickets, Category, RelatedSystem, TicketListItem, TicketListResponse, TicketPriority } from "./api.js";
import { useRequester } from "./requesterContext.js";

type Filters = { search: string; categoryId: string; relatedSystemId: string; requestedPriority: string; status: string; sortBy: string; sortDirection: "asc" | "desc" };
type MyTicketsProps = { onOpenTicket: (ticketId: number) => void };
const initialFilters: Filters = { search: "", categoryId: "", relatedSystemId: "", requestedPriority: "", status: "", sortBy: "updatedAt", sortDirection: "desc" };

export default function MyTickets({ onOpenTicket }: MyTicketsProps) {
  const { currentRequester } = useRequester();
  const [filters, setFilters] = useState(initialFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [result, setResult] = useState<TicketListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const query = useMemo(() => {
    const params = new URLSearchParams({ requesterId: String(currentRequester?.id ?? ""), page: String(page), pageSize: "10", sortBy: filters.sortBy, sortDirection: filters.sortDirection });
    for (const [key, value] of Object.entries(filters)) if (value && key !== "sortBy" && key !== "sortDirection") params.set(key, value);
    return params;
  }, [currentRequester, filters, page]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([fetchCategories(), fetchRelatedSystems()]).then(([loadedCategories, loadedSystems]) => { if (mounted) { setCategories(loadedCategories); setSystems(loadedSystems); } }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!currentRequester) return;
    let mounted = true;
    setState("loading");
    void fetchTickets(query).then((response) => { if (mounted) { setResult(response); setState("ready"); } }).catch(() => { if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, [currentRequester, query]);

  function update(name: keyof Filters, value: string) { setPage(1); setFilters((current) => ({ ...current, [name]: value })); }
  function clearFilters() { setPage(1); setFilters(initialFilters); }

  if (!currentRequester) return <p className="mt-5" role="status">Select a Development Requester before viewing tickets.</p>;
  if (state === "loading") return <section className="content-card" aria-labelledby="my-tickets-heading"><h2 id="my-tickets-heading">My Tickets</h2><p role="status">Loading tickets...</p></section>;
  if (state === "error") return <section className="content-card" aria-labelledby="my-tickets-heading"><h2 id="my-tickets-heading">My Tickets</h2><p role="alert" className="text-danger">Unable to load tickets. Please try again.</p></section>;

  const tickets: TicketListItem[] = result?.data ?? [];
  const pagination = result?.pagination;
  return <section className="tickets-page" aria-labelledby="my-tickets-heading">
    <div className="page-heading"><div><p className="eyebrow">REQUESTER PORTAL</p><h2 id="my-tickets-heading">My Tickets</h2><p className="text-secondary">View and track support requests for {currentRequester.name}.</p></div><button aria-label="Clear Filters" className="btn btn-outline-secondary" onClick={clearFilters}>↻ <span aria-hidden="true">Clear Filters</span></button></div>
    <div className="filter-card" aria-label="Ticket filters">
    <div className="row g-3">
      <div className="col-12"><label className="form-label" htmlFor="ticket-search">Search</label><input id="ticket-search" className="form-control" value={filters.search} onChange={(e) => update("search", e.target.value)} placeholder="Ticket number or summary" /></div>
      <div className="col-md-6"><label className="form-label" htmlFor="ticket-category-filter">Category</label><select id="ticket-category-filter" className="form-select" value={filters.categoryId} onChange={(e) => update("categoryId", e.target.value)}><option value="">All Categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="col-md-6"><label className="form-label" htmlFor="ticket-system-filter">Related System</label><select id="ticket-system-filter" className="form-select" value={filters.relatedSystemId} onChange={(e) => update("relatedSystemId", e.target.value)}><option value="">All Related Systems</option>{systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="col-md-6"><label className="form-label" htmlFor="ticket-priority-filter">Requested Priority</label><select id="ticket-priority-filter" className="form-select" value={filters.requestedPriority} onChange={(e) => update("requestedPriority", e.target.value)}><option value="">All Priorities</option>{(["LOW", "MEDIUM", "HIGH", "URGENT"] as TicketPriority[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="col-md-6"><label className="form-label" htmlFor="ticket-status-filter">Status</label><select id="ticket-status-filter" className="form-select" value={filters.status} onChange={(e) => update("status", e.target.value)}><option value="">All Statuses</option><option value="New">New</option></select></div>
      <div className="col-md-8"><label className="form-label" htmlFor="ticket-sort">Sort by</label><select id="ticket-sort" className="form-select" value={filters.sortBy} onChange={(e) => update("sortBy", e.target.value)}><option value="updatedAt">Last Updated</option><option value="ticketDate">Ticket Date</option><option value="ticketNumber">Ticket Number</option><option value="summary">Summary</option><option value="requestedPriority">Requested Priority</option><option value="currentStatus">Status</option></select></div>
      <div className="col-md-4"><label className="form-label" htmlFor="ticket-sort-direction">Direction</label><select id="ticket-sort-direction" className="form-select" value={filters.sortDirection} onChange={(e) => update("sortDirection", e.target.value as "asc" | "desc")}><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
    </div></div>
    {tickets.length === 0 ? <div className="empty-card" role="status">{Object.values(filters).some(Boolean) ? "No tickets match the selected filters." : "You have no tickets yet."}</div> : <div className="table-card"><div className="table-responsive"><table className="table align-middle"><caption className="visually-hidden">Tickets owned by {currentRequester.name}</caption><thead><tr><th>Ticket No.</th><th>Created Date</th><th>Summary</th><th>Category</th><th>Requested Priority</th><th>Status</th><th>Last Updated</th><th><span className="visually-hidden">Action</span></th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><button className="ticket-number" onClick={() => onOpenTicket(ticket.id)}>{ticket.ticketNumber}</button></td><td>{new Date(ticket.ticketDate).toLocaleDateString()}</td><td className="summary-cell">{ticket.summary}</td><td>{ticket.category.name}</td><td><span className={`priority-badge priority-${ticket.requestedPriority.toLowerCase()}`}>{ticket.requestedPriority}</span></td><td><span className="status-badge">{ticket.currentStatus}</span></td><td>{new Date(ticket.updatedAt).toLocaleDateString()}</td><td><button className="btn btn-sm btn-light" onClick={() => onOpenTicket(ticket.id)}>View</button></td></tr>)}</tbody></table></div></div>}
    {pagination && pagination.totalPages > 0 && <nav aria-label="Ticket pages" className="d-flex align-items-center justify-content-between"><span>Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} tickets)</span><div className="d-flex gap-2"><button className="btn btn-outline-success" disabled={pagination.page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="btn btn-outline-success" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></nav>}
  </section>;
}
