import { useEffect, useState } from "react";
import { attachmentDownloadUrl, fetchTicket, removeAttachment, TicketDetail as TicketDetailData, uploadAttachment } from "./api.js";
import { useRequester } from "./requesterContext.js";

type TicketDetailProps = { ticketId: number; onBack: () => void };

export default function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { currentRequester } = useRequester();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [actionError, setActionError] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

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

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentRequester || !ticket) return;
    const form = event.currentTarget;
    const input = form.elements.namedItem("ticket-detail-attachment") as HTMLInputElement | null;
    const file = input?.files?.[0];
    setUploadError("");
    setUploadSuccess("");
    if (!file) { setUploadError("Choose an attachment before uploading."); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (file.size > 5 * 1024 * 1024 || !allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, JPEG, PNG, WEBP, and PDF files up to 5 MB are allowed.");
      return;
    }
    if (ticket.attachments.filter((attachment) => !attachment.removedAt).length >= 5) {
      setUploadError("A ticket may have at most five active attachments.");
      return;
    }
    setUploadState("uploading");
    try {
      await uploadAttachment(ticket.id, currentRequester.id, file);
      setTicket(await fetchTicket(ticketId, currentRequester.id));
      setUploadSuccess("Attachment uploaded successfully.");
      form.reset();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload attachment.");
    } finally {
      setUploadState("idle");
    }
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
    <form className="existing-attachment-upload" onSubmit={handleUpload}>
      <label htmlFor="ticket-detail-attachment">Add attachment to this ticket</label>
      <p className="attachment-help">Allowed: JPG, JPEG, PNG, WEBP, and PDF. Maximum 5 MB per file.</p>
      <input id="ticket-detail-attachment" name="ticket-detail-attachment" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" />
      <button className="btn btn-success" type="submit" disabled={uploadState === "uploading"}>{uploadState === "uploading" ? "Uploading..." : "Upload Attachment"}</button>
    </form>
    {uploadError && <p role="alert" className="text-danger">{uploadError}</p>}
    {uploadSuccess && <p role="status" className="text-success">{uploadSuccess}</p>}
    {ticket.attachments.length === 0 ? <p role="status">No attachments.</p> : <ul>{ticket.attachments.map((attachment) => <li key={attachment.id}>{attachment.removedAt ? <span>{attachment.originalName} <small>({attachment.mimeType}, {attachment.sizeBytes} bytes)</small> <span className="removed-label">— Removed: {attachment.removalReason ?? "No reason provided"}</span></span> : <><span>{attachment.originalName} <small>({attachment.mimeType}, {attachment.sizeBytes} bytes)</small></span><span><a className="attachment-action" href={attachmentDownloadUrl(attachment.id, currentRequester!.id)}>Download</a><button className="attachment-action danger" onClick={() => void handleRemove(attachment.id)}>Remove</button></span></>}</li>)}</ul>}
    </div></div>
  </section>;
}
