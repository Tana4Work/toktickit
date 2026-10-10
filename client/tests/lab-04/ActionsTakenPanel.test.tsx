import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActionsTakenPanel from "../../src/ActionsTakenPanel.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/api.js")>("../../src/api.js");
  return { ...actual, fetchActionsTaken: vi.fn(), createActionTaken: vi.fn(), updateActionTaken: vi.fn(), updateActionTakenStatus: vi.fn() };
});

const action = { id: 1, ticketId: 10, actionDateTime: "2026-10-10T09:00:00.000Z", description: "Restarted service", result: "Service recovered", performedBy: { id: 2, name: "Staff User", email: "staff@example.com", role: "ITStaff" as const }, assignedTo: null, followUpRequired: false, followUpNote: null, attachmentNotes: null, status: "Planned" as const, version: 1, createdAt: "2026-10-10T09:00:00.000Z", updatedAt: "2026-10-10T09:00:00.000Z" };

describe("Actions Taken panel", () => {
  it("shows requester read-only history without write controls", async () => {
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([action]);
    render(<ActionsTakenPanel ticketId={10} staffMode={false} />);
    expect(await screen.findByText("Restarted service")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Action Taken" })).not.toBeInTheDocument();
  });

  it("requires a follow-up note before staff can submit", async () => {
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);
    render(<ActionsTakenPanel ticketId={10} staffMode owners={[]} />);
    await screen.findByText("No Actions Taken have been recorded for this Ticket.");
    fireEvent.click(screen.getByRole("button", { name: "Add Action Taken" }));
    fireEvent.change(screen.getByLabelText("Description *"), { target: { value: "Investigated issue" } });
    fireEvent.change(screen.getByLabelText("Result *"), { target: { value: "Needs follow-up" } });
    fireEvent.click(screen.getByLabelText("Follow-up Required"));
    fireEvent.click(screen.getByRole("button", { name: "Save Action Taken" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Follow-up Note is required");
    expect(api.createActionTaken).not.toHaveBeenCalled();
  });
});
