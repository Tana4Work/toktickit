import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createActionTaken, fetchActionsTaken, updateActionTaken, updateActionTakenStatus } from "./api.js";
const statuses = ["Planned", "InProgress", "Completed", "Cancelled"];
const newForm = () => ({ actionDateTime: new Date().toISOString().slice(0, 16), description: "", result: "", followUpRequired: false, followUpNote: null, attachmentNotes: null, assignedToId: null });
const displayDate = (value) => new Date(value).toLocaleString();
export default function ActionsTakenPanel({ ticketId, staffMode, owners = [] }) {
    const [actions, setActions] = useState([]);
    const [state, setState] = useState("loading");
    const [form, setForm] = useState(newForm());
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const editing = actions.find((item) => item.id === editingId) ?? null;
    async function reload() { setState("loading"); try {
        setActions(await fetchActionsTaken(ticketId));
        setState("ready");
    }
    catch {
        setState("error");
    } }
    useEffect(() => { void reload(); }, [ticketId]);
    function field(key, value) { setForm((current) => ({ ...current, [key]: value })); }
    function startEdit(action) { setEditingId(action.id); setForm({ actionDateTime: action.actionDateTime.slice(0, 16), description: action.description, result: action.result, followUpRequired: action.followUpRequired, followUpNote: action.followUpNote, attachmentNotes: action.attachmentNotes, assignedToId: action.assignedTo?.id ?? null }); setMessage(""); setError(""); }
    function cancelEdit() { setEditingId(null); setForm(newForm()); setError(""); }
    function validate() { if (!form.actionDateTime || !form.description.trim() || !form.result.trim())
        return "Action Date/Time, Description, and Result are required."; if (form.followUpRequired && !form.followUpNote?.trim())
        return "Follow-up Note is required when follow-up is needed."; return ""; }
    async function submit(event) { event.preventDefault(); const invalid = validate(); if (invalid) {
        setError(invalid);
        return;
    } setSaving(true); setError(""); setMessage(""); try {
        if (editing)
            await updateActionTaken(editing.id, editing.version, form);
        else
            await createActionTaken(ticketId, form, `lab4-action-${ticketId}-${Date.now()}`);
        setMessage(editing ? "Action Taken updated successfully." : "Action Taken created successfully.");
        cancelEdit();
        await reload();
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to save Action Taken. Your entered values were preserved.");
    }
    finally {
        setSaving(false);
    } }
    async function changeStatus(action, status) { setError(""); try {
        await updateActionTakenStatus(action.id, action.version, status);
        setMessage(`Action Taken marked ${status}.`);
        await reload();
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to update Action Taken status.");
    } }
    const transitions = (status) => status === "Planned" ? ["InProgress", "Cancelled"] : status === "InProgress" ? ["Completed", "Cancelled"] : [];
    return _jsxs("section", { className: "content-card actions-taken-panel", "aria-labelledby": `actions-taken-heading-${ticketId}`, children: [_jsxs("div", { className: "section-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "SERVICE HISTORY" }), _jsx("h3", { id: `actions-taken-heading-${ticketId}`, children: "Actions Taken" })] }), staffMode && editingId === null && _jsx("button", { className: "btn btn-success", type: "button", onClick: () => { setForm(newForm()); setEditingId(0); setMessage(""); setError(""); }, children: "Add Action Taken" })] }), message && _jsx("p", { className: "text-success", role: "status", children: message }), error && _jsx("p", { className: "text-danger", role: "alert", children: error }), staffMode && editingId !== null && _jsxs("form", { className: "action-taken-form", onSubmit: submit, noValidate: true, children: [_jsx("h4", { children: editing ? "Edit Action Taken" : "Create Action Taken" }), _jsx(ActionFields, { form: form, owners: owners, field: field }), _jsxs("div", { className: "action-form-buttons", children: [_jsx("button", { className: "btn btn-success", disabled: saving, type: "submit", children: saving ? "Saving..." : editing ? "Save Changes" : "Save Action Taken" }), _jsx("button", { className: "btn btn-outline-success", type: "button", onClick: cancelEdit, disabled: saving, children: "Cancel" })] })] }), state === "loading" && _jsx("p", { role: "status", children: "Loading Actions Taken..." }), state === "error" && _jsx("p", { role: "alert", className: "text-danger", children: "Unable to load Actions Taken. Please try again." }), state === "ready" && actions.length === 0 && _jsx("p", { role: "status", children: "No Actions Taken have been recorded for this Ticket." }), state === "ready" && actions.length > 0 && _jsx("ol", { className: "actions-taken-list", children: actions.map((action) => _jsxs("li", { className: "action-taken-card", children: [_jsxs("div", { className: "action-taken-header", children: [_jsxs("div", { children: [_jsx("strong", { children: displayDate(action.actionDateTime) }), _jsxs("span", { className: "action-taken-meta", children: ["Performed by ", action.performedBy.name] })] }), _jsx("span", { className: `status-badge action-status-${action.status.toLowerCase()}`, children: action.status })] }), _jsxs("dl", { className: "action-taken-details", children: [_jsx("dt", { children: "Description" }), _jsx("dd", { children: action.description }), _jsx("dt", { children: "Result" }), _jsx("dd", { children: action.result }), _jsx("dt", { children: "Follow-up Required" }), _jsx("dd", { children: action.followUpRequired ? `Yes${action.followUpNote ? ` — ${action.followUpNote}` : ""}` : "No" }), action.assignedTo && _jsxs(_Fragment, { children: [_jsx("dt", { children: "Assigned to" }), _jsx("dd", { children: action.assignedTo.name })] }), action.attachmentNotes && _jsxs(_Fragment, { children: [_jsx("dt", { children: "Attachment Notes" }), _jsx("dd", { children: action.attachmentNotes })] })] }), staffMode && action.status !== "Completed" && action.status !== "Cancelled" && _jsxs("div", { className: "action-taken-actions", children: [_jsx("button", { className: "btn btn-outline-success", type: "button", onClick: () => startEdit(action), children: "Edit" }), transitions(action.status).map((next) => _jsx("button", { className: "btn btn-outline-success", type: "button", onClick: () => void changeStatus(action, next), children: next === "InProgress" ? "Start" : next }, next))] })] }, action.id)) })] });
}
function ActionFields({ form, owners, field }) {
    return _jsxs("div", { className: "action-taken-fields", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "action-date-time", children: "Action Date/Time *" }), _jsx("input", { id: "action-date-time", className: "form-control", type: "datetime-local", value: form.actionDateTime, onChange: (event) => field("actionDateTime", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "action-assignee", children: "Assigned To" }), _jsxs("select", { id: "action-assignee", className: "form-select", value: form.assignedToId ?? "", onChange: (event) => field("assignedToId", event.target.value ? Number(event.target.value) : null), children: [_jsx("option", { value: "", children: "Unassigned" }), owners.map((owner) => _jsx("option", { value: owner.id, children: owner.name }, owner.id))] })] }), _jsxs("div", { className: "action-field-wide", children: [_jsx("label", { htmlFor: "action-description", children: "Description *" }), _jsx("textarea", { id: "action-description", className: "form-control", rows: 3, value: form.description, onChange: (event) => field("description", event.target.value), maxLength: 4000, required: true })] }), _jsxs("div", { className: "action-field-wide", children: [_jsx("label", { htmlFor: "action-result", children: "Result *" }), _jsx("textarea", { id: "action-result", className: "form-control", rows: 3, value: form.result, onChange: (event) => field("result", event.target.value), maxLength: 4000, required: true })] }), _jsxs("div", { className: "action-checkbox", children: [_jsx("input", { id: "action-follow-up", type: "checkbox", checked: form.followUpRequired, onChange: (event) => field("followUpRequired", event.target.checked) }), _jsx("label", { htmlFor: "action-follow-up", children: "Follow-up Required" })] }), form.followUpRequired && _jsxs("div", { className: "action-field-wide", children: [_jsx("label", { htmlFor: "action-follow-up-note", children: "Follow-up Note *" }), _jsx("textarea", { id: "action-follow-up-note", className: "form-control", rows: 2, value: form.followUpNote ?? "", onChange: (event) => field("followUpNote", event.target.value), maxLength: 2000, required: true })] }), _jsxs("div", { className: "action-field-wide", children: [_jsx("label", { htmlFor: "action-attachment-notes", children: "Attachment Notes" }), _jsx("textarea", { id: "action-attachment-notes", className: "form-control", rows: 2, value: form.attachmentNotes ?? "", onChange: (event) => field("attachmentNotes", event.target.value || null), maxLength: 2000 })] })] });
}
