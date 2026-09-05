import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { checkSystem, fetchDevelopmentRequesters } from "./api.js";
import { useRequester } from "./requesterContext.js";
import CreateTicket from "./CreateTicket.js";
import MyTickets from "./MyTickets.js";
import TicketDetail from "./TicketDetail.js";
export default function App() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [requesters, setRequesters] = useState([]);
    const [requesterState, setRequesterState] = useState("idle");
    const [selectionConfirmed, setSelectionConfirmed] = useState(false);
    const [activePage, setActivePage] = useState("create");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const { currentRequester, selectRequester, clearRequester } = useRequester();
    async function loadRequesters() {
        setRequesterState("loading");
        try {
            setRequesters(await fetchDevelopmentRequesters());
            setRequesterState("success");
        }
        catch {
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
        }
        catch {
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
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "brand", children: [_jsx("span", { className: "brand-mark", children: "\u25F7" }), _jsx("span", { children: "TokTickIT" })] }), _jsxs("div", { className: "topbar-nav", "aria-label": "Primary navigation", children: [_jsxs("button", { "aria-label": "My Tickets", disabled: !selectionConfirmed, className: selectionConfirmed && activePage === "tickets" ? "topbar-link active" : "topbar-link", onClick: () => { setActivePage("tickets"); setSelectedTicketId(null); }, children: ["\u2630 ", _jsx("span", { "aria-hidden": "true", children: "My Tickets" })] }), _jsxs("button", { "aria-label": "Create Ticket", disabled: !selectionConfirmed, className: selectionConfirmed && activePage === "create" ? "topbar-link active" : "topbar-link", onClick: () => setActivePage("create"), children: ["+ ", _jsx("span", { "aria-hidden": "true", children: "Create Ticket" })] })] }), selectionConfirmed && currentRequester && _jsxs("div", { className: "requester-chip", children: [_jsx("span", { className: "user-mark", "aria-hidden": "true" }), _jsx("span", { children: currentRequester.name }), _jsx("button", { className: "change-requester-button", onClick: handleChangeRequester, children: "Change Requester" })] })] }), _jsxs("main", { className: "page-content", children: [!selectionConfirmed && _jsxs("div", { className: "requester-screen-heading", children: [_jsx("span", { className: "home-icon", "aria-hidden": "true", children: "\u2302" }), _jsx("span", { "aria-hidden": "true", children: "\u203A" }), _jsx("strong", { children: "Development Requester Selection" })] }), !selectionConfirmed && _jsx("button", { className: "visually-hidden", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "loading" && _jsx("p", { className: "mt-4 text-secondary", children: "Checking API status..." }), state === "success" && (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-success fw-semibold", children: "System Status: Online" }), _jsx("ul", { "aria-label": "Categories", children: categories.map((category) => _jsx("li", { children: category.name }, category.id)) })] })), state === "error" && (_jsx("p", { className: "mt-4 text-danger", role: "alert", children: "System Status: Offline. Unable to reach the service desk API. Please try again." })), _jsxs("section", { className: selectionConfirmed ? "requester-context compact" : "requester-context requester-selection-card", "aria-labelledby": "requester-selection-heading", children: [!selectionConfirmed && _jsx("div", { className: "requester-hero-icon", "aria-hidden": "true" }), _jsx("h2", { id: "requester-selection-heading", className: "h5", children: selectionConfirmed ? "Development Requester Selection" : "Select Development Requester" }), _jsxs("p", { className: "text-secondary", children: ["Choose a development requester to simulate the current requester context for Lab 2.", _jsx("br", {}), "This is for testing only and is not a login screen."] }), !selectionConfirmed && _jsx("hr", {}), requesterState === "loading" && _jsx("p", { role: "status", children: "Loading Requesters..." }), requesterState === "error" && _jsxs("div", { role: "status", className: "text-danger", children: [_jsx("p", { children: "Unable to load Development Requesters. Please try again." }), _jsx("button", { className: "btn btn-outline-success", onClick: loadRequesters, children: "Try Again" })] }), requesterState === "success" && requesters.length === 0 && _jsx("p", { role: "status", children: "No active Development Requesters are available." }), requesterState === "success" && requesters.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "d-block", htmlFor: "development-requester", children: _jsxs("span", { className: "d-block mb-2", children: ["Development Requester ", _jsx("span", { className: "required-mark", children: "*" })] }) }), _jsxs("select", { id: "development-requester", "aria-label": "Development Requester", className: "form-select", value: currentRequester?.id ?? "", onChange: (event) => {
                                            const requester = requesters.find((item) => String(item.id) === event.target.value);
                                            if (requester) {
                                                selectRequester(requester);
                                                setSelectionConfirmed(false);
                                                setSelectedTicketId(null);
                                            }
                                        }, children: [_jsx("option", { value: "", children: "Select a Requester" }), requesters.map((requester) => _jsxs("option", { value: requester.id, children: [requester.name, " (", requester.email, ")"] }, requester.id))] }), !selectionConfirmed && _jsxs("div", { className: "active-requester-note", children: [_jsx("span", { "aria-hidden": "true", children: "\u24D8" }), " Only active development requesters are shown."] }), _jsx("button", { className: "btn btn-success mt-3", disabled: !currentRequester, onClick: () => { setActivePage("tickets"); setSelectionConfirmed(true); }, children: "Continue" })] })), selectionConfirmed && currentRequester && _jsx("div", { className: "mt-3", role: "status", children: _jsxs("p", { className: "text-success", children: ["Current testing Requester: ", currentRequester.name] }) }), !selectionConfirmed && _jsxs("div", { className: "lab-auth-note", children: [_jsx("span", { className: "note-icon", "aria-hidden": "true", children: "\u2662" }), _jsxs("div", { children: [_jsx("strong", { children: "Authentication coming in Lab 3" }), _jsx("p", { children: "In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account." })] })] })] }), selectionConfirmed && currentRequester && activePage === "create" && _jsx(CreateTicket, {}), selectionConfirmed && currentRequester && activePage === "tickets" && !selectedTicketId && _jsx(MyTickets, { onOpenTicket: (ticketId) => setSelectedTicketId(ticketId) }), selectionConfirmed && currentRequester && activePage === "tickets" && selectedTicketId && _jsx(TicketDetail, { ticketId: selectedTicketId, onBack: () => setSelectedTicketId(null) })] })] }));
}
