import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { checkSystem, fetchDevelopmentRequesters } from "./api.js";
import { useRequester } from "./requesterContext.js";
export default function App() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [requesters, setRequesters] = useState([]);
    const [requesterState, setRequesterState] = useState("idle");
    const [selectionConfirmed, setSelectionConfirmed] = useState(false);
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
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("h1", { className: "h3 mb-4", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "loading" && _jsx("p", { className: "mt-4 text-secondary", children: "Checking API status..." }), state === "success" && (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-success fw-semibold", children: "System Status: Online" }), _jsx("ul", { "aria-label": "Categories", children: categories.map((category) => _jsx("li", { children: category.name }, category.id)) })] })), state === "error" && (_jsx("p", { className: "mt-4 text-danger", role: "alert", children: "System Status: Offline. Unable to reach the service desk API. Please try again." })), _jsxs("section", { className: "mt-5", "aria-labelledby": "requester-selection-heading", children: [_jsx("h2", { id: "requester-selection-heading", className: "h5", children: "Development Requester Selection" }), _jsx("p", { className: "text-secondary", children: "This selector is for Lab 2 testing only. It is not authentication." }), requesterState === "loading" && _jsx("p", { role: "status", children: "Loading Requesters..." }), requesterState === "error" && _jsxs("div", { role: "status", className: "text-danger", children: [_jsx("p", { children: "Unable to load Development Requesters. Please try again." }), _jsx("button", { className: "btn btn-outline-success", onClick: loadRequesters, children: "Try Again" })] }), requesterState === "success" && requesters.length === 0 && _jsx("p", { role: "status", children: "No active Development Requesters are available." }), requesterState === "success" && requesters.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "d-block", htmlFor: "development-requester", children: _jsx("span", { className: "d-block mb-2", children: "Development Requester" }) }), _jsxs("select", { id: "development-requester", className: "form-select", value: currentRequester?.id ?? "", onChange: (event) => {
                                    const requester = requesters.find((item) => String(item.id) === event.target.value);
                                    if (requester) {
                                        selectRequester(requester);
                                        setSelectionConfirmed(false);
                                    }
                                }, children: [_jsx("option", { value: "", children: "Select a Requester" }), requesters.map((requester) => _jsxs("option", { value: requester.id, children: [requester.name, " (", requester.email, ")"] }, requester.id))] }), _jsx("button", { className: "btn btn-success mt-3", disabled: !currentRequester, onClick: () => setSelectionConfirmed(true), children: "Continue" })] })), selectionConfirmed && currentRequester && _jsxs("div", { className: "mt-3", role: "status", children: [_jsxs("p", { className: "text-success", children: ["Current testing Requester: ", currentRequester.name] }), _jsx("button", { className: "btn btn-link px-0", onClick: () => { clearRequester(); setSelectionConfirmed(false); }, children: "Change Requester" })] })] })] }));
}
