import { useEffect, useState } from "react";
import { attachmentDownloadUrl, fetchTicket, removeAttachment, uploadAttachment, TicketDetail as TicketDetailData } from "./api.js";
import { useRequester } from "./requesterContext.js";

type TicketDetailProps = { ticketId: number; onBack: () => void };

export default function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { currentRequester } = useRequester();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [actionError, setActionError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentRequester) return;
    let mounted = true;
    setState("loading");
    void fetchTicket(ticketId, currentRequester.id).then((loadedTicket) => { if (mounted) { setTicket(loadedTicket); setState("ready"); } }).catch(() => { if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, [ticketId, currentRequester]);

  async function handleRemove(attachmentId: number) {
    if (!currentRequester) return;
    const reason = window.prompt("Enter a removal reason:");
    if (!reason || !window.confirm("Remove this attachment? Its metadata will remain visible.")) return;
    try { await removeAttachment(attachmentId, currentRequester.id, reason); setTicket(await fetchTicket(ticketId, currentRequester.id)); } catch (error) { setActionError(error instanceof Error ? error.message : "Unable to remove attachment."); }
  }

  async function handleUpload() {
    if (!currentRequester || !selectedFile) return;
    setUploading(true); setActionError("");
    try {
      await uploadAttachment(ticketId, currentRequester.id, selectedFile);
      setSelectedFile(null);
      const input = document.getElementById("existing-ticket-attachment") as HTMLInputElement | null;
      if (input) input.value = "";
      setTicket(await fetchTicket(ticketId, currentRequester.id));
    } catch (error) { setActionError(error instanceof Error ? error.message : "Unable to upload attachment."); }
    finally { setUploading(false); }
  }

  if (state === "loading") return <section className="content-card" aria-labelledby="ticket-detail-heading"><h2 id="ticket-detail-heading">Ticket Detail</h2><p role="status">Loading ticket detail...</p></section>;
  if (state === "error" || !ticket) return <section className="content-card" aria-labelledby="ticket-detail-heading"><h2 id="ticket-detail-heading">Ticket Detail</h2><p role="alert" className="text-danger">Unable to load this ticket. It may not belong to the selected Requester.</p><button className="btn btn-outline-success" onClick={onBack}>Back to My Tickets</button></section>;

  return <section className="detail-page" aria-labelledby="ticket-detail-heading">
    <button className="back-link" onClick={onBack}>← Back to My Tickets</button>
    <div className="content-card"><div className="section-heading"><div><p className="eyebrow">REQUEST DETAILS</p><h2 id="ticket-detail-heading">Ticket Detail</h2></div><span className="status-badge">{ticket.currentStatus}</span></div>
    <dl className="row detail-grid">
      <dt className="col-sm-4">Ticket Number</dt><dd className="col-sm-8 fw-semibold">{ticket.ticketNumber}</dd>
      <dt className="col-sm-4">Ticket Date</dt><dd className="col-sm-8">{new Date(ticket.ticketDate).toLocaleString()}</dd>
      <dt className="col-sm-4">Requester</dt><dd className="col-sm-8">{ticket.requester.name} ({ticket.requester.email})</dd>
      <dt className="col-sm-4">Category</dt><dd className="col-sm-8">{ticket.category.name}</dd>
      <dt className="col-sm-4">Related System</dt><dd className="col-sm-8">{ticket.relatedSystem.name}</dd>
      <dt className="col-sm-4">Summary</dt><dd className="col-sm-8">{ticket.summary}</dd>
      <dt className="col-sm-4">Requested Priority</dt><dd className="col-sm-8">{ticket.requestedPriority}</dd>
      <dt className="col-sm-4">Description</dt><dd className="col-sm-8" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</dd>
      <dt className="col-sm-4">Status</dt><dd className="col-sm-8"><span className="status-badge">{ticket.currentStatus}</span></dd>
    </dl>
    <div className="attachment-panel"><h3>Attachments</h3>
    {actionError && <p role="alert" className="text-danger">{actionError}</p>}
    <div className="existing-attachment-upload"><label htmlFor="existing-ticket-attachment">Add attachment to this ticket</label><input id="existing-ticket-attachment" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => { const file = event.target.files?.[0] ?? null; const valid = file && file.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type); setSelectedFile(valid ? file : null); setActionError(file && !valid ? "Only JPG, JPEG, PNG, WEBP, and PDF files up to 5 MB are allowed." : ""); }} /><button className="btn btn-success" type="button" disabled={!selectedFile || uploading} onClick={() => void handleUpload()}>{uploading ? "Uploading..." : "Upload Attachment"}</button></div>
    {ticket.attachments.length === 0 ? <p role="status">No attachments.</p> : <ul>{ticket.attachments.map((attachment) => <li key={attachment.id}>{attachment.removedAt ? <span>{attachment.originalName} <small>({attachment.mimeType}, {attachment.sizeBytes} bytes)</small> <span className="removed-label">— Removed: {attachment.removalReason ?? "No reason provided"}</span></span> : <><span>{attachment.originalName} <small>({attachment.mimeType}, {attachment.sizeBytes} bytes)</small></span><span><a className="attachment-action" href={attachmentDownloadUrl(attachment.id, currentRequester!.id)}>Download</a><button className="attachment-action danger" onClick={() => void handleRemove(attachment.id)}>Remove</button></span></>}</li>)}</ul>}
    </div></div>
  </section>;
}
