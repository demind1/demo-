import {
  updatePlayerAnimation,
  updateEnemyAnimation,
  playerMuzzle,
  enemyHitAreas,
} from "../animation/animator";
import Phaser from "phaser";
import {
  Run,
  ENEMIES,
  enemyKind,
  transitionEnemy,
  type Enemy,
  type Phase,
} from "../entities/model";
import { WEAPONS, damageForHit, rayCircle } from "../combat/weapons";
import { Landscape, survivor, zombie, W, H } from "../graphics/art";
import { Sound } from "../audio/sound";
import { Particles } from "../systems/particles";
import { Interface } from "../ui/interface";
export class Survival extends Phaser.Scene {
  run = new Run();
  previewPlayer = { ...new Run().player, x: 245 };
  soundFX = new Sound();
  particles = new Particles();
  land = new Landscape();
  ui!: Interface;
  texture!: Phaser.Textures.CanvasTexture;
  ctx!: CanvasRenderingContext2D;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  cameraX = 0;
  aim = 0;
  artTime = 0;
  held = false;
  pressed = false;
  shake = 0;
  flash = 0;
  hit = 0;
  meleeCooldown = 0;
  footstep = 0;
  previous: Phase = "playing";
  tracers: { x: number; y: number; tx: number; ty: number; life: number }[] =
    [];
  stains: { x: number; y: number; w: number; h: number }[] = [];
  settings = { blood: 1, intensity: 1, night: false };
  demo: Enemy[] = [];
  best = 0;
  constructor() {
    super("Survival");
  }
  create() {
    this.texture = this.textures.createCanvas("frame", W, H)!;
    this.ctx = this.texture.context;
    this.ctx.imageSmoothingEnabled = false;
    this.add.image(0, 0, "frame").setOrigin(0);
    this.keys = this.input.keyboard!.addKeys(
      "A,D,SHIFT,R,SPACE,F,E,ESC,ONE,TWO,THREE,FOUR,FIVE,SIX",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture([
      "SPACE",
      "ESC",
      "ONE",
      "TWO",
      "THREE",
      "FOUR",
      "FIVE",
      "SIX",
    ]);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) {
        this.held = true;
        this.pressed = true;
        this.soundFX.unlock();
      }
    });
    this.input.on("pointerup", () => (this.held = false));
    this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("blur", () => {
      this.held = false;
      if (this.run.phase === "playing" || this.run.phase === "prep")
        this.pause();
    });
    try {
      this.best = Number(localStorage.getItem("deadfall-best") || 0);
      const saved = JSON.parse(
        localStorage.getItem("deadfall-settings") || "null",
      );
      if (saved) {
        this.settings = { ...this.settings, ...saved.visual };
        this.soundFX.volume = saved.volume ?? 0.35;
      }
    } catch {
      /* Storage is optional. */
    }
    this.demo = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: 670 + i * 60,
      y: 426 + (i % 2) * 9,
      kind: (["walker", "heavy", "runner", "crawler", "berserker"] as const)[i],
      hp: 100,
      state: "approach",
      timer: 0,
      phase: i * 1.9,
      attack: 0,
      fall: 0,
      impulse: 0,
      headshot: false,
    }));
    this.ui = new Interface(this);
    this.ui.render();
  }
  start() {
    this.run = new Run();
    this.run.startWave();
    this.cameraX = 0;
    this.stains = [];
    this.tracers = [];
    this.particles = new Particles();
    this.flash = this.hit = this.shake = this.meleeCooldown = this.footstep = 0;
    this.held = false;
    this.ui.render();
    this.soundFX.unlock();
    this.soundFX.play("wave");
  }
  pause() {
    this.previous = this.run.phase;
    this.run.phase = "paused";
    this.held = false;
    this.ui.render();
  }
  resume() {
    this.run.phase = this.previous;
    this.ui.render();
  }
  switchWeapon(i: number) {
    if (this.run.owned[i] && this.run.weapon !== i) {
      this.run.weapon = i;
      this.run.player.reload = 0;
      this.soundFX.play("ui");
    }
  }
  reload() {
    const r = this.run,
      w = WEAPONS[r.weapon];
    if (
      r.player.reload <= 0 &&
      r.reserve[r.weapon] > 0 &&
      r.ammo[r.weapon] < w.magazine
    ) {
      r.player.reload = w.reload * (1 - r.reloadLevel * 0.15);
      this.soundFX.play("reload");
    }
  }
  heal() {
    const r = this.run;
    if (r.medkits > 0 && r.player.hp < r.player.maxHp) {
      r.medkits--;
      r.player.hp = Math.min(r.player.maxHp, r.player.hp + 55);
      this.soundFX.play("ui");
      this.ui.toast("FIELD DRESSING · +55 HP");
    }
  }
  spawn() {
    const r = this.run,
      kind = enemyKind(r.wave, Math.random());
    r.enemies.push({
      id: r.nextId++,
      x: this.cameraX + W + 45 + Math.random() * 100,
      y: 421 + Math.random() * 18,
      kind,
      hp: ENEMIES[kind].hp * (1 + (r.wave - 1) * 0.09),
      state: "spawn",
      timer: 0.35,
      phase: Math.random() * 10,
      attack: 0,
      fall: 0,
      impulse: 0,
      headshot: false,
    });
    r.remaining--;
  }
  damageEnemy(e: Enemy, damage: number, head: boolean, dir: number) {
    if (e.state === "die") return;
    const r = this.run,
      cfg = ENEMIES[e.kind];
    e.hp -= damage;
    e.impulse = dir * Math.min(230, damage * 2);
    e.state = "stagger";
    e.timer = cfg.scale > 1.2 ? 0.12 : 0.25;
    e.headshot = head;
    const y = e.y - (head ? 103 : 65) * cfg.scale;
    if (this.settings.blood > 0) {
      this.particles.emit(
        e.x,
        y,
        Math.ceil((head ? 15 : 8) * this.settings.blood),
        "#873a2e",
        head ? 160 : 95,
      );
      this.stains.push({
        x: e.x + Math.random() * 30,
        y: e.y + 5 + Math.random() * 12,
        w: 3 + Math.random() * 14,
        h: 1 + Math.random() * 3,
      });
      if (this.stains.length > 240) this.stains.shift();
    }
    this.hit = 0.12;
    this.soundFX.play("hit");
    if (e.hp <= 0) {
      e.state = "die";
      e.fall = 0;
      r.kills++;
      r.money += cfg.reward;
      r.score += head ? 150 : 100;
      if (head) r.headshots++;
      this.soundFX.play("death");
    }
  }
  shoot() {
    const r = this.run,
      w = WEAPONS[r.weapon],
      p = r.player;
    if (r.cooldown > 0 || p.reload > 0 || p.dodge > 0) return;
    if (r.ammo[r.weapon] <= 0) {
      this.soundFX.play("empty");
      r.cooldown = 0.3;
      this.reload();
      return;
    }
    // Firing interrupts the visual melee follow-through; the gun returns to
    // the aimed constraint before calculating its muzzle position.
    p.melee = 0;
    r.ammo[r.weapon]--;
    r.cooldown = w.rate;
    p.recoil = w.recoil;
    this.flash = 0.055;
    this.shake = w.recoil * 0.25 * this.settings.intensity;
    this.soundFX.play("shot", r.weapon);
    // Keep the established chamber ray for close-range hits. Recoil and other
    // visual offsets must not turn an accurately aimed shot into a miss.
    const ox = p.x + Math.cos(this.aim) * 32;
    const oy = p.y - 78 + Math.sin(this.aim) * 32;
    const muzzle = playerMuzzle(p, this.aim, r.weapon);
    this.particles.emit(p.x, p.y - 80, 1, "#d6af5c", 80, 210);
    for (let i = 0; i < w.pellets; i++) {
      const angle = this.aim + (Math.random() - 0.5) * w.spread,
        dx = Math.cos(angle),
        dy = Math.sin(angle);
      let nearest = w.range,
        target: Enemy | null = null,
        head = false;
      for (const e of r.enemies) {
        if (e.state === "die" || e.state === "spawn") continue;
        const scale = ENEMIES[e.kind].scale,
          crawl = e.kind === "crawler";
        const areas = enemyHitAreas(e);
        const ht = rayCircle(
          ox,
          oy,
          dx,
          dy,
          areas.head.x,
          areas.head.y,
          12 * scale,
        );
        const bt = rayCircle(
          ox,
          oy,
          dx,
          dy,
          areas.body.x,
          areas.body.y,
          (crawl ? 23 : 21) * scale,
        );
        if (ht !== null && ht < nearest) {
          nearest = ht;
          target = e;
          head = true;
        }
        if (bt !== null && bt < nearest) {
          nearest = bt;
          target = e;
          head = false;
        }
      }
      const tx = ox + dx * nearest,
        ty = oy + dy * nearest;
      this.tracers.push({ x: muzzle.x, y: muzzle.y, tx, ty, life: 0.07 });
      if (target)
        this.damageEnemy(
          target,
          damageForHit(w.damage, head, r.damageLevel),
          head,
          Math.sign(dx),
        );
      else if (ty > 348 && ty < 470)
        this.particles.emit(tx, ty, 3, "#b4af89", 45);
    }
  }
  melee() {
    const p = this.run.player;
    if (this.meleeCooldown > 0 || p.dodge > 0) return;
    p.melee = 0.28;
    this.meleeCooldown = 0.65;
    this.soundFX.play("melee");
    for (const e of this.run.enemies)
      if (
        e.state !== "die" &&
        Math.abs(e.x - p.x) < 100 &&
        (e.x - p.x) * p.facing > -15
      )
        this.damageEnemy(
          e,
          42 * (1 + this.run.damageLevel * 0.2),
          false,
          p.facing,
        );
  }
  update(_timestamp: number, delta: number) {
    if (!this.ui) return;
    const dt = Math.min(delta / 1000, 0.04);
    this.artTime += dt;
    const r = this.run,
      p = r.player;
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (r.phase === "playing" || r.phase === "prep") this.pause();
      else if (r.phase === "paused") this.resume();
      else if (r.phase === "settings") {
        r.phase = this.ui.settingsBack;
        this.ui.render();
      }
    }
    const active = r.phase === "playing" || r.phase === "prep";
    if (active) {
      r.elapsed += dt;
      r.cooldown = Math.max(0, r.cooldown - dt);
      this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
      p.hurt = Math.max(0, p.hurt - dt);
      p.recoil = Math.max(0, p.recoil - dt * 35);
      p.melee = Math.max(0, p.melee - dt);
      p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
      const movement = Number(this.keys.D.isDown) - Number(this.keys.A.isDown),
        sprint = this.keys.SHIFT.isDown;
      p.moving = Phaser.Math.Linear(
        p.moving,
        Math.abs(movement) * (sprint ? 1.35 : 1),
        0.18,
      );
      p.phase += dt * (movement ? (sprint ? 15 : 10) : 2);
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.SPACE) &&
        p.dodgeCooldown <= 0
      ) {
        p.dodge = 0.32;
        p.dodgeCooldown = 2;
        this.soundFX.play("step");
      }
      if (p.dodge > 0) {
        p.dodge -= dt;
        p.x += (movement || p.facing) * 440 * dt;
      } else
        p.x += movement * (sprint ? 155 : 95) * (1 + r.speedLevel * 0.12) * dt;
      p.x = Phaser.Math.Clamp(p.x, 70, 3600);
      this.cameraX = Phaser.Math.Linear(
        this.cameraX,
        Phaser.Math.Clamp(p.x - 265, 0, 3000),
        1 - Math.exp(-dt * 4),
      );
      const pointer = this.input.activePointer;
      this.aim = Math.atan2(
        pointer.y - (p.y - 78),
        pointer.x + this.cameraX - p.x,
      );
      p.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
      if (movement) {
        this.footstep -= dt;
        if (this.footstep <= 0) {
          this.soundFX.play("step");
          this.footstep = sprint ? 0.23 : 0.37;
        }
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.reload();
      if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.melee();
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        if (r.phase === "prep") {
          r.startWave();
          this.ui.render();
          this.soundFX.play("wave");
        } else this.heal();
      }
      ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX"].forEach((k, i) => {
        if (Phaser.Input.Keyboard.JustDown(this.keys[k])) this.switchWeapon(i);
      });
      if (p.reload > 0) {
        p.reload -= dt;
        if (p.reload <= 0) {
          const n = Math.min(
            WEAPONS[r.weapon].magazine - r.ammo[r.weapon],
            r.reserve[r.weapon],
          );
          r.ammo[r.weapon] += n;
          r.reserve[r.weapon] -= n;
          this.soundFX.play("reload");
        }
      }
      if (r.phase === "playing") {
        if (this.pressed || (this.held && WEAPONS[r.weapon].automatic))
          this.shoot();
        r.spawnTimer -= dt;
        if (r.remaining > 0 && r.spawnTimer <= 0) {
          this.spawn();
          r.spawnTimer =
            Math.max(0.3, 1.8 - r.wave * 0.09) + Math.random() * 0.5;
        }
        for (const e of r.enemies) {
          if (e.state === "die") {
            e.fall = Math.min(1, e.fall + dt * 2.8);
            e.x += e.impulse * dt * (1 - e.fall);
            continue;
          }
          const distance = Math.abs(e.x - p.x);
          transitionEnemy(e, dt, distance);
          const cfg = ENEMIES[e.kind];
          e.phase += dt * (cfg.speed * 0.15 + 2);
          e.x += e.impulse * dt;
          e.impulse *= Math.exp(-dt * 10);
          if (e.state === "approach")
            e.x +=
              Math.sign(p.x - e.x) *
              cfg.speed *
              (1 + (r.wave - 1) * 0.025) *
              (e.kind === "berserker"
                ? Math.sin(this.artTime * 2 + e.id) > 0.4
                  ? 2.1
                  : 0.65
                : 1) *
              dt;
          if (e.state === "attack") {
            e.timer -= dt;
            if (e.timer <= 0 && e.attack <= 0) {
              e.attack = 1;
              e.timer = 0.5;
              if (distance < 58 && p.dodge <= 0 && p.hurt <= 0) {
                p.hp = Math.max(0, p.hp - cfg.damage);
                p.hurt = 0.45;
                this.shake = 3 * this.settings.intensity;
                this.soundFX.play("attack");
              }
            }
          }
        }
        if (r.enemies.filter((e) => e.state === "die").length > 32) {
          const index = r.enemies.findIndex(
            (e) =>
              e.state === "die" &&
              (e.animation ? e.animation.death >= 1 : e.fall >= 1),
          );
          if (index >= 0) r.enemies.splice(index, 1);
        }
        if (p.hp <= 0) {
          r.phase = "over";
          this.held = false;
          this.best = Math.max(this.best, r.score);
          try {
            localStorage.setItem("deadfall-best", String(this.best));
          } catch {}
          this.ui.render();
        } else if (
          r.remaining === 0 &&
          !r.enemies.some((e) => e.state !== "die")
        ) {
          r.finishWave();
          this.soundFX.play("wave");
          this.ui.render();
        }
      } else {
        r.prepTimer -= dt;
        if (r.prepTimer <= 0) {
          r.startWave();
          this.ui.render();
          this.soundFX.play("wave");
        }
      }
      this.particles.update(dt);
      for (const t of this.tracers) t.life -= dt;
      this.tracers = this.tracers.filter((t) => t.life > 0);
      this.flash = Math.max(0, this.flash - dt);
      this.hit = Math.max(0, this.hit - dt);
      this.shake = Math.max(0, this.shake - dt * 20);
    }
    // Advance the skeleton exactly once per simulation step. Rendering is pure,
    // so paused poses and settled corpses stay completely still.
    if (active || r.phase === "over") {
      updatePlayerAnimation(
        p,
        dt,
        this.aim,
        WEAPONS[r.weapon].reload * (1 - r.reloadLevel * 0.15),
        r.phase === "over",
      );
      for (const e of r.enemies)
        if (active || e.state === "die") updateEnemyAnimation(e, dt, p.x);
    } else if (r.phase === "menu") {
      updatePlayerAnimation(
        this.previewPlayer,
        dt,
        -0.06,
        WEAPONS[r.weapon].reload,
      );
      for (const e of this.demo) updateEnemyAnimation(e, dt, 245);
    }
    this.pressed = false;
    this.draw();
    this.ui.update();
  }
  draw() {
    const c = this.ctx,
      r = this.run,
      demo = r.phase === "menu",
      p = demo ? this.previewPlayer : r.player;
    const camera = demo ? 0 : this.cameraX;
    c.clearRect(0, 0, W, H);
    c.save();
    if (this.shake > 0 && r.phase === "playing")
      c.translate(
        Math.round((Math.random() - 0.5) * this.shake),
        Math.round((Math.random() - 0.5) * this.shake),
      );
    this.land.draw(c, camera, r.region, this.artTime);
    c.save();
    c.translate(-Math.round(camera), 0);
    for (const b of this.stains) {
      c.fillStyle = "#5a2925";
      c.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h);
    }
    const enemies = demo ? this.demo : r.enemies;
    for (const e of enemies) {
      c.fillStyle = "#142a2450";
      c.beginPath();
      c.ellipse(e.x, e.y + 4, 23 * ENEMIES[e.kind].scale, 4, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#12292265";
    c.beginPath();
    c.ellipse(p.x, p.y + 5, 27, 5, 0, 0, Math.PI * 2);
    c.fill();
    const all = [
      ...enemies.map((e) => ({ y: e.state === "die" ? 0 : e.y, e })),
      { y: p.y, e: null },
    ].sort((a, b) => a.y - b.y);
    for (const item of all) {
      if (item.e) {
        if (demo)
          item.e.phase = this.artTime * (2 + item.e.id * 0.2) + item.e.id;
        zombie(c, item.e, this.artTime);
      } else {
        const copy = {
          ...p,
          phase: demo ? this.artTime : p.phase,
          x: demo ? 245 : p.x,
        };
        survivor(c, copy, demo ? -0.06 : this.aim, r.weapon, this.artTime);
      }
    }
    if (this.flash > 0) {
      const { x: ox, y: oy } = playerMuzzle(p, this.aim, r.weapon);
      c.save();
      c.translate(ox, oy);
      c.rotate(this.aim);
      c.fillStyle = "#f3d09a";
      c.beginPath();
      c.moveTo(0, -8);
      c.lineTo(24, 0);
      c.lineTo(0, 8);
      c.lineTo(6, 0);
      c.fill();
      c.fillStyle = "#fff4c7";
      c.fillRect(0, -3, 10, 6);
      c.restore();
    }
    for (const t of this.tracers) {
      c.strokeStyle = "#ead69c90";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(t.x, t.y);
      c.lineTo(t.tx, t.ty);
      c.stroke();
    }
    c.restore();
    this.particles.draw(c, camera);
    c.restore();
    const night = this.settings.night || (r.wave > 0 && r.wave % 6 >= 4);
    if (night) {
      c.fillStyle = "#132f4d65";
      c.fillRect(0, 0, W, H);
      if (!demo) {
        const g = c.createRadialGradient(
          p.x - camera + 80,
          p.y - 80,
          15,
          p.x - camera + 80,
          p.y - 80,
          200,
        );
        g.addColorStop(0, "#eed49a18");
        g.addColorStop(1, "#eed49a00");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
    }
    const vignette = c.createRadialGradient(480, 280, 150, 480, 280, 570);
    vignette.addColorStop(0, "#07151100");
    vignette.addColorStop(1, "#07151165");
    c.fillStyle = vignette;
    c.fillRect(0, 0, W, H);
    if (p.hurt > 0 && r.phase === "playing") {
      c.fillStyle = `rgba(150,35,25,${p.hurt * 0.3 * this.settings.intensity})`;
      c.fillRect(0, 0, W, H);
    }
    if (r.phase === "playing") {
      const pointer = this.input.activePointer,
        x = Math.round(pointer.x),
        y = Math.round(pointer.y);
      c.strokeStyle = this.hit > 0 ? "#e8b35e" : "#e4e5c9";
      c.lineWidth = 1;
      c.beginPath();
      for (const [a, b, d, e] of [
        [-9, 0, -4, 0],
        [4, 0, 9, 0],
        [0, -9, 0, -4],
        [0, 4, 0, 9],
      ]) {
        c.moveTo(x + a, y + b);
        c.lineTo(x + d, y + e);
      }
      c.stroke();
      c.fillStyle = "#eee6c6";
      c.fillRect(x, y, 1, 1);
      if (p.reload > 0) {
        c.fillStyle = "#182925";
        c.fillRect(p.x - camera - 20, p.y - 133, 40, 3);
        c.fillStyle = "#dbbf79";
        c.fillRect(
          p.x - camera - 20,
          p.y - 133,
          40 *
            (1 -
              p.reload /
                (WEAPONS[r.weapon].reload * (1 - r.reloadLevel * 0.15))),
          3,
        );
      }
    }
    this.texture.refresh();
  }
}
