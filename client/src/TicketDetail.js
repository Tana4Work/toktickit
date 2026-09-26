import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { addPublicComment, attachmentDownloadUrl, downloadAttachment, fetchTicket, indicateProblemResolved, removeAttachment, uploadAttachment } from "./api.js";
import { useRequester } from "./requesterContext.js";
export default function TicketDetail({ ticketId, onBack }) {
    const { currentRequester } = useRequester();
    const [ticket, setTicket] = useState(null);
    const [state, setState] = useState("loading");
    const [actionError, setActionError] = useState("");
    const [uploadState, setUploadState] = useState("idle");
    const [uploadError, setUploadError] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState("");
    const [comment, setComment] = useState("");
    const [commentState, setCommentState] = useState("idle");
    const [commentError, setCommentError] = useState("");
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
    useEffect(() => {
        if (!ticket || !currentRequester)
            return;
        const activeAttachments = ticket.attachments.filter((attachment) => !attachment.removedAt);
        const links = Array.from(document.querySelectorAll(".attachment-panel a.attachment-action"));
        const handlers = links.map((link, index) => {
            const attachment = activeAttachments[index];
            const handler = (event) => { event.preventDefault(); if (attachment)
                void handleDownload(attachment.id, attachment.originalName); };
            link.addEventListener("click", handler);
            return { link, handler };
        });
        return () => handlers.forEach(({ link, handler }) => link.removeEventListener("click", handler));
    }, [ticket, currentRequester]);
    async function handleRemove(attachmentId) {
        if (!currentRequester)
            return;
        const reason = window.prompt("Enter a removal reason:");
        if (!reason || !window.confirm("Remove this attachment? Its metadata will remain visible."))
            return;
        try {
            await removeAttachment(attachmentId, currentRequester.id, reason);
            setTicket(await fetchTicket(ticketId, currentRequester.id));
        }
        catch (error) {
            setActionError(error instanceof Error ? error.message : "Unable to remove attachment.");
        }
    }
    async function handleUpload(event) {
        event.preventDefault();
        if (!currentRequester || !ticket)
            return;
        const form = event.currentTarget;
        const input = form.elements.namedItem("ticket-detail-attachment");
        const file = input?.files?.[0];
        setUploadError("");
        setUploadSuccess("");
        if (!file) {
            setUploadError("Choose an attachment before uploading.");
            return;
        }
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
        }
        catch (error) {
            setUploadError(error instanceof Error ? error.message : "Unable to upload attachment.");
        }
        finally {
            setUploadState("idle");
        }
    }
    async function handleComment(event) {
        event.preventDefault();
        if (!ticket || !comment.trim()) {
            setCommentError("Comment cannot be empty.");
            return;
        }
        setCommentState("saving");
        setCommentError("");
        try {
            await addPublicComment(ticket.id, comment.trim());
            setComment("");
            setTicket(await fetchTicket(ticketId, currentRequester.id));
        }
        catch (error) {
            setCommentError(error instanceof Error ? error.message : "Unable to add Public Comment.");
        }
        finally {
            setCommentState("idle");
        }
    }
    async function handleProblemResolved() {
        if (!ticket)
            return;
        setActionError("");
        try {
            await indicateProblemResolved(ticket.id);
            setTicket(await fetchTicket(ticketId, currentRequester.id));
        }
        catch (error) {
            setActionError(error instanceof Error ? error.message : "Unable to record the resolution indication.");
        }
    }
    async function handleDownload(attachmentId, fileName) {
        if (!currentRequester)
            return;
        setActionError("");
        try {
            await downloadAttachment(attachmentId, currentRequester.id, fileName);
        }
        catch (error) {
            setActionError(error instanceof Error ? error.message : "Unable to download attachment.");
        }
    }
    if (state === "loading")
        return _jsxs("section", { className: "content-card", "aria-labelledby": "ticket-detail-heading", children: [_jsx("h2", { id: "ticket-detail-heading", children: "Ticket Detail" }), _jsx("p", { role: "status", children: "Loading ticket detail..." })] });
    if (state === "error" || !ticket)
        return _jsxs("section", { className: "content-card", "aria-labelledby": "ticket-detail-heading", children: [_jsx("h2", { id: "ticket-detail-heading", children: "Ticket Detail" }), _jsx("p", { role: "alert", className: "text-danger", children: "Unable to load this ticket. It may not belong to the selected Requester." }), _jsx("button", { className: "btn btn-outline-success", onClick: onBack, children: "Back to My Tickets" })] });
    return _jsxs("section", { className: "detail-page", "aria-labelledby": "ticket-detail-heading", children: [_jsx("button", { className: "back-link", onClick: onBack, children: "\u2190 Back to My Tickets" }), _jsxs("div", { className: "content-card", children: [_jsxs("div", { className: "section-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "REQUEST DETAILS" }), _jsx("h2", { id: "ticket-detail-heading", children: "Ticket Detail" })] }), _jsx("span", { className: "status-badge", children: ticket.currentStatus })] }), _jsxs("dl", { className: "row detail-grid", children: [_jsx("dt", { className: "col-sm-4", children: "Ticket Number" }), _jsx("dd", { className: "col-sm-8 fw-semibold", children: ticket.ticketNumber }), _jsx("dt", { className: "col-sm-4", children: "Ticket Date" }), _jsx("dd", { className: "col-sm-8", children: new Date(ticket.ticketDate).toLocaleString() }), _jsx("dt", { className: "col-sm-4", children: "Requester" }), _jsxs("dd", { className: "col-sm-8", children: [ticket.requester.name, " (", ticket.requester.email, ")"] }), _jsx("dt", { className: "col-sm-4", children: "Category" }), _jsx("dd", { className: "col-sm-8", children: ticket.category.name }), _jsx("dt", { className: "col-sm-4", children: "Related System" }), _jsx("dd", { className: "col-sm-8", children: ticket.relatedSystem.name }), _jsx("dt", { className: "col-sm-4", children: "Summary" }), _jsx("dd", { className: "col-sm-8", children: ticket.summary }), _jsx("dt", { className: "col-sm-4", children: "Requested Priority" }), _jsx("dd", { className: "col-sm-8", children: ticket.requestedPriority }), _jsx("dt", { className: "col-sm-4", children: "Description" }), _jsx("dd", { className: "col-sm-8", style: { whiteSpace: "pre-wrap" }, children: ticket.description }), _jsx("dt", { className: "col-sm-4", children: "Status" }), _jsx("dd", { className: "col-sm-8", children: _jsx("span", { className: "status-badge", children: ticket.currentStatus }) })] }), _jsxs("div", { className: "content-card public-comments-panel", children: [_jsx("div", { className: "section-heading", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "SHARED COMMUNICATION" }), _jsx("h3", { children: "Public Comments" })] }) }), (ticket.publicComments ?? []).length === 0 ? _jsx("p", { role: "status", children: "No Public Comments yet." }) : _jsx("ul", { className: "comment-list", children: (ticket.publicComments ?? []).map((item) => _jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: item.author.name }), _jsx("small", { children: new Date(item.createdAt).toLocaleString() })] }), _jsx("p", { children: item.content })] }, item.id)) }), _jsxs("form", { onSubmit: handleComment, className: "comment-form", children: [_jsx("label", { htmlFor: "public-comment", children: "Add a Public Comment" }), _jsx("textarea", { id: "public-comment", className: "form-control", rows: 3, value: comment, onChange: (event) => setComment(event.target.value), placeholder: "Write a message visible to the Requester and support team.", maxLength: 2000 }), commentError && _jsx("p", { role: "alert", className: "text-danger", children: commentError }), _jsx("button", { className: "btn btn-success", type: "submit", disabled: commentState === "saving" || !comment.trim(), children: commentState === "saving" ? "Posting..." : "Post Public Comment" })] })] }), _jsxs("div", { className: "content-card resolution-panel", children: [_jsx("h3", { children: "Reported Problem" }), _jsx("p", { children: ticket.problemAppearsResolvedAt ? `You indicated that this problem appeared resolved on ${new Date(ticket.problemAppearsResolvedAt).toLocaleString()}. IT Staff remain responsible for formally resolving or closing the Ticket.` : "If the issue appears fixed, let IT Staff know. This does not formally resolve or close the Ticket." }), !ticket.problemAppearsResolvedAt && _jsx("button", { className: "btn btn-outline-success", type: "button", onClick: () => void handleProblemResolved(), children: "Problem Appears Resolved" })] }), _jsxs("div", { className: "attachment-panel", children: [_jsx("h3", { children: "Attachments" }), actionError && _jsx("p", { role: "alert", className: "text-danger", children: actionError }), _jsxs("form", { className: "existing-attachment-upload", onSubmit: handleUpload, children: [_jsx("label", { htmlFor: "ticket-detail-attachment", children: "Add attachment to this ticket" }), _jsx("p", { className: "attachment-help", children: "Allowed: JPG, JPEG, PNG, WEBP, and PDF. Maximum 5 MB per file." }), _jsx("input", { id: "ticket-detail-attachment", name: "ticket-detail-attachment", type: "file", accept: ".jpg,.jpeg,.png,.webp,.pdf" }), _jsx("button", { className: "btn btn-success", type: "submit", disabled: uploadState === "uploading", children: uploadState === "uploading" ? "Uploading..." : "Upload Attachment" })] }), uploadError && _jsx("p", { role: "alert", className: "text-danger", children: uploadError }), uploadSuccess && _jsx("p", { role: "status", className: "text-success", children: uploadSuccess }), ticket.attachments.length === 0 ? _jsx("p", { role: "status", children: "No attachments." }) : _jsx("ul", { children: ticket.attachments.map((attachment) => _jsx("li", { children: attachment.removedAt ? _jsxs("span", { children: [attachment.originalName, " ", _jsxs("small", { children: ["(", attachment.mimeType, ", ", attachment.sizeBytes, " bytes)"] }), " ", _jsxs("span", { className: "removed-label", children: ["\u2014 Removed: ", attachment.removalReason ?? "No reason provided"] })] }) : _jsxs(_Fragment, { children: [_jsxs("span", { children: [attachment.originalName, " ", _jsxs("small", { children: ["(", attachment.mimeType, ", ", attachment.sizeBytes, " bytes)"] })] }), _jsxs("span", { children: [_jsx("a", { className: "attachment-action", href: attachmentDownloadUrl(attachment.id, currentRequester.id), children: "Download" }), _jsx("button", { className: "attachment-action danger", onClick: () => void handleRemove(attachment.id), children: "Remove" })] })] }) }, attachment.id)) })] })] })] });
}
