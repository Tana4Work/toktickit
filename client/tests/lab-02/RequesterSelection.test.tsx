import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/requesterContext.js";

function renderApp() {
  return render(<RequesterProvider><App /></RequesterProvider>);
}

describe("Lab 2 Development Requester selection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads and selects only active requesters", async () => {
    vi.spyOn(api, "fetchDevelopmentRequesters").mockResolvedValue([
      { id: 1, name: "Active User", email: "active@example.com" },
    ]);
    const user = userEvent.setup();
    renderApp();
    const select = await screen.findByRole("combobox", { name: "Development Requester" });
    await user.selectOptions(select, "1");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Current testing Requester: Active User")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change Requester" }));
    expect(screen.getByRole("combobox", { name: "Development Requester" })).toBeInTheDocument();
  });

  it("shows a safe failure message", async () => {
    vi.spyOn(api, "fetchDevelopmentRequesters").mockRejectedValue(new Error("credentials"));
    const user = userEvent.setup();
    renderApp();
    const status = await screen.findByText("Unable to load Development Requesters. Please try again.");
    expect(status).toHaveTextContent("Unable to load Development Requesters");
    expect(status).not.toHaveTextContent("credentials");
  });
});
