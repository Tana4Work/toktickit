import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("Authentication entry regression", () => {
  afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear(); });

  it("signs in and reaches the dashboard", async () => {
    vi.spyOn(api, "login").mockResolvedValue({ id: 1, name: "Active User", email: "active@example.com", role: "Requester", active: true, mustChangePassword: false });
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "active@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    expect(await screen.findByRole("button", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("shows a safe failure message", async () => {
    vi.spyOn(api, "login").mockRejectedValue(new Error("credentials"));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email address"), "active@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    const status = await screen.findByRole("alert");
    expect(status).toHaveTextContent("Invalid email or password");
    expect(status).not.toHaveTextContent("credentials");
  });
});
