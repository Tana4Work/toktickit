import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
export default function App() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
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
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("h1", { className: "h3 mb-4", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "loading" && _jsx("p", { className: "mt-4 text-secondary", children: "Checking API status..." }), state === "success" && (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-success fw-semibold", children: "System Status: Online" }), _jsx("ul", { "aria-label": "Categories", children: categories.map((category) => _jsx("li", { children: category.name }, category.id)) })] })), state === "error" && (_jsx("p", { className: "mt-4 text-danger", role: "alert", children: "System Status: Offline. Unable to reach the service desk API. Please try again." }))] }));
}
