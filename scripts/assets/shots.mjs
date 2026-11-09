// Screenshots the static scenes produced by `vitest run --config vitest.assets.config.ts`
// with headless Firefox and writes opaque 24-bit PNGs (the Chrome Web Store rejects alpha).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PNG } from "pngjs";

const BUILD = resolve("store-assets/.build");
const sizes = JSON.parse(readFileSync(join(BUILD, "sizes.json"), "utf8"));
const firefox = process.env.AEGIS_FIREFOX ?? "firefox";
const work = mkdtempSync(join(tmpdir(), "aegis-shots-"));

function flatten(file, w, h, out) {
  const src = PNG.sync.read(readFileSync(file));
  const dst = new PNG({ width: w, height: h, colorType: 2 });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((y < src.height ? y : src.height - 1) * src.width + (x < src.width ? x : src.width - 1)) * 4;
      const a = (src.data[s + 3] ?? 255) / 255;
      const d = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round((src.data[s + c] ?? 0) * a + 13 * (1 - a));
      dst.data[d + 3] = 255;
    }
  }
  writeFileSync(out, PNG.sync.write(dst, { colorType: 2, inputColorType: 6 }));
}

let failed = 0;
for (const [name, [w, h]] of Object.entries(sizes)) {
  const [group, file] = name.split("__");
  const dir = resolve("store-assets", group);
  mkdirSync(dir, { recursive: true });
  const raw = join(work, `${name}.png`);
  const res = spawnSync(
    firefox,
    ["--headless", "--no-remote", "--profile", mkdtempSync(join(work, "p-")), "--screenshot", raw, `--window-size=${w},${h}`, `file://${join(BUILD, name + ".html")}`],
    { encoding: "utf8", timeout: 90_000, env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: "1" } },
  );
  try {
    flatten(raw, w, h, join(dir, `${file}.png`));
    console.log(`✓ ${group}/${file}.png (${w}x${h})`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}: ${res.stderr?.split("\n").slice(-3).join(" ") ?? e}`);
  }
}
rmSync(work, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
