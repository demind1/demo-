import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifacts = process.env.ARTIFACT_DIR || join(tmpdir(), "deadfall-smoke");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const read = (fn, arg) => page.evaluate(fn, arg);
const press = async (key) => {
  await page.keyboard.press(key, { delay: 60 });
  await page.waitForTimeout(100);
};
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForSelector('button[data-action="start"]');
  await page.screenshot({ path: join(artifacts, "menu.png") });
  await page.click('[data-action="settings"]');
  await page.selectOption("#blood", "0.4");
  await page.click('[data-action="back"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector("#ammo");
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.phase),
    "playing",
  );
  await page.waitForFunction(() =>
    window.__deadfall.scene
      .getScene("Survival")
      .run.enemies.some((e) => e.state === "approach"),
  );
  const startX = await read(
    () => window.__deadfall.scene.getScene("Survival").run.player.x,
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(450);
  await page.keyboard.up("d");
  assert.ok(
    (await read(
      () => window.__deadfall.scene.getScene("Survival").run.player.x,
    )) >
      startX + 20,
  );
  await press("Space");
  assert.ok(
    (await read(
      () =>
        window.__deadfall.scene.getScene("Survival").run.player.dodgeCooldown,
    )) > 0,
  );
  await page.waitForTimeout(400);
  // Put a real Walker on the aiming ray, then shoot it with actual pointer input.
  await read(() => {
    const s = window.__deadfall.scene.getScene("Survival");
    s.run.enemies = [];
    s.run.remaining = 1;
    s.run.spawnTimer = 999;
    s.run.player.x = 260;
    s.cameraX = 0;
    s.run.enemies.push({
      id: 900,
      x: 510,
      y: 425,
      kind: "walker",
      hp: 65,
      state: "approach",
      timer: 0,
      phase: 0,
      attack: 0,
      fall: 0,
      impulse: 0,
      headshot: false,
    });
  });
  await page.mouse.move(505 * 1.5, 322 * 1.5);
  await page.mouse.click(505 * 1.5, 322 * 1.5);
  await page.waitForTimeout(120);
  const hit = await read(() => {
    const s = window.__deadfall.scene.getScene("Survival");
    return {
      kills: s.run.kills,
      ammo: s.run.ammo[0],
      state: s.run.enemies[0].state,
    };
  });
  assert.equal(hit.ammo, 14);
  assert.equal(hit.kills, 1);
  assert.equal(hit.state, "die");
  await press("r");
  await page.waitForFunction(
    () => window.__deadfall.scene.getScene("Survival").run.player.reload <= 0,
  );
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.ammo[0]),
    15,
  );
  await press("Escape");
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.phase),
    "paused",
  );
  const elapsed = await read(
    () => window.__deadfall.scene.getScene("Survival").run.elapsed,
  );
  await page.waitForTimeout(250);
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.elapsed),
    elapsed,
  );
  await page.click('[data-action="resume"]');
  await page.screenshot({ path: join(artifacts, "play.png") });
  // Complete the last pending spawn; verify natural transition into the supply shop.
  await read(() => {
    const s = window.__deadfall.scene.getScene("Survival");
    s.run.remaining = 0;
  });
  await page.waitForSelector(".shop");
  await read(() => {
    const s = window.__deadfall.scene.getScene("Survival");
    s.run.money = 1200;
    s.ui.render();
  });
  await page.click('[data-action="buy:3"]');
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.owned[3]),
    true,
  );
  await page.click('[data-action="buy:damage"]');
  assert.equal(
    await read(
      () => window.__deadfall.scene.getScene("Survival").run.damageLevel,
    ),
    1,
  );
  await page.screenshot({ path: join(artifacts, "shop.png") });
  await page.click('[data-action="wave"]');
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.wave),
    2,
  );
  await press("1");
  await press("4");
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.weapon),
    3,
  );
  const ammo = await read(
    () => window.__deadfall.scene.getScene("Survival").run.ammo[3],
  );
  await page.mouse.move(1100, 500);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.up();
  assert.ok(
    (await read(
      () => window.__deadfall.scene.getScene("Survival").run.ammo[3],
    )) <
      ammo - 1,
  );
  // Close-range attack must deal damage; healing must consume a field dressing.
  await read(() => {
    const s = window.__deadfall.scene.getScene("Survival");
    s.run.enemies = [
      {
        id: 901,
        x: s.run.player.x + 25,
        y: 425,
        kind: "walker",
        hp: 65,
        state: "attack",
        timer: 0,
        phase: 0,
        attack: 0,
        fall: 0,
        impulse: 0,
        headshot: false,
      },
    ];
  });
  await page.waitForTimeout(200);
  assert.ok(
    (await read(
      () => window.__deadfall.scene.getScene("Survival").run.player.hp,
    )) < 100,
  );
  await press("e");
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.medkits),
    1,
  );
  await press("f");
  assert.ok(
    (await read(
      () => window.__deadfall.scene.getScene("Survival").run.enemies[0].hp,
    )) < 65,
  );
  // Every weapon must fire and kill a real enemy through the same collision pipeline.
  for (let i = 0; i < 6; i++) {
    await read((i) => {
      const s = window.__deadfall.scene.getScene("Survival");
      s.run.owned[i] = true;
      s.switchWeapon(i);
      s.run.cooldown = 0;
      s.run.player.reload = 0;
      s.run.player.dodge = 0;
      s.run.ammo[i] = 10;
      s.run.enemies = [
        {
          id: 1000 + i,
          x: s.run.player.x + 220,
          y: 425,
          kind: ["walker", "runner", "heavy", "crawler", "berserker", "walker"][
            i
          ],
          hp: 1,
          state: "approach",
          timer: 0,
          phase: 0,
          attack: 0,
          fall: 0,
          impulse: 0,
          headshot: false,
        },
      ];
    }, i);
    const coords = await read(() => {
      const s = window.__deadfall.scene.getScene("Survival");
      const e = s.run.enemies[0];
      const scale = [1, 0.91, 1.32, 0.7, 1.08, 1][s.run.weapon];
      return {
        x: (e.x - s.cameraX) * 1.5,
        y: (e.y - (e.kind === "crawler" ? 20 : 65) * scale) * 1.5,
      };
    });
    // Crawler's horizontal rig puts its hit volume slightly behind its root.
    await page.mouse.click(coords.x, coords.y);
    await page.waitForFunction(
      () =>
        window.__deadfall.scene.getScene("Survival").run.enemies[0].state ===
        "die",
    );
  }
  // Render every regional palette and both lighting modes without errors.
  for (let region = 0; region < 5; region++) {
    await read((region) => {
      const s = window.__deadfall.scene.getScene("Survival");
      s.run.region = region;
      s.settings.night = region % 2 === 1;
    }, region);
    await page.waitForTimeout(100);
  }
  // Exercise game-over and a clean restart.
  await read(() => {
    window.__deadfall.scene.getScene("Survival").run.player.hp = 0;
  });
  await page.waitForSelector(".death-modal");
  await page.click('[data-action="start"]');
  assert.equal(
    await read(() => window.__deadfall.scene.getScene("Survival").run.kills),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: menus, settings, movement, dodge, headshot, reload, pause, shop, upgrades, wave progression, weapon switching, automatic fire, damage, healing, melee, game over and restart.",
  );
} finally {
  await browser.close();
}
