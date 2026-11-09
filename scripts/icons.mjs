// Renders public/assets/icon.svg into the PNG sizes used by the manifest and the store.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const svg = readFileSync("public/assets/icon.svg");
mkdirSync("store-assets", { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(`public/assets/icons/${size}.png`, png);
}
writeFileSync(
  "store-assets/icon-128.png",
  new Resvg(svg, { fitTo: { mode: "width", value: 128 } }).render().asPng(),
);
console.log("icons written");
