import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/requesterContext.js";

describe("Lab 2 My Tickets", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the owned list and supports Clear Filters", async () => {
    vi.spyOn(api, "fetchDevelopmentRequesters").mockResolvedValue([{ id: 1, name: "Active User", email: "active@example.com" }]);
    vi.spyOn(api, "fetchCategories").mockResolvedValue([{ id: 1, name: "Hardware" }]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([{ id: 1, name: "Laptop" }]);
    vi.spyOn(api, "fetchTickets").mockResolvedValue({ data: [{ id: 10, ticketNumber: "TK-2026-000010", summary: "Laptop battery issue", category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Laptop" }, requestedPriority: "MEDIUM", currentStatus: "New", ticketDate: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z" }], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 } });
    const user = userEvent.setup();
    render(<RequesterProvider><App /></RequesterProvider>);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Development Requester" }), "1");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "My Tickets" }));
    expect(await screen.findByText("TK-2026-000010")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Requested Priority"), "HIGH");
    await user.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByLabelText("Requested Priority")).toHaveValue("");
  });
});
