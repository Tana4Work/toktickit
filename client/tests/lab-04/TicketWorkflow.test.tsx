import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StaffTicketDetail from "../../src/StaffTicketDetail.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/api.js")>("../../src/api.js");
  return { ...actual, fetchStaffTicket: vi.fn(), fetchStaffOwners: vi.fn(), updateStaffTicketStatus: vi.fn(), fetchActionsTaken: vi.fn() };
});

const ticket = {
  id: 21, ticketNumber: "TK-2026-910021", ticketDate: "2026-10-10T09:00:00.000Z", summary: "Workflow test ticket", description: "Workflow test", requestedPriority: "HIGH" as const, itPriority: "HIGH" as const, currentStatus: "Open" as const,
  requester: { id: 1, name: "Requester", email: "requester@example.com" }, owner: null, category: { id: 1, name: "Network" }, relatedSystem: { id: 1, name: "Campus Wi-Fi" }, attachments: [], publicComments: [], internalNotes: [], createdAt: "2026-10-10T09:00:00.000Z", updatedAt: "2026-10-10T09:00:00.000Z",
};

describe("Lab 4 Ticket workflow UI", () => {
  it("refreshes the ticket after a staff status change", async () => {
    vi.mocked(api.fetchStaffTicket).mockResolvedValue(ticket);
    vi.mocked(api.fetchStaffOwners).mockResolvedValue([]);
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);
    vi.mocked(api.updateStaffTicketStatus).mockResolvedValue({ ...ticket, currentStatus: "Resolved" });
    render(<StaffTicketDetail ticketId={21} onBack={vi.fn()} />);
    expect(await screen.findByText("Workflow test ticket")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Resolved" } });
    await waitFor(() => expect(api.updateStaffTicketStatus).toHaveBeenCalledWith(21, "Resolved"));
    expect(api.fetchStaffTicket).toHaveBeenCalledTimes(2);
  });
});
