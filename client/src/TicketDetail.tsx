import { useEffect, useState } from "react";
import { fetchTicket, TicketDetail as TicketDetailData } from "./api.js";
import { useRequester } from "./requesterContext.js";

type TicketDetailProps = { ticketId: number; onBack: () => void };

export default function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { currentRequester } = useRequester();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!currentRequester) return;
    let mounted = true;
    setState("loading");
    void fetchTicket(ticketId, currentRequester.id).then((loadedTicket) => { if (mounted) { setTicket(loadedTicket); setState("ready"); } }).catch(() => { if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, [ticketId, currentRequester]);

  if (state === "loading") return <section className="mt-5" aria-labelledby="ticket-detail-heading"><h2 id="ticket-detail-heading" className="h4">Ticket Detail</h2><p role="status">Loading ticket detail...</p></section>;
  if (state === "error" || !ticket) return <section className="mt-5" aria-labelledby="ticket-detail-heading"><h2 id="ticket-detail-heading" className="h4">Ticket Detail</h2><p role="alert" className="text-danger">Unable to load this ticket. It may not belong to the selected Requester.</p><button className="btn btn-outline-success" onClick={onBack}>Back to My Tickets</button></section>;

  return <section className="mt-5" aria-labelledby="ticket-detail-heading">
    <button className="btn btn-link px-0 mb-3" onClick={onBack}>← Back to My Tickets</button>
    <h2 id="ticket-detail-heading" className="h4">Ticket Detail</h2>
    <dl className="row">
      <dt className="col-sm-4">Ticket Number</dt><dd className="col-sm-8 fw-semibold">{ticket.ticketNumber}</dd>
      <dt className="col-sm-4">Ticket Date</dt><dd className="col-sm-8">{new Date(ticket.ticketDate).toLocaleString()}</dd>
      <dt className="col-sm-4">Requester</dt><dd className="col-sm-8">{ticket.requester.name} ({ticket.requester.email})</dd>
      <dt className="col-sm-4">Category</dt><dd className="col-sm-8">{ticket.category.name}</dd>
      <dt className="col-sm-4">Related System</dt><dd className="col-sm-8">{ticket.relatedSystem.name}</dd>
      <dt className="col-sm-4">Summary</dt><dd className="col-sm-8">{ticket.summary}</dd>
      <dt className="col-sm-4">Requested Priority</dt><dd className="col-sm-8">{ticket.requestedPriority}</dd>
      <dt className="col-sm-4">Description</dt><dd className="col-sm-8" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</dd>
      <dt className="col-sm-4">Status</dt><dd className="col-sm-8"><span className="badge text-bg-success">{ticket.currentStatus}</span></dd>
    </dl>
    <h3 className="h5 mt-4">Attachments</h3>
    {ticket.attachments.length === 0 ? <p role="status">No attachments.</p> : <ul>{ticket.attachments.map((attachment) => <li key={attachment.id}>{attachment.originalName} ({attachment.mimeType}, {attachment.sizeBytes} bytes){attachment.removedAt && ` — Removed: ${attachment.removalReason ?? "No reason provided"}`}</li>)}</ul>}
  </section>;
}
