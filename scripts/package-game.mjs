import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Embed the production engine, game code and styles. There are no remote assets.
const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
let html = await readFile(resolve(dist, "index.html"), "utf8");
const scriptTag = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const styleTag = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/);
if (!scriptTag || !styleTag)
  throw new Error("Expected Vite production script and stylesheet");
const asset = (url) => resolve(dist, url.replace(/^\//, ""));
const js = (await readFile(asset(scriptTag[1]), "utf8")).replace(
  /<\/script/gi,
  "<\\/script",
);
const css = (await readFile(asset(styleTag[1]), "utf8")).replace(
  /<\/style/gi,
  "<\\/style",
);
html = html.replace(scriptTag[0], () => `<script type="module">${js}</script>`);
html = html.replace(styleTag[0], () => `<style>${css}</style>`);
html = html.replace(
  "<title>",
  "<!-- Standalone offline edition: open this file directly in a desktop browser. -->\n<title>",
);
await mkdir(resolve(root, "release"), { recursive: true });
const output = resolve(root, "release/DEADFALL.html");
await writeFile(output, html);
console.log(
  `Standalone game: ${output} (${Buffer.byteLength(html).toLocaleString()} bytes)`,
);
