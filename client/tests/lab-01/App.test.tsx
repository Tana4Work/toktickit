import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Online and the seeded categories on success", async () => {
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

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Check System" }));

    expect(await screen.findByText("System Status: Online")).toBeInTheDocument();
    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
  });

  it("disables the button while loading", async () => {
    let resolveCheck!: (result: api.SystemStatus) => void;
    vi.spyOn(api, "checkSystem").mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: "Check System" });
    await user.click(button);

    expect(screen.getByText("Checking API status...")).toBeInTheDocument();
    expect(button).toBeDisabled();

    resolveCheck({ online: true, status: "ok", service: "TokTickIT API", categories: [] });
    expect(await screen.findByText("System Status: Online")).toBeInTheDocument();
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("database credentials leaked"));

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Check System" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("System Status: Offline");
    expect(alert).toHaveTextContent("Unable to reach the service desk API");
    expect(alert).not.toHaveTextContent("database credentials leaked");
  });
});
