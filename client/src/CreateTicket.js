import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createTicket, fetchCategories, fetchRelatedSystems, uploadAttachment } from "./api.js";
import { useRequester } from "./requesterContext.js";
const initialValues = { categoryId: "", relatedSystemId: "", summary: "", requestedPriority: "", description: "" };
export default function CreateTicket() {
    const { currentRequester } = useRequester();
    const [values, setValues] = useState(initialValues);
    const [categories, setCategories] = useState([]);
    const [systems, setSystems] = useState([]);
    const [referenceState, setReferenceState] = useState("loading");
    const [submitState, setSubmitState] = useState("idle");
    const [errors, setErrors] = useState({});
    const [createdTicket, setCreatedTicket] = useState(null);
    const [files, setFiles] = useState([]);
    const [attachmentError, setAttachmentError] = useState("");
    const [attachmentWarning, setAttachmentWarning] = useState("");
    useEffect(() => {
        let mounted = true;
        Promise.all([fetchCategories(), fetchRelatedSystems()]).then(([loadedCategories, loadedSystems]) => {
            if (!mounted)
                return;
            setCategories(loadedCategories);
            setSystems(loadedSystems);
            setReferenceState("ready");
        }).catch(() => { if (mounted)
            setReferenceState("error"); });
        return () => { mounted = false; };
    }, []);
    function update(field, value) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        if (submitState === "error")
            setSubmitState("idle");
    }
    function validate() {
        const next = {};
        if (!values.categoryId)
            next.categoryId = "Category is required.";
        if (!values.relatedSystemId)
            next.relatedSystemId = "Related System is required.";
        if (values.summary.trim().length < 3 || values.summary.trim().length > 120)
            next.summary = "Summary must be between 3 and 120 characters.";
        if (!values.requestedPriority)
            next.requestedPriority = "Requested Priority is required.";
        if (values.description.trim().length < 10 || values.description.trim().length > 2000)
            next.description = "Description must be between 10 and 2000 characters.";
        return next;
    }
    async function submit(event) {
        event.preventDefault();
        const nextErrors = validate();
        setErrors(nextErrors);
        if (attachmentError || files.length > 5) {
            if (!attachmentError)
                setAttachmentError("You can select at most five attachments.");
            return;
        }
        if (Object.keys(nextErrors).length || !currentRequester)
            return;
        setSubmitState("submitting");
        try {
            const ticket = await createTicket({ requesterId: currentRequester.id, categoryId: Number(values.categoryId), relatedSystemId: Number(values.relatedSystemId), summary: values.summary.trim(), requestedPriority: values.requestedPriority, description: values.description.trim() }, crypto.randomUUID());
            let failed = false;
            for (const file of files) {
                try {
                    await uploadAttachment(ticket.id, currentRequester.id, file);
                }
                catch {
                    failed = true;
                }
            }
            setCreatedTicket(ticket);
            setAttachmentWarning(failed ? "Ticket created, but one or more attachments could not be uploaded." : "");
            setSubmitState("success");
        }
        catch {
            setSubmitState("error");
        }
    }
    if (!currentRequester)
        return _jsx("p", { className: "mt-5", role: "status", children: "Select a Development Requester before creating a ticket." });
    if (referenceState === "loading")
        return _jsx("p", { className: "mt-5", role: "status", children: "Loading ticket reference data..." });
    if (referenceState === "error")
        return _jsx("p", { className: "mt-5 text-danger", role: "status", children: "Unable to load ticket reference data. Please try again." });
    return _jsxs("section", { className: "content-card", "aria-labelledby": "create-ticket-heading", children: [_jsx("div", { className: "section-heading", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "NEW REQUEST" }), _jsx("h2", { id: "create-ticket-heading", children: "Create Ticket" }), _jsx("p", { className: "text-secondary mb-0", children: "Submit a support request for the selected requester." })] }) }), _jsxs("p", { className: "context-line", children: ["Requester: ", _jsx("strong", { children: currentRequester.name })] }), submitState === "success" && createdTicket && _jsxs("div", { className: "alert alert-success", role: "status", children: [_jsxs("strong", { children: ["Ticket created: ", createdTicket.ticketNumber] }), _jsxs("div", { children: ["Ticket Date: ", new Date(createdTicket.ticketDate).toLocaleString()] }), _jsxs("div", { children: ["Status: ", createdTicket.currentStatus] })] }), submitState === "error" && _jsx("p", { className: "text-danger", role: "alert", children: "Unable to create ticket. Your entered values are still available." }), attachmentWarning && _jsx("p", { className: "text-warning", role: "alert", children: attachmentWarning }), _jsxs("form", { className: "ticket-form", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-category", children: "Category *" }), _jsxs("select", { id: "ticket-category", "aria-label": "Category *", className: `form-select ${errors.categoryId ? "is-invalid" : ""}`, value: values.categoryId, onChange: (e) => update("categoryId", e.target.value), children: [_jsx("option", { value: "", children: "Select a Category" }), categories.map((category) => _jsx("option", { value: category.id, children: category.name }, category.id))] }), errors.categoryId && _jsx("div", { className: "invalid-feedback", children: errors.categoryId })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-system", children: "Related System *" }), _jsxs("select", { id: "ticket-system", "aria-label": "Related System *", className: `form-select ${errors.relatedSystemId ? "is-invalid" : ""}`, value: values.relatedSystemId, onChange: (e) => update("relatedSystemId", e.target.value), children: [_jsx("option", { value: "", children: "Select a Related System" }), systems.map((system) => _jsx("option", { value: system.id, children: system.name }, system.id))] }), errors.relatedSystemId && _jsx("div", { className: "invalid-feedback", children: errors.relatedSystemId })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-summary", children: "Summary *" }), _jsx("input", { id: "ticket-summary", "aria-label": "Summary *", className: `form-control ${errors.summary ? "is-invalid" : ""}`, value: values.summary, onChange: (e) => update("summary", e.target.value) }), errors.summary && _jsx("div", { className: "invalid-feedback", children: errors.summary })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-priority", children: "Requested Priority *" }), _jsxs("select", { id: "ticket-priority", "aria-label": "Requested Priority *", className: `form-select ${errors.requestedPriority ? "is-invalid" : ""}`, value: values.requestedPriority, onChange: (e) => update("requestedPriority", e.target.value), children: [_jsx("option", { value: "", children: "Select Priority" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" }), _jsx("option", { value: "URGENT", children: "Urgent" })] }), errors.requestedPriority && _jsx("div", { className: "invalid-feedback", children: errors.requestedPriority })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-description", children: "Description *" }), _jsx("textarea", { id: "ticket-description", "aria-label": "Description *", className: `form-control ${errors.description ? "is-invalid" : ""}`, rows: 5, value: values.description, onChange: (e) => update("description", e.target.value) }), errors.description && _jsx("div", { className: "invalid-feedback", children: errors.description })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "form-label", htmlFor: "ticket-attachments", children: "Attachments" }), _jsx("input", { id: "ticket-attachments", className: "form-control", type: "file", multiple: true, accept: ".jpg,.jpeg,.png,.webp,.pdf", onChange: (e) => { const selected = Array.from(e.target.files ?? []); const invalid = selected.find((file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)); setFiles(selected.slice(0, 5)); setAttachmentError(invalid ? "Only JPG, JPEG, PNG, WEBP, and PDF files up to 5 MB are allowed." : selected.length > 5 ? "You can select at most five attachments." : ""); } }), attachmentError && _jsx("div", { className: "text-danger", role: "alert", children: attachmentError }), files.length > 0 && _jsxs("small", { className: "text-secondary", children: [files.length, " attachment(s) selected."] })] }), _jsx("button", { className: "btn btn-success", type: "submit", disabled: submitState === "submitting", children: submitState === "submitting" ? "Submitting..." : "Submit Ticket" })] })] });
}
