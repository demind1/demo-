import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifacts =
  process.env.ARTIFACT_DIR || join(tmpdir(), "deadfall-animation");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 2160 },
  });
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForSelector('[data-action="start"]');
  await page.evaluate(async () => {
    const { survivor, zombie } = await import(
      "/src/game/graphics/characters.ts"
    );
    const { updatePlayerAnimation, updateEnemyAnimation } = await import(
      "/src/game/animation/animator.ts"
    );
    const { Run, ENEMIES } = await import("/src/game/entities/model.ts");
    document.body.innerHTML = "";
    document.body.style.cssText = "margin:0;overflow:auto;background:#1a2924";
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 2160;
    document.body.append(canvas);
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const rows = [
      "WALK / FOOT PLANT",
      "SPRINT / WEIGHT",
      "RELOAD / MAGAZINE",
      "DODGE / COMPRESSION",
      "MELEE / FOLLOW THROUGH",
      "WALKER",
      "RUNNER",
      "HEAVY",
      "CRAWLER",
      "BERSERKER",
    ];
    for (let row = 0; row < rows.length; row++) {
      const top = row * 216;
      c.fillStyle = row % 2 ? "#24362e" : "#1a2d27";
      c.fillRect(0, top, 1200, 216);
      c.fillStyle = "#d5bc88";
      c.font = "12px monospace";
      c.fillText(rows[row], 20, top + 19);
      for (let frame = 0; frame < 6; frame++) {
        const p = new Run().player;
        p.y = 0;
        let e;
        if (row >= 5)
          e = {
            id: 1,
            kind: Object.keys(ENEMIES)[row - 5],
            x: 500,
            y: 0,
            hp: 100,
            state: "approach",
            phase: 0,
            timer: 0,
            attack: 0,
            fall: 0,
            impulse: 0,
            headshot: false,
          };
        for (let i = 0; i <= frame * 10 + 1; i++) {
          const dt = 1 / 60,
            t = i * dt;
          if (row === 0) p.x += 95 * dt;
          if (row === 1) p.x += 155 * dt;
          if (row === 2) p.reload = Math.max(0.01, 1.25 - t * 1.4);
          if (row === 3) p.dodge = 0.32 * (1 - frame / 6);
          if (row === 4) p.melee = 0.28 * (1 - frame / 6);
          updatePlayerAnimation(p, dt, -0.08, 1.25);
          if (e) {
            e.x -= ENEMIES[e.kind].speed * dt;
            updateEnemyAnimation(e, dt, 0);
          }
        }
        c.save();
        c.translate(frame * 200 + 92, top + 194);
        c.scale(1.4, 1.4);
        c.strokeStyle = "#6e7a5a";
        c.beginPath();
        c.moveTo(-62, 6);
        c.lineTo(62, 6);
        c.stroke();
        if (e) {
          const dx = e.x;
          e.x = 0;
          for (const foot of e.animation.feet) foot.x -= dx;
          zombie(c, e, 0);
        } else {
          const dx = p.x;
          p.x = 0;
          for (const foot of p.animation.feet) foot.x -= dx;
          survivor(c, p, -0.08, 3, 0);
          p.x = dx;
        }
        c.restore();
      }
    }
  });
  const sheets = await page.evaluate(() => {
    const source = document.querySelector("canvas");
    return [0, 1080].map((y) => {
      const copy = document.createElement("canvas");
      copy.width = 1200;
      copy.height = 1080;
      copy.getContext("2d").drawImage(source, 0, -y);
      return copy.toDataURL("image/png").split(",")[1];
    });
  });
  for (let i = 0; i < 2; i++)
    await writeFile(
      join(artifacts, i ? "enemies.png" : "player.png"),
      Buffer.from(sheets[i], "base64"),
    );
  const deaths = await page.evaluate(async () => {
    const { zombie } = await import("/src/game/graphics/characters.ts");
    const { updateEnemyAnimation } = await import(
      "/src/game/animation/animator.ts"
    );
    const { ENEMIES } = await import("/src/game/entities/model.ts");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1080;
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    Object.keys(ENEMIES).forEach((kind, row) => {
      c.fillStyle = row % 2 ? "#24362e" : "#1a2d27";
      c.fillRect(0, row * 216, 1200, 216);
      c.fillStyle = "#d5bc88";
      c.font = "12px monospace";
      c.fillText(kind.toUpperCase() + " / COLLAPSE", 20, row * 216 + 19);
      for (let frame = 0; frame < 6; frame++) {
        const e = {
          id: row,
          kind,
          x: 500,
          y: 0,
          hp: 100,
          state: "approach",
          phase: 0,
          timer: 0,
          attack: 0,
          fall: 0,
          impulse: 0,
          headshot: row % 2 === 0,
        };
        updateEnemyAnimation(e, 1 / 60, 0);
        e.state = "die";
        e.hp = 0;
        e.impulse = 80;
        for (let step = 0; step < frame * 14; step++)
          updateEnemyAnimation(e, 1 / 60, 0);
        e.x = 0;
        for (const foot of e.animation.feet) foot.x -= 500;
        c.save();
        c.translate(frame * 200 + 75, row * 216 + 194);
        c.scale(1.2, 1.2);
        zombie(c, e, 0);
        c.restore();
      }
    });
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await writeFile(join(artifacts, "deaths.png"), Buffer.from(deaths, "base64"));
  console.log(`Animation contact sheets saved to ${artifacts}`);
} finally {
  await browser.close();
}
