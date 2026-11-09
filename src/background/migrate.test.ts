import { beforeEach, describe, expect, it } from "vitest";
import type { Request } from "@/shared/messages";
import type { Rule } from "@/shared/types";
import { installChrome, type ChromeMock } from "@/test/chrome-mock";
import { handlers } from "./handlers";
import { migrate } from "./migrate";
import { K } from "./state";

let mock: ChromeMock;
const call = <T extends Request["t"]>(req: Extract<Request, { t: T }>) =>
  (handlers[req.t] as (r: unknown) => Promise<unknown>)(req);

beforeEach(() => {
  mock = installChrome();
});

describe("migration from v1 when chrome.storage.sync is unavailable", () => {
  const seed = () =>
    installChrome({
      local: { block_rules: [{ id: 1, urlPattern: "reddit.com" }] },
      sync: {
        aegis_settings: { theme: "light", absoluteModeDurationHours: 48 },
        aegis_security_config: { isEnabled: true, passwordHash: "ab".repeat(32), salt: "s", recoveryHash: "cd".repeat(32) },
      },
    });

  it("keeps the v1 password and settings for a later attempt instead of deleting them", async () => {
    mock = seed();
    mock.sync.get.mockRejectedValue(new Error("sync is not available"));
    await migrate();
    expect(mock.sync.clear).not.toHaveBeenCalled();
    expect(mock.sync.dump()).toHaveProperty("aegis_security_config");
    // the part that could be read is already in force
    expect((mock.local.dump()[K.rules] as Rule[]).map((r) => r.pattern)).toEqual(["reddit.com"]);
    expect(mock.local.dump()[K.version]).toBeUndefined();

    // next start of the worker, sync answers again
    mock.sync.get.mockRestore();
    const before = structuredClone(mock.local.dump()[K.rules]);
    await migrate();
    expect(mock.local.dump()[K.auth]).toMatchObject({ password: { kdf: "sha256-legacy" } });
    expect(mock.local.dump()[K.settings]).toMatchObject({ theme: "light", lockHours: 48 });
    expect(mock.local.dump()[K.rules]).toEqual(before);
    expect(mock.local.dump()[K.version]).toBe(2);
    expect(mock.sync.dump()).toEqual({});
  });

  it("does not overwrite what the owner set up between two attempts", async () => {
    mock = seed();
    mock.sync.get.mockRejectedValue(new Error("sync is not available"));
    await migrate();
    await call({ t: "blockpage.set", config: { title: "Mine" } as never });
    await call({ t: "settings.set", patch: { theme: "dark", lockHours: 3 } });
    mock.sync.get.mockRestore();
    await migrate();
    expect(mock.local.dump()[K.blockPage]).toMatchObject({ title: "Mine" });
    expect(mock.local.dump()[K.settings]).toMatchObject({ theme: "dark", lockHours: 3 });
  });
});
