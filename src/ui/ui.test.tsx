// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handlers } from "@/background/handlers";
import { AegisError } from "@/shared/messages";
import { PopupApp } from "@/popup/App";
import { installChrome, type ChromeMock } from "@/test/chrome-mock";
import { PacksPanel } from "./PacksPanel";
import { AegisProvider } from "./store";

let mock: ChromeMock;

beforeEach(() => {
  mock = installChrome();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // Wire the UI to the real service-worker handlers, like chrome.runtime would.
  (chrome.runtime as unknown as { sendMessage: unknown }).sendMessage = async (req: { t: keyof typeof handlers }) => {
    try {
      const data = await (handlers[req.t] as (r: unknown) => Promise<unknown>)(req);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: { code: e instanceof AegisError ? e.code : "internal" } };
    }
  };
});
afterEach(cleanup);

const app = (ui: React.ReactNode) => render(<AegisProvider>{ui}</AegisProvider>);

describe("popup", () => {
  it("shows the empty state, detects the rule kind and adds a rule", async () => {
    const user = userEvent.setup();
    app(<PopupApp />);
    expect(await screen.findByText("Nothing blocked yet")).toBeTruthy();

    const input = screen.getByPlaceholderText(/reddit.com\/r\/memes/);
    await user.type(input, "/(shorts|reels)/");
    expect(await screen.findByText(/Detected: Regex/)).toBeTruthy();

    await user.clear(input);
    await user.type(input, "reddit.com/r/memes");
    expect(await screen.findByText(/Detected: Page \/ section/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    expect(await screen.findByText("reddit.com/r/memes")).toBeTruthy();
    expect(mock.dnr.rules).toHaveLength(1);
  });

  it("explains invalid input instead of adding it", async () => {
    const user = userEvent.setup();
    app(<PopupApp />);
    const input = await screen.findByPlaceholderText(/reddit.com\/r\/memes/);
    await user.type(input, "/(a+)+$/");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));
    expect(await screen.findByText(/could freeze the browser|Add a/i)).toBeTruthy();
    expect(mock.dnr.rules).toHaveLength(0);
  });

  it("locks rule editing while Absolute Mode is active", async () => {
    await handlers["rule.add"]({ t: "rule.add", input: { kind: "domain", pattern: "x.com" } });
    await handlers["lock.enable"]({ t: "lock.enable", hours: 1 });
    app(<PopupApp />);
    expect(await screen.findByText("x.com")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
    expect(screen.getAllByText(/Absolute Mode is active/).length).toBeGreaterThan(0);
    const row = screen.getByText("x.com").closest("li") as HTMLElement;
    expect(within(row).getByRole("switch").hasAttribute("disabled")).toBe(true);
  });
});

describe("vault", () => {
  it("hides the rules until the right password is entered", async () => {
    await handlers["rule.add"]({ t: "rule.add", input: { kind: "domain", pattern: "secret-site.com" } });
    await handlers["auth.setup"]({ t: "auth.setup", password: "correct-horse-battery" });
    await handlers["auth.logout"]({ t: "auth.logout" });

    const user = userEvent.setup();
    app(<PopupApp />);
    expect(await screen.findByText("Aegis is locked")).toBeTruthy();
    expect(screen.queryByText("secret-site.com")).toBeNull();

    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /Unlock/ }));
    expect(await screen.findByText("Wrong password or code.")).toBeTruthy();

    mock.local.dump()["aegis:throttle"] = { fails: 0, until: 0 };
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: /Unlock/ }));
    await waitFor(() => expect(screen.getByText("secret-site.com")).toBeTruthy());
  });
});

describe("quick packs", () => {
  it("adds a whole pack in one click", async () => {
    const user = userEvent.setup();
    app(<PacksPanel />);
    const buttons = await screen.findAllByRole("button", { name: /Add pack/ });
    await user.click(buttons[0] as HTMLElement);
    await waitFor(() => expect(mock.dnr.rules.length).toBeGreaterThan(5));
  });
});
