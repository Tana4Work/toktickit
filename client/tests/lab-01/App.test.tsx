import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/requesterContext.js";

describe("App", () => {
  function renderApp() { return render(<RequesterProvider><App /></RequesterProvider>); }
  it("renders the TokTickIT heading", () => {
    renderApp();
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("shows Online and the seeded categories on success", async () => {
    const user = { id: 1, name: "Active User", email: "active@example.com", role: "Requester" as const, active: true, mustChangePassword: false };
    window.localStorage.setItem("toktickit.auth.token", "test-token");
    window.localStorage.setItem("toktickit.auth.user", JSON.stringify(user));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(user);
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      status: "ok",
      service: "TokTickIT API",
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    const tester = userEvent.setup();
    renderApp();
    await tester.click(await screen.findByRole("button", { name: "Check System" }));

    expect(await screen.findByText("System Status: Online")).toBeInTheDocument();
    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
  });

  it("disables the button while loading", async () => {
    const user = { id: 1, name: "Active User", email: "active@example.com", role: "Requester" as const, active: true, mustChangePassword: false };
    window.localStorage.setItem("toktickit.auth.token", "test-token");
    window.localStorage.setItem("toktickit.auth.user", JSON.stringify(user));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(user);
    let resolveCheck!: (result: api.SystemStatus) => void;
    vi.spyOn(api, "checkSystem").mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    const tester = userEvent.setup();
    renderApp();
    const button = await screen.findByRole("button", { name: "Check System" });
    await tester.click(button);

    expect(screen.getByText("Checking API status...")).toBeInTheDocument();
    expect(button).toBeDisabled();

    resolveCheck({ online: true, status: "ok", service: "TokTickIT API", categories: [] });
    expect(await screen.findByText("System Status: Online")).toBeInTheDocument();
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    const user = { id: 1, name: "Active User", email: "active@example.com", role: "Requester" as const, active: true, mustChangePassword: false };
    window.localStorage.setItem("toktickit.auth.token", "test-token");
    window.localStorage.setItem("toktickit.auth.user", JSON.stringify(user));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(user);
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({ metrics: [], recentTickets: [], dateBoundary: "2026-09-01T00:00:00.000Z" });
    vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("database credentials leaked"));

    const tester = userEvent.setup();
    renderApp();
    await tester.click(await screen.findByRole("button", { name: "Check System" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("System Status: Offline");
    expect(alert).toHaveTextContent("Please try again");
    expect(alert).not.toHaveTextContent("database credentials leaked");
  });
});
