import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 1440, height: 810 },
  });
  const page = await context.newPage();
  const errors = [],
    network = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (/^https?:/.test(req.url())) network.push(req.url());
  });
  await page.setContent(
    await readFile(resolve("release/DEADFALL.html"), "utf8"),
    { waitUntil: "load" },
  );
  await page.click('[data-action="settings"]');
  await page.selectOption("#blood", "0.4");
  await page.click('[data-action="back"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector("#ammo");
  assert.equal(await page.locator("#ammo").textContent(), "15");
  assert.equal(
    await page.evaluate(() => typeof window.__deadfall),
    "undefined",
  );
  await page.mouse.click(1100, 500);
  await page.waitForFunction(
    () => document.querySelector("#ammo")?.textContent === "14",
  );
  await page.keyboard.press("r", { delay: 80 });
  await page.waitForFunction(
    () => document.querySelector("#ammo")?.textContent === "15",
  );
  await page.keyboard.press("Escape", { delay: 80 });
  await page.waitForSelector(".pause-modal");
  await page.click('[data-action="resume"]');
  await page.waitForSelector("#ammo");
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "Standalone file passed OFFLINE Chromium validation: embedded production HTML execution, settings, start, shooting, reload, pause and resume; zero network requests or JavaScript errors.",
  );
} finally {
  await browser.close();
}
