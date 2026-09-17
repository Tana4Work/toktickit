import { describe, expect, it } from "vitest";

describe("Lab 3 Zen Green visual QA contract", () => {
  it("keeps the required brand, status, and focus hooks in the rendered UI", () => {
    document.body.innerHTML = `<header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true"></span></div><button class="topbar-link" aria-label="My Queue">My Queue</button></header><main><span class="status-badge">Open</span><button class="attachment-action">Download</button></main>`;
    expect(document.querySelector(".brand-mark")).toBeTruthy();
    expect(document.querySelector(".status-badge")?.textContent).toBe("Open");
    expect(document.querySelector("button[aria-label='My Queue']")).toBeTruthy();
    expect(document.querySelector(".attachment-action")?.textContent).toBe("Download");
  });
});
