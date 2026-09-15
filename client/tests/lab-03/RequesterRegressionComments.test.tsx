import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDetail from "../../src/TicketDetail.js";
import * as api from "../../src/api.js";
import { RequesterProvider, useRequester } from "../../src/requesterContext.js";
import type { TicketDetail as TicketDetailData } from "../../src/api.js";

const ticket: TicketDetailData = {
  id: 10, ticketNumber: "TK-2026-000010", ticketDate: "2026-09-01T00:00:00.000Z", summary: "Laptop issue",
  description: "The laptop cannot start correctly.", requestedPriority: "MEDIUM", currentStatus: "New",
  createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z",
  requester: { id: 1, name: "Active User", email: "active@example.com" },
  category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Laptop" }, attachments: [],
  problemAppearsResolvedAt: null,
  publicComments: [],
};

function DetailHarness() {
  const { selectRequester } = useRequester();
  useEffect(() => { selectRequester({ id: 1, name: "Active User", email: "active@example.com" }); }, [selectRequester]);
  return <TicketDetail ticketId={10} onBack={vi.fn()} />;
}

function renderDetail() {
  return render(<RequesterProvider><DetailHarness /></RequesterProvider>);
}

describe("Lab 3 requester regression and Public Comments", () => {
  afterEach(() => vi.restoreAllMocks());

  it("provides accessible labels and supports adding a Public Comment", async () => {
    vi.spyOn(api, "fetchTicket").mockResolvedValue(ticket);
    const addComment = vi.spyOn(api, "addPublicComment").mockResolvedValue({ id: 4, content: "Please update me.", createdAt: "2026-09-01T02:00:00.000Z", author: { id: 1, name: "Active User", email: "active@example.com", role: "Requester" } });
    const user = userEvent.setup();
    renderDetail();
    expect(await screen.findByText("No Public Comments yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a Public Comment")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Add a Public Comment"), "Please update me.");
    await user.click(screen.getByRole("button", { name: "Post Public Comment" }));
    expect(addComment).toHaveBeenCalledWith(10, "Please update me.");
  });

  it("records Problem Appears Resolved without presenting a formal status change", async () => {
    vi.spyOn(api, "fetchTicket").mockResolvedValue(ticket);
    const resolve = vi.spyOn(api, "indicateProblemResolved").mockResolvedValue({ problemAppearsResolvedAt: "2026-09-01T02:00:00.000Z" });
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText(/If the issue appears fixed/);
    await user.click(screen.getByRole("button", { name: "Problem Appears Resolved" }));
    expect(resolve).toHaveBeenCalledWith(10);
    expect(screen.getAllByText("New")).toHaveLength(2);
  });

  it("shows loading and API failure feedback", async () => {
    let release!: (value: TicketDetailData) => void;
    vi.spyOn(api, "fetchTicket").mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    renderDetail();
    expect(screen.getByRole("status")).toHaveTextContent("Loading ticket detail");
    await act(async () => { release(ticket); });
    await vi.waitFor(() => expect(screen.getByText("Ticket Detail")).toBeInTheDocument());

    vi.restoreAllMocks();
    vi.spyOn(api, "fetchTicket").mockRejectedValue(new Error("offline"));
    renderDetail();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load this ticket");
  });

  it("validates attachment input and exposes keyboard-accessible controls", async () => {
    vi.spyOn(api, "fetchTicket").mockResolvedValue(ticket);
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText("No attachments.");
    const input = screen.getByLabelText("Add attachment to this ticket");
    await user.upload(input, new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Upload Attachment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Only JPG, JPEG, PNG, WEBP, and PDF");
    expect(screen.getByRole("button", { name: "Upload Attachment" })).toBeVisible();
  });
});
