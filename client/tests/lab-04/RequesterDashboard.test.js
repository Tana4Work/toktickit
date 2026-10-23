import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "../../src/Dashboard.js";
import * as api from "../../src/api.js";
vi.mock("../../src/api.js", async () => {
    const actual = await vi.importActual("../../src/api.js");
    return { ...actual, fetchRequesterDashboard: vi.fn() };
});
describe("Lab 4 Requester dashboard", () => {
    it("shows owned metrics and drills down to My Tickets", async () => {
        const onTickets = vi.fn();
        vi.mocked(api.fetchRequesterDashboard).mockResolvedValue({ metrics: [{ key: "openTickets", label: "Open Tickets", value: 3, drillDown: { path: "/my-tickets", query: {} } }, { key: "waitingForRequester", label: "Waiting for Requester", value: 1, drillDown: { path: "/my-tickets", query: {} } }, { key: "recentlyUpdated", label: "Updated in the Last 7 Days", value: 2, drillDown: { path: "/my-tickets", query: {} } }, { key: "recentlyResolved", label: "Resolved in the Last 7 Days", value: 0, drillDown: { path: "/my-tickets", query: {} } }], recentTickets: [], dateBoundary: "2026-10-10T00:00:00.000Z" });
        render(_jsx(Dashboard, { staffMode: false, onTickets: onTickets }));
        expect(await screen.findByRole("heading", { name: "Requester Dashboard" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Open Tickets/ }));
        expect(onTickets).toHaveBeenCalledOnce();
    });
});
