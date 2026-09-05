import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDetail from "../../src/TicketDetail.js";
import * as api from "../../src/api.js";
import { RequesterProvider, useRequester } from "../../src/requesterContext.js";

function DetailHarness({ onBack }: { onBack: () => void }) {
  const { selectRequester } = useRequester();
  useEffect(() => { selectRequester({ id: 1, name: "Active User", email: "active@example.com" }); }, [selectRequester]);
  return <TicketDetail ticketId={10} onBack={onBack} />;
}

describe("Lab 2 Ticket Detail", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows read-only ticket data and returns to My Tickets", async () => {
    vi.spyOn(api, "fetchTicket").mockResolvedValue({ id: 10, ticketNumber: "TK-2026-000010", ticketDate: "2026-09-01T00:00:00.000Z", summary: "Laptop issue", description: "The laptop cannot start correctly.", requestedPriority: "MEDIUM", currentStatus: "New", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", requester: { id: 1, name: "Active User", email: "active@example.com" }, category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Laptop" }, attachments: [{ id: 1, originalName: "old.pdf", mimeType: "application/pdf", sizeBytes: 100, createdAt: "2026-09-01T00:00:00.000Z", removedAt: "2026-09-01T01:00:00.000Z", removalReason: "No longer needed" }] });
    const onBack = vi.fn();
    render(<RequesterProvider><DetailHarness onBack={onBack} /></RequesterProvider>);
    expect(await screen.findByText("TK-2026-000010")).toBeInTheDocument();
    expect(screen.getByText(/old.pdf/)).toHaveTextContent("No longer needed");
    await userEvent.setup().click(screen.getByRole("button", { name: /Back to My Tickets/ }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
