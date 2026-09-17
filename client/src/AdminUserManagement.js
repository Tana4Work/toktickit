import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createAdminUser, fetchAdminUsers, resetAdminInitialPassword, updateAdminUser } from "./api.js";
const roles = ["Requester", "ITStaff", "Administrator"];
const emptyForm = { name: "", email: "", role: "Requester", active: true, initialPassword: "" };
export default function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    async function load() { setLoading(true); setError(""); try {
        const params = new URLSearchParams();
        if (search.trim())
            params.set("search", search.trim());
        if (role)
            params.set("role", role);
        setUsers((await fetchAdminUsers(params)).data);
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load users.");
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { void load(); }, [search, role]);
    function startEdit(user) { setEditing(user.id); setForm({ name: user.name, email: user.email, role: user.role, active: user.active, initialPassword: "" }); setMessage(""); setError(""); }
    function updateField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
    async function submit(event) { event.preventDefault(); setMessage(""); setError(""); try {
        if (editing === null) {
            await createAdminUser(form);
            setMessage("User created. They must change the initial password at first login.");
        }
        else {
            await updateAdminUser(editing, { name: form.name, email: form.email, role: form.role, active: form.active });
            setMessage("User updated.");
        }
        setForm(emptyForm);
        setEditing(null);
        await load();
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to save user.");
    } }
    async function resetPassword(user) { const password = window.prompt(`New initial password for ${user.name}:`); if (!password)
        return; setMessage(""); setError(""); try {
        await resetAdminInitialPassword(user.id, password);
        setMessage("Initial password reset. The user must change it at next login.");
        await load();
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to reset password.");
    } }
    return _jsxs("section", { className: "admin-users-page", "aria-labelledby": "admin-users-heading", children: [_jsx("div", { className: "page-heading", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "ADMINISTRATION" }), _jsx("h1", { id: "admin-users-heading", children: "User Management" }), _jsx("p", { children: "Manage user access, roles, activation, and initial passwords." })] }) }), _jsxs("div", { className: "filter-card admin-user-filters", children: [_jsx("label", { htmlFor: "admin-user-search", children: "Search users" }), _jsx("input", { id: "admin-user-search", className: "form-control", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search by name or email" }), _jsx("label", { htmlFor: "admin-user-role", children: "Role" }), _jsxs("select", { id: "admin-user-role", className: "form-select", value: role, onChange: (event) => setRole(event.target.value), children: [_jsx("option", { value: "", children: "All roles" }), roles.map((item) => _jsx("option", { value: item, children: item }, item))] })] }), _jsxs("div", { className: "admin-user-layout", children: [_jsxs("form", { className: "content-card admin-user-form", onSubmit: submit, children: [_jsx("h2", { children: editing === null ? "Create User" : "Edit User" }), _jsx("label", { htmlFor: "admin-name", children: "Name" }), _jsx("input", { id: "admin-name", className: "form-control", value: form.name, onChange: (event) => updateField("name", event.target.value), required: true }), _jsx("label", { htmlFor: "admin-email", children: "Email" }), _jsx("input", { id: "admin-email", className: "form-control", type: "email", value: form.email, onChange: (event) => updateField("email", event.target.value), required: true }), _jsx("label", { htmlFor: "admin-role-edit", children: "Role" }), _jsx("select", { id: "admin-role-edit", className: "form-select", value: form.role, onChange: (event) => updateField("role", event.target.value), children: roles.map((item) => _jsx("option", { value: item, children: item }, item)) }), _jsxs("label", { className: "admin-checkbox", children: [_jsx("input", { type: "checkbox", checked: form.active, onChange: (event) => updateField("active", event.target.checked) }), " Active account"] }), editing === null && _jsxs(_Fragment, { children: [_jsx("label", { htmlFor: "admin-initial-password", children: "Initial password" }), _jsx("input", { id: "admin-initial-password", className: "form-control", type: "password", minLength: 8, value: form.initialPassword, onChange: (event) => updateField("initialPassword", event.target.value), required: true })] }), _jsxs("div", { className: "admin-form-actions", children: [_jsx("button", { className: "btn btn-success", type: "submit", children: editing === null ? "Create User" : "Save Changes" }), editing !== null && _jsx("button", { className: "btn btn-outline-secondary", type: "button", onClick: () => { setEditing(null); setForm(emptyForm); }, children: "Cancel" })] })] }), _jsxs("div", { className: "table-card admin-user-table-wrap", children: [message && _jsx("p", { className: "alert alert-success", role: "status", children: message }), error && _jsx("p", { className: "alert alert-danger", role: "alert", children: error }), loading ? _jsx("p", { role: "status", children: "Loading users..." }) : _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table admin-user-table", children: [_jsx("caption", { className: "visually-hidden", children: "Managed users" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Initial password" }), _jsx("th", { children: _jsx("span", { className: "visually-hidden", children: "Actions" }) })] }) }), _jsx("tbody", { children: users.map((user) => _jsxs("tr", { children: [_jsx("td", { children: user.name }), _jsx("td", { children: user.email }), _jsx("td", { children: user.role }), _jsx("td", { children: _jsx("span", { className: user.active ? "status-badge" : "status-badge inactive-status", children: user.active ? "Active" : "Inactive" }) }), _jsx("td", { children: user.mustChangePassword ? "Required" : "Set" }), _jsxs("td", { children: [_jsx("button", { className: "link-button", type: "button", onClick: () => startEdit(user), children: "Edit" }), _jsx("button", { className: "link-button admin-reset-link", type: "button", onClick: () => void resetPassword(user), children: "Reset password" })] })] }, user.id)) })] }) })] })] })] });
}
