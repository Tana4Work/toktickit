import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { changePassword, checkSystem, fetchCurrentUser, getAuthToken, getStoredUser, login, logout } from "./api.js";
import { useRequester } from "./requesterContext.js";
import CreateTicket from "./CreateTicket.js";
import MyTickets from "./MyTickets.js";
import TicketDetail from "./TicketDetail.js";
function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try {
        onLogin(await login(email, password));
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    }
    finally {
        setBusy(false);
    } }
    return _jsxs("section", { className: "requester-context requester-selection-card auth-card", "aria-labelledby": "login-heading", children: [_jsx("div", { className: "requester-hero-icon", "aria-hidden": "true" }), _jsx("h1", { id: "login-heading", className: "h2", children: "Sign in to your account" }), _jsx("p", { className: "text-secondary", children: "Use your TokTickIT email address and password to continue." }), _jsx("hr", {}), _jsxs("form", { onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "mb-3 text-start", children: [_jsx("label", { className: "form-label", htmlFor: "login-email", children: "Email address" }), _jsx("input", { id: "login-email", className: "form-control", type: "email", autoComplete: "username", value: email, onChange: (event) => setEmail(event.target.value), required: true })] }), _jsxs("div", { className: "mb-3 text-start", children: [_jsx("label", { className: "form-label", htmlFor: "login-password", children: "Password" }), _jsxs("div", { className: "password-field", children: [_jsx("input", { id: "login-password", className: "form-control", type: showPassword ? "text" : "password", autoComplete: "current-password", value: password, onChange: (event) => setPassword(event.target.value), required: true }), _jsx("button", { type: "button", className: "password-toggle", "aria-label": showPassword ? "Hide password" : "Show password", onClick: () => setShowPassword((value) => !value), children: showPassword ? "Hide" : "Show" })] })] }), error && _jsxs("div", { className: "auth-error", role: "alert", children: [_jsx("span", { className: "auth-error-icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { children: [_jsx("strong", { children: "Invalid email or password." }), _jsx("span", { children: "Please try again." })] })] }), _jsx("button", { className: "btn btn-success auth-submit", type: "submit", disabled: busy || !email || !password, children: busy ? "Signing in..." : "Sign In" })] })] });
}
function ChangePasswordScreen({ onChanged }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const rules = [{ label: "At least 8 characters", valid: password.length >= 8 }, { label: "Include upper and lower case letters", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) }, { label: "Include a number and a special character", valid: /\d/.test(password) && /[^A-Za-z0-9]/.test(password) }];
    async function submit(event) { event.preventDefault(); if (!rules.every((rule) => rule.valid) || password !== confirmation) {
        setError("Use a valid password and make sure both new passwords match.");
        return;
    } setBusy(true); setError(""); try {
        onChanged(await changePassword(password, confirmation, currentPassword));
    }
    catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to change password.");
    }
    finally {
        setBusy(false);
    } }
    return _jsxs("section", { className: "requester-context requester-selection-card auth-card", "aria-labelledby": "change-password-heading", children: [_jsx("h1", { id: "change-password-heading", className: "h2", children: "Change Your Password" }), _jsx("p", { className: "text-secondary", children: "You must change your password to continue." }), _jsx("hr", {}), _jsxs("form", { onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "mb-3 text-start", children: [_jsx("label", { className: "form-label", htmlFor: "current-password", children: "Current (temporary) password" }), _jsxs("div", { className: "password-field", children: [_jsx("input", { id: "current-password", className: "form-control", type: showCurrent ? "text" : "password", autoComplete: "current-password", value: currentPassword, onChange: (event) => setCurrentPassword(event.target.value), required: true }), _jsx("button", { type: "button", className: "password-toggle", "aria-label": showCurrent ? "Hide current password" : "Show current password", onClick: () => setShowCurrent((value) => !value), children: showCurrent ? "Hide" : "Show" })] })] }), _jsxs("div", { className: "mb-3 text-start", children: [_jsx("label", { className: "form-label", htmlFor: "new-password", children: "New password" }), _jsxs("div", { className: "password-field", children: [_jsx("input", { id: "new-password", className: "form-control", type: showPassword ? "text" : "password", autoComplete: "new-password", value: password, onChange: (event) => setPassword(event.target.value), required: true }), _jsx("button", { type: "button", className: "password-toggle", "aria-label": showPassword ? "Hide new password" : "Show new password", onClick: () => setShowPassword((value) => !value), children: showPassword ? "Hide" : "Show" })] })] }), _jsxs("div", { className: "mb-3 text-start", children: [_jsx("label", { className: "form-label", htmlFor: "confirm-password", children: "Confirm new password" }), _jsxs("div", { className: "password-field", children: [_jsx("input", { id: "confirm-password", className: "form-control", type: showConfirmation ? "text" : "password", autoComplete: "new-password", value: confirmation, onChange: (event) => setConfirmation(event.target.value), required: true }), _jsx("button", { type: "button", className: "password-toggle", "aria-label": showConfirmation ? "Hide confirmation password" : "Show confirmation password", onClick: () => setShowConfirmation((value) => !value), children: showConfirmation ? "Hide" : "Show" })] })] }), _jsxs("div", { className: "password-rules", "aria-live": "polite", children: [_jsx("strong", { children: "Password must:" }), rules.map((rule) => _jsxs("span", { className: rule.valid ? "rule-valid" : "", children: [_jsx("span", { "aria-hidden": "true", children: rule.valid ? "✓" : "○" }), rule.label] }, rule.label))] }), error && _jsx("p", { className: "text-danger mt-3", role: "alert", children: error }), _jsx("button", { className: "btn btn-success auth-submit", type: "submit", disabled: busy || !currentPassword || !password || !confirmation, children: busy ? "Saving..." : "Continue" })] })] });
}
export default function App() {
    const [user, setUser] = useState(getStoredUser());
    const [authLoading, setAuthLoading] = useState(Boolean(getAuthToken()));
    const [activePage, setActivePage] = useState("tickets");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const { currentRequester, selectRequester, clearRequester } = useRequester();
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    useEffect(() => { if (!getAuthToken()) {
        setAuthLoading(false);
        return;
    } void fetchCurrentUser().then((current) => { setUser(current); selectRequester(current); }).catch(() => { void logout().then(() => setUser(null)); }).finally(() => setAuthLoading(false)); }, [selectRequester]);
    function handleAuthenticated(authUser) { setUser(authUser); selectRequester(authUser); setSelectedTicketId(null); setActivePage("tickets"); }
    async function handleLogout() { await logout(); clearRequester(); setUser(null); setSelectedTicketId(null); }
    async function handleCheck() { setState("loading"); try {
        const result = await checkSystem();
        setCategories(result.categories);
        setState("success");
    }
    catch {
        setCategories([]);
        setState("error");
    } }
    if (authLoading)
        return _jsx("div", { className: "app-shell", children: _jsx("main", { className: "page-content", children: _jsx("p", { role: "status", children: "Checking your session..." }) }) });
    if (!user)
        return _jsx("div", { className: "app-shell", children: _jsxs("main", { className: "page-content", children: [_jsxs("div", { className: "requester-screen-heading", children: [_jsx("span", { className: "home-icon", "aria-hidden": "true", children: "\u2302" }), _jsx("span", { "aria-hidden": "true", children: "\u203A" }), _jsx("strong", { children: "Login" })] }), _jsx(LoginScreen, { onLogin: handleAuthenticated })] }) });
    if (user.mustChangePassword)
        return _jsx("div", { className: "app-shell", children: _jsxs("main", { className: "page-content", children: [_jsxs("div", { className: "requester-screen-heading", children: [_jsx("span", { className: "home-icon", "aria-hidden": "true", children: "\u2302" }), _jsx("span", { "aria-hidden": "true", children: "\u203A" }), _jsx("strong", { children: "Change Password" })] }), _jsx(ChangePasswordScreen, { onChanged: handleAuthenticated })] }) });
    const requester = currentRequester ?? user;
    return _jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "brand", children: [_jsx("span", { className: "brand-mark", children: "\u25C8" }), _jsx("span", { children: "TokTickIT" })] }), _jsxs("div", { className: "topbar-nav", "aria-label": "Primary navigation", children: [_jsxs("button", { "aria-label": "My Tickets", className: activePage === "tickets" ? "topbar-link active" : "topbar-link", onClick: () => { setActivePage("tickets"); setSelectedTicketId(null); }, children: ["\u2630 ", _jsx("span", { "aria-hidden": "true", children: "My Tickets" })] }), _jsxs("button", { "aria-label": "Create Ticket", className: activePage === "create" ? "topbar-link active" : "topbar-link", onClick: () => { setActivePage("create"); setSelectedTicketId(null); }, children: ["+ ", _jsx("span", { "aria-hidden": "true", children: "Create Ticket" })] })] }), _jsxs("div", { className: "requester-chip", children: [_jsx("span", { className: "user-mark", "aria-hidden": "true" }), _jsxs("span", { children: [requester.name, " (", user.role, ")"] }), _jsx("button", { className: "change-requester-button", onClick: () => void handleLogout(), children: "Logout" })] })] }), _jsxs("main", { className: "page-content", children: [_jsx("button", { className: "visually-hidden", onClick: () => void handleCheck(), disabled: state === "loading", children: "Check System" }), state === "loading" && _jsx("p", { className: "mt-4 text-secondary", children: "Checking API status..." }), state === "success" && _jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-success fw-semibold", children: "System Status: Online" }), _jsx("ul", { "aria-label": "Categories", children: categories.map((category) => _jsx("li", { children: category.name }, category.id)) })] }), state === "error" && _jsx("p", { className: "mt-4 text-danger", role: "alert", children: "System Status: Offline. Please try again." }), activePage === "create" && _jsx(CreateTicket, {}), activePage === "tickets" && !selectedTicketId && _jsx(MyTickets, { onOpenTicket: (ticketId) => setSelectedTicketId(ticketId) }), activePage === "tickets" && selectedTicketId && _jsx(TicketDetail, { ticketId: selectedTicketId, onBack: () => setSelectedTicketId(null) })] })] });
}
