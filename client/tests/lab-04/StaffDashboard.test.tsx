import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "../../src/Dashboard.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/api.js")>("../../src/api.js");
  return { ...actual, fetchStaffDashboard: vi.fn() };
});

describe("Lab 4 Staff dashboard", () => {
  it("shows operational counts and drills down to the queue", async () => {
    const onTickets = vi.fn();
    vi.mocked(api.fetchStaffDashboard).mockResolvedValue({ metrics: [{ key: "unassignedTickets", label: "Unassigned Tickets", value: 2, drillDown: { path: "/queue", query: {} } }, { key: "myOwnedTickets", label: "My Owned Tickets", value: 4, drillDown: { path: "/queue", query: {} } }, { key: "recentlyUpdated", label: "Updated in the Last 7 Days", value: 5, drillDown: { path: "/queue", query: {} } }, { key: "myActionsTaken", label: "My Actions Taken (7 Days)", value: 1, drillDown: { path: "/queue", query: {} } }], statusCounts: { Open: 2 }, priorityCounts: { HIGH: 1 }, recentTickets: [], urgentTickets: [], dateBoundary: "2026-10-10T00:00:00.000Z" });
    render(<Dashboard staffMode onTickets={onTickets} />);
    expect(await screen.findByRole("heading", { name: "Staff Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Ticket Status Counts")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Unassigned Tickets/ }));
    expect(onTickets).toHaveBeenCalledOnce();
  });
});
