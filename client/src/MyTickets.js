import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchRelatedSystems, fetchTickets } from "./api.js";
import { useRequester } from "./requesterContext.js";
const initialFilters = { search: "", categoryId: "", relatedSystemId: "", requestedPriority: "", status: "", sortBy: "updatedAt", sortDirection: "desc" };
export default function MyTickets({ onOpenTicket }) {
    const { currentRequester } = useRequester();
    const [filters, setFilters] = useState(initialFilters);
    const [categories, setCategories] = useState([]);
    const [systems, setSystems] = useState([]);
    const [result, setResult] = useState(null);
    const [page, setPage] = useState(1);
    const [state, setState] = useState("loading");
    const query = useMemo(() => {
        const params = new URLSearchParams({ requesterId: String(currentRequester?.id ?? ""), page: String(page), pageSize: "10", sortBy: filters.sortBy, sortDirection: filters.sortDirection });
        for (const [key, value] of Object.entries(filters))
            if (value && key !== "sortBy" && key !== "sortDirection")
                params.set(key, value);
        return params;
    }, [currentRequester, filters, page]);
    useEffect(() => {
        let mounted = true;
        void Promise.all([fetchCategories(), fetchRelatedSystems()]).then(([loadedCategories, loadedSystems]) => { if (mounted) {
            setCategories(loadedCategories);
            setSystems(loadedSystems);
        } }).catch(() => undefined);
        return () => { mounted = false; };
    }, []);
    useEffect(() => {
        if (!currentRequester)
            return;
        let mounted = true;
        setState("loading");
        void fetchTickets(query).then((response) => { if (mounted) {
            setResult(response);
            setState("ready");
        } }).catch(() => { if (mounted)
            setState("error"); });
        return () => { mounted = false; };
    }, [currentRequester, query]);
    function update(name, value) { setPage(1); setFilters((current) => ({ ...current, [name]: value })); }
    function clearFilters() { setPage(1); setFilters(initialFilters); }
    if (!currentRequester)
        return _jsx("p", { className: "mt-5", role: "status", children: "Select a Development Requester before viewing tickets." });
    if (state === "loading")
        return _jsxs("section", { className: "mt-5", "aria-labelledby": "my-tickets-heading", children: [_jsx("h2", { id: "my-tickets-heading", className: "h4", children: "My Tickets" }), _jsx("p", { role: "status", children: "Loading tickets..." })] });
    if (state === "error")
        return _jsxs("section", { className: "mt-5", "aria-labelledby": "my-tickets-heading", children: [_jsx("h2", { id: "my-tickets-heading", className: "h4", children: "My Tickets" }), _jsx("p", { role: "alert", className: "text-danger", children: "Unable to load tickets. Please try again." })] });
    const tickets = result?.data ?? [];
    const pagination = result?.pagination;
    return _jsxs("section", { className: "mt-5", "aria-labelledby": "my-tickets-heading", children: [_jsx("h2", { id: "my-tickets-heading", className: "h4", children: "My Tickets" }), _jsxs("p", { className: "text-secondary", children: ["Tickets owned by ", currentRequester.name] }), _jsxs("div", { className: "row g-2 mb-3", "aria-label": "Ticket filters", children: [_jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-search", children: "Search" }), _jsx("input", { id: "ticket-search", className: "form-control", value: filters.search, onChange: (e) => update("search", e.target.value), placeholder: "Ticket number or summary" })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-category-filter", children: "Category" }), _jsxs("select", { id: "ticket-category-filter", className: "form-select", value: filters.categoryId, onChange: (e) => update("categoryId", e.target.value), children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((item) => _jsx("option", { value: item.id, children: item.name }, item.id))] })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-system-filter", children: "Related System" }), _jsxs("select", { id: "ticket-system-filter", className: "form-select", value: filters.relatedSystemId, onChange: (e) => update("relatedSystemId", e.target.value), children: [_jsx("option", { value: "", children: "All Related Systems" }), systems.map((item) => _jsx("option", { value: item.id, children: item.name }, item.id))] })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-priority-filter", children: "Requested Priority" }), _jsxs("select", { id: "ticket-priority-filter", className: "form-select", value: filters.requestedPriority, onChange: (e) => update("requestedPriority", e.target.value), children: [_jsx("option", { value: "", children: "All Priorities" }), ["LOW", "MEDIUM", "HIGH", "URGENT"].map((item) => _jsx("option", { value: item, children: item }, item))] })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-status-filter", children: "Status" }), _jsxs("select", { id: "ticket-status-filter", className: "form-select", value: filters.status, onChange: (e) => update("status", e.target.value), children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "New", children: "New" })] })] }), _jsxs("div", { className: "col-md-8", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-sort", children: "Sort by" }), _jsxs("select", { id: "ticket-sort", className: "form-select", value: filters.sortBy, onChange: (e) => update("sortBy", e.target.value), children: [_jsx("option", { value: "updatedAt", children: "Last Updated" }), _jsx("option", { value: "ticketDate", children: "Ticket Date" }), _jsx("option", { value: "ticketNumber", children: "Ticket Number" }), _jsx("option", { value: "summary", children: "Summary" }), _jsx("option", { value: "requestedPriority", children: "Requested Priority" }), _jsx("option", { value: "currentStatus", children: "Status" })] })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-sort-direction", children: "Direction" }), _jsxs("select", { id: "ticket-sort-direction", className: "form-select", value: filters.sortDirection, onChange: (e) => update("sortDirection", e.target.value), children: [_jsx("option", { value: "desc", children: "Descending" }), _jsx("option", { value: "asc", children: "Ascending" })] })] })] }), _jsx("button", { className: "btn btn-outline-secondary mb-3", onClick: clearFilters, children: "Clear Filters" }), tickets.length === 0 ? _jsx("p", { role: "status", children: Object.values(filters).some(Boolean) ? "No tickets match the selected filters." : "You have no tickets yet." }) : _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table align-middle", children: [_jsxs("caption", { className: "visually-hidden", children: ["Tickets owned by ", currentRequester.name] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ticket Number" }), _jsx("th", { children: "Summary" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Related System" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: tickets.map((ticket) => _jsxs("tr", { children: [_jsx("td", { children: ticket.ticketNumber }), _jsx("td", { children: ticket.summary }), _jsx("td", { children: ticket.category.name }), _jsx("td", { children: ticket.relatedSystem.name }), _jsx("td", { children: ticket.requestedPriority }), _jsx("td", { children: ticket.currentStatus }), _jsx("td", { children: new Date(ticket.ticketDate).toLocaleDateString() }), _jsx("td", { children: _jsx("button", { className: "btn btn-sm btn-outline-success", onClick: () => onOpenTicket(ticket.id), children: "View Details" }) })] }, ticket.id)) })] }) }), pagination && pagination.totalPages > 0 && _jsxs("nav", { "aria-label": "Ticket pages", className: "d-flex align-items-center justify-content-between", children: [_jsxs("span", { children: ["Page ", pagination.page, " of ", pagination.totalPages, " (", pagination.totalItems, " tickets)"] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "btn btn-outline-success", disabled: pagination.page <= 1, onClick: () => setPage((value) => value - 1), children: "Previous" }), _jsx("button", { className: "btn btn-outline-success", disabled: pagination.page >= pagination.totalPages, onClick: () => setPage((value) => value + 1), children: "Next" })] })] })] });
}
