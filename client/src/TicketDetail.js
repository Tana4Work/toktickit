import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchTicket } from "./api.js";
import { useRequester } from "./requesterContext.js";
export default function TicketDetail({ ticketId, onBack }) {
    const { currentRequester } = useRequester();
    const [ticket, setTicket] = useState(null);
    const [state, setState] = useState("loading");
    useEffect(() => {
        if (!currentRequester)
            return;
        let mounted = true;
        setState("loading");
        void fetchTicket(ticketId, currentRequester.id).then((loadedTicket) => { if (mounted) {
            setTicket(loadedTicket);
            setState("ready");
        } }).catch(() => { if (mounted)
            setState("error"); });
        return () => { mounted = false; };
    }, [ticketId, currentRequester]);
    if (state === "loading")
        return _jsxs("section", { className: "mt-5", "aria-labelledby": "ticket-detail-heading", children: [_jsx("h2", { id: "ticket-detail-heading", className: "h4", children: "Ticket Detail" }), _jsx("p", { role: "status", children: "Loading ticket detail..." })] });
    if (state === "error" || !ticket)
        return _jsxs("section", { className: "mt-5", "aria-labelledby": "ticket-detail-heading", children: [_jsx("h2", { id: "ticket-detail-heading", className: "h4", children: "Ticket Detail" }), _jsx("p", { role: "alert", className: "text-danger", children: "Unable to load this ticket. It may not belong to the selected Requester." }), _jsx("button", { className: "btn btn-outline-success", onClick: onBack, children: "Back to My Tickets" })] });
    return _jsxs("section", { className: "mt-5", "aria-labelledby": "ticket-detail-heading", children: [_jsx("button", { className: "btn btn-link px-0 mb-3", onClick: onBack, children: "\u2190 Back to My Tickets" }), _jsx("h2", { id: "ticket-detail-heading", className: "h4", children: "Ticket Detail" }), _jsxs("dl", { className: "row", children: [_jsx("dt", { className: "col-sm-4", children: "Ticket Number" }), _jsx("dd", { className: "col-sm-8 fw-semibold", children: ticket.ticketNumber }), _jsx("dt", { className: "col-sm-4", children: "Ticket Date" }), _jsx("dd", { className: "col-sm-8", children: new Date(ticket.ticketDate).toLocaleString() }), _jsx("dt", { className: "col-sm-4", children: "Requester" }), _jsxs("dd", { className: "col-sm-8", children: [ticket.requester.name, " (", ticket.requester.email, ")"] }), _jsx("dt", { className: "col-sm-4", children: "Category" }), _jsx("dd", { className: "col-sm-8", children: ticket.category.name }), _jsx("dt", { className: "col-sm-4", children: "Related System" }), _jsx("dd", { className: "col-sm-8", children: ticket.relatedSystem.name }), _jsx("dt", { className: "col-sm-4", children: "Summary" }), _jsx("dd", { className: "col-sm-8", children: ticket.summary }), _jsx("dt", { className: "col-sm-4", children: "Requested Priority" }), _jsx("dd", { className: "col-sm-8", children: ticket.requestedPriority }), _jsx("dt", { className: "col-sm-4", children: "Description" }), _jsx("dd", { className: "col-sm-8", style: { whiteSpace: "pre-wrap" }, children: ticket.description }), _jsx("dt", { className: "col-sm-4", children: "Status" }), _jsx("dd", { className: "col-sm-8", children: _jsx("span", { className: "badge text-bg-success", children: ticket.currentStatus }) })] }), _jsx("h3", { className: "h5 mt-4", children: "Attachments" }), ticket.attachments.length === 0 ? _jsx("p", { role: "status", children: "No attachments." }) : _jsx("ul", { children: ticket.attachments.map((attachment) => _jsxs("li", { children: [attachment.originalName, " (", attachment.mimeType, ", ", attachment.sizeBytes, " bytes)", attachment.removedAt && ` — Removed: ${attachment.removalReason ?? "No reason provided"}`] }, attachment.id)) })] });
}
