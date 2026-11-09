// Renders the icon into the PNG sizes used by the manifest and the store.
// Toolbar sizes (16/32) use a simplified drawing: the rivets and serpents turn to noise that small.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const full = readFileSync("public/assets/icon.svg");
const small = readFileSync("scripts/assets/icon-small.svg");
const render = (svg, size) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

mkdirSync("store-assets", { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(`public/assets/icons/${size}.png`, render(size <= 32 ? small : full, size));
}
writeFileSync("store-assets/icon-128.png", render(full, 128));
console.log("icons written");
