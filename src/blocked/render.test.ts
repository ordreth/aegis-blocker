// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createT } from "@/i18n";
import { DEFAULT_BLOCK_PAGE } from "@/shared/schema";
import type { BlockPageConfig } from "@/shared/types";
import { renderBlockPage } from "./render";

const config: BlockPageConfig = {
  ...DEFAULT_BLOCK_PAGE,
  redirect: { enabled: true, url: "https://calm.example/", delaySec: 3 },
};
const info = { pattern: null, lockUntil: null, snooze: null };

describe("automatic redirect", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const render = async (canRedirect: boolean) => {
    const root = document.createElement("div");
    const onLeave = vi.fn();
    await renderBlockPage(root, config, {
      t: createT("en"),
      url: "https://x.example/",
      info: { ...info, canRedirect },
      preview: false,
      onLeave,
    });
    return { root, onLeave };
  };

  it("leaves for the configured address after the countdown", async () => {
    const { root, onLeave } = await render(true);
    expect(root.querySelectorAll("button")).toHaveLength(1); // "stay here"
    vi.advanceTimersByTime(3000);
    expect(onLeave).toHaveBeenCalledWith("https://calm.example/");
  });

  it("stays put when that address is blocked too, instead of looping", async () => {
    const { root, onLeave } = await render(false);
    expect(root.querySelectorAll("button")).toHaveLength(0);
    vi.advanceTimersByTime(10_000);
    expect(onLeave).not.toHaveBeenCalled();
  });
});
