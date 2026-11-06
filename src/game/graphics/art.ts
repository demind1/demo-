import { ENEMIES, type Enemy, type Player } from "../entities/model";
import { WEAPONS } from "../combat/weapons";
type C = CanvasRenderingContext2D;
export const W = 960,
  H = 540;
export function poly(c: C, color: string, points: number[][]) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function box(c: C, color: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function limb(
  c: C,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  detail: string,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  box(c, "#232b29", -width / 2 - 1, -1, width + 2, length + 2);
  box(c, color, -width / 2, 0, width, length);
  box(c, detail, -width / 2, 2, Math.max(2, width / 3), length - 4);
  box(c, "#00000020", 0, length * 0.65, width / 2, length * 0.35);
  c.restore();
  return { x: x - Math.sin(angle) * length, y: y + Math.cos(angle) * length };
}
export function weaponArt(
  c: C,
  id: number,
  x: number,
  y: number,
  angle: number,
  recoil = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.translate(-recoil, 0);
  const long = id > 1,
    l = long ? [0, 0, 37, 39, 26, 50][id] : 19;
  box(c, "#121b1c", -6, -5, l + 12, 8);
  box(c, WEAPONS[id].color, -4, -5, l - 4, 3);
  box(c, "#64716c", l - 3, -4, 9, 3);
  box(c, "#1c2625", l + 5, -4, 4, 5);
  box(c, "#283331", 2, 1, 6, 10);
  if (long) {
    box(c, "#79644a", -15, -4, 13, 9);
    box(c, "#433e30", -17, -3, 4, 11);
    box(c, "#3e4943", 16, 1, 7, 12);
    box(c, "#768078", 11, -7, 4, 2);
  }
  if (id === 5) {
    box(c, "#1b2525", 8, -12, 21, 5);
    box(c, "#a8b9ab", 10, -12, 15, 1);
  }
  if (id === 1) box(c, "#7d837c", 4, -4, 8, 8);
  c.restore();
}
export function survivor(
  c: C,
  p: Player,
  aim: number,
  weapon: number,
  time: number,
) {
  c.save();
  c.translate(Math.round(p.x), Math.round(p.y));
  c.scale(p.facing, 1);
  const walking = p.moving,
    phase = p.phase,
    bob = Math.sin(phase * 2) * walking * 1.8;
  c.translate(0, bob - (p.dodge > 0 ? 13 : 0));
  if (p.dodge > 0) c.rotate(0.4);
  const stride = Math.sin(phase) * 0.52 * walking;
  for (const back of [true, false]) {
    const side = back ? 1 : -1;
    const a = stride * side;
    const knee = limb(
      c,
      side * 4,
      -44,
      a,
      24,
      10,
      back ? "#887d60" : "#b2a078",
      "#c9b891",
    );
    const foot = limb(
      c,
      knee.x,
      knee.y,
      Math.max(0, -a) * 0.9 - a * 0.25,
      23,
      9,
      back ? "#8e8265" : "#bbab84",
      "#c6b590",
    );
    box(c, "#292a26", foot.x - 5, foot.y - 2, 15, 6);
    box(c, "#71644e", foot.x - 5, foot.y - 2, 13, 2);
  }
  box(c, "#202d2c", -21, -86, 14, 38);
  box(c, "#4b5c51", -23, -82, 9, 28);
  box(c, "#80907a", -22, -79, 6, 2);
  box(c, "#263b34", -20, -62, 8, 12);
  poly(c, "#364c48", [
    [-12, -88],
    [8, -87],
    [15, -56],
    [8, -42],
    [-13, -44],
    [-17, -66],
  ]);
  box(c, "#677b6a", -10, -84, 16, 6);
  box(c, "#84927a", -9, -83, 3, 18);
  box(c, "#1f3030", -12, -63, 24, 15);
  box(c, "#536359", -9, -61, 7, 8);
  box(c, "#536359", 1, -61, 7, 8);
  box(c, "#1b2728", -12, -47, 25, 5);
  box(c, "#b3a079", 1, -46, 5, 4);
  const a = p.facing === 1 ? aim : Math.PI - aim;
  const armAngle =
    p.reload > 0 ? Math.sin(time * 13) * 0.25 + 0.8 : p.melee > 0 ? -0.7 : a;
  c.save();
  c.translate(4, -78);
  c.rotate(armAngle);
  limb(c, -1, 2, -0.95, 19, 9, "#63796b", "#8c9a7f");
  limb(c, 15, 13, -1.85, 18, 7, "#b39772", "#dbb990");
  weaponArt(c, weapon, 27, 0, 0, p.recoil);
  box(c, "#d3b08a", 19, 1, 8, 6);
  box(c, "#516257", 0, -3, 13, 11);
  c.restore();
  box(c, "#a47e5d", -4, -94, 10, 10);
  poly(c, "#c8a27a", [
    [-8, -108],
    [6, -110],
    [13, -103],
    [12, -90],
    [3, -86],
    [-7, -93],
  ]);
  box(c, "#e1bd92", 4, -104, 6, 10);
  box(c, "#644f3e", 3, -91, 8, 5);
  box(c, "#1b2928", 7, -102, 7, 3);
  box(c, "#aeba9b", 8, -102, 4, 1);
  poly(c, "#263b36", [
    [-12, -108],
    [-10, -116],
    [5, -119],
    [12, -115],
    [12, -107],
  ]);
  box(c, "#5e7562", -8, -116, 14, 3);
  box(c, "#172b29", -13, -109, 31, 5);
  box(c, "#8c9d7b", -5, -110, 6, 2);
  if (p.hurt > 0) {
    c.globalCompositeOperation = "source-atop";
    box(c, "#dd603345", -24, -120, 68, 122);
  }
  c.restore();
}
export function zombie(c: C, e: Enemy, time: number) {
  const cfg = ENEMIES[e.kind],
    dead = e.state === "die";
  c.save();
  c.translate(Math.round(e.x), Math.round(e.y));
  if (dead) {
    c.translate(
      e.fall * 12 * (Math.sign(e.impulse) || 1),
      -Math.sin(e.fall * Math.PI) * 18,
    );
    c.rotate(((Math.sign(e.impulse) || 1) * Math.min(1, e.fall) * Math.PI) / 2);
  }
  c.scale(cfg.scale, cfg.scale);
  if (e.kind === "crawler") {
    c.translate(0, -6);
    c.rotate(-0.95);
  }
  const walk = Math.sin(e.phase),
    lean = e.state === "stagger" ? 0.27 : dead ? 0 : -0.12;
  c.rotate(lean);
  c.translate(0, Math.sin(e.phase * 2) * 1.5);
  for (const s of [1, -1]) {
    const a = walk * s * 0.32;
    const knee = limb(c, s * 4, -42, a, 22, 9, "#5a6255", "#818368");
    const f = limb(c, knee.x, knee.y, -a * 0.5, 21, 8, cfg.skin, "#b2af8a");
    box(c, "#353c3c", f.x - 11, f.y - 1, 15, 6);
    box(c, "#727970", f.x - 10, f.y, 11, 2);
    box(c, "#74382b", knee.x - 4, knee.y - 3, 7, 4);
  }
  poly(c, cfg.shirt, [
    [-14, -85],
    [6, -90],
    [16, -65],
    [11, -42],
    [-13, -43],
    [-18, -61],
  ]);
  box(c, "#00000028", -14, -72, 8, 27);
  box(c, "#d0c5a633", -8, -84, 7, 23);
  poly(c, "#6d3028", [
    [-11, -61],
    [-1, -59],
    [5, -46],
    [-5, -45],
    [-7, -52],
  ]);
  box(c, "#a17c52", -14, -45, 25, 4);
  const attack =
    e.state === "attack" ? Math.sin(Math.max(0, e.timer) * 10) * 0.5 : 0;
  const elbow = limb(c, -5, -79, 0.9 + attack, 23, 8, cfg.skin, "#b6b08a");
  limb(
    c,
    elbow.x,
    elbow.y,
    1.4 + Math.sin(e.phase) * 0.15,
    23,
    6,
    cfg.skin,
    "#afb187",
  );
  box(c, "#8d342b", elbow.x - 3, elbow.y, 7, 5);
  box(c, cfg.skin, -8, -96, 11, 12);
  poly(c, cfg.skin, [
    [-14, -113],
    [3, -115],
    [11, -107],
    [8, -91],
    [-3, -87],
    [-15, -95],
  ]);
  poly(c, "#333b31", [
    [-16, -110],
    [-12, -118],
    [3, -119],
    [9, -111],
    [2, -107],
    [-7, -110],
    [-10, -100],
    [-16, -101],
  ]);
  box(c, "#34472c", -13, -104, 9, 6);
  box(c, "#d5d591", -13, -104, 5, 3);
  box(c, "#913c30", -14, -93, 10, 4);
  box(c, "#d2caaa", -12, -93, 6, 2);
  if (e.kind === "runner") {
    box(c, "#9a5541", -13, -112, 20, 5);
    box(c, "#d0905e", -11, -112, 13, 2);
  }
  if (e.kind === "heavy") {
    box(c, "#252f2d", -14, -81, 28, 24);
    box(c, "#85917b", -10, -77, 20, 2);
    box(c, "#ad9c6b", -3, -69, 8, 7);
    box(c, "#48584d", -16, -116, 24, 9);
  }
  if (e.kind === "berserker") {
    box(c, "#742e2a", -16, -106, 22, 4);
    box(c, "#b1cba0", -13, -105, 6, 2);
    box(c, "#6e322d", 2, -77, 7, 18);
  }
  c.restore();
}
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export const REGIONS = [
  "ASHWOOD COUNTY",
  "HOLLOW CITY",
  "IRONWORKS",
  "BLACK PINE",
  "CHECKPOINT 09",
];
export class Landscape {
  layers: HTMLCanvasElement[] = [];
  region = -1;
  build(region: number) {
    this.region = region;
    this.layers = [];
    const r = rng(74 + region * 99);
    for (let layer = 0; layer < 4; layer++) {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 540;
      const c = canvas.getContext("2d")!;
      this.layers.push(canvas);
      if (layer === 0) {
        const sky = c.createLinearGradient(0, 0, 0, 300);
        sky.addColorStop(0, "#526965");
        sky.addColorStop(0.65, "#b4a282");
        sky.addColorStop(1, "#d2b382");
        c.fillStyle = sky;
        c.fillRect(0, 0, 1920, 340);
        box(c, "#e8cda0", 720, 106, 38, 38);
        box(c, "#f0d9af", 724, 102, 30, 46);
        for (let i = 0; i < 45; i++) {
          const x = r() * 1920,
            y = 30 + r() * 130;
          box(c, "#d3c5a130", x, y, 25 + r() * 90, 3);
          box(c, "#dac9aa25", x + 12, y - 4, 40, 4);
        }
      }
      if (layer === 1) {
        for (let i = 0; i < 16; i++) {
          const x = i * 145;
          poly(c, "#708078", [
            [x - 100, 230],
            [x + 15, 130 + r() * 65],
            [x + 100, 160 + r() * 25],
            [x + 220, 230],
          ]);
        }
        for (let i = 0; i < 190; i++) {
          const x = i * 11;
          const h = 20 + r() * 36;
          box(c, "#586d60", x, 243 - h, 9, h);
          poly(c, "#617466", [
            [x - 11, 236],
            [x + 4, 199 - h / 2],
            [x + 18, 236],
          ]);
        }
        if (region === 1 || region === 2) {
          for (let i = 0; i < 20; i++) {
            const x = i * 105;
            const h = 45 + r() * 75;
            box(
              c,
              region === 1 ? "#5c6a63" : "#5b6561",
              x,
              243 - h,
              60 + r() * 35,
              h,
            );
            for (let j = 0; j < 9; j++)
              box(
                c,
                "#c2b48840",
                x + 8 + (j % 3) * 15,
                250 - h + Math.floor(j / 3) * 18,
                5,
                7,
              );
            if (region === 2) box(c, "#535e58", x + 20, 243 - h - 45, 9, 45);
          }
        }
      }
      if (layer === 2) {
        box(c, "#5c7052", 0, 246, 1920, 95);
        for (let i = 0; i < 2400; i++) {
          const x = r() * 1920,
            y = 250 + r() * 88;
          box(
            c,
            ["#7b8754", "#909056", "#a1a16a", "#435e49"][i % 4],
            x,
            y,
            2 + r() * 5,
            3 + r() * 13,
          );
        }
        for (let i = 0; i < 25; i++) {
          const x = i * 94,
            h = 36 + r() * 55;
          box(c, "#444f40", x, 300 - h, 5, h);
          for (let j = 0; j < 6; j++)
            poly(c, region === 3 ? "#314c40" : "#3e5947", [
              [x - 22 + j * 2, 270 - h + j * 7],
              [x + 2, 226 - h + j * 10],
              [x + 28 - j * 2, 270 - h + j * 7],
            ]);
        }
        if (region === 4) {
          for (let x = 0; x < 1920; x += 110) {
            box(c, "#575e4b", x, 270, 4, 58);
            box(c, "#8c9479", x, 282, 105, 2);
          }
          box(c, "#6e745c", 560, 254, 120, 58);
          box(c, "#303f37", 570, 263, 100, 8);
        }
      }
      if (layer === 3) {
        box(c, "#b19e70", 0, 334, 1920, 10);
        box(c, "#d1c08b", 0, 344, 1920, 4);
        box(c, "#333e3c", 0, 348, 1920, 121);
        for (let i = 0; i < 2200; i++) {
          const x = r() * 1920,
            y = 350 + r() * 116;
          box(
            c,
            ["#74807712", "#a1a18a0d", "#111e2318"][i % 3],
            x,
            y,
            3 + r() * 19,
            1 + r() * 4,
          );
        }
        for (let x = 0; x < 1920; x += 122) {
          box(c, "#c4b470", x, 413, 64, 3);
          box(c, "#e2cf8d", x, 413, 58, 1);
        }
        box(c, "#b2b4a0", 0, 470, 1920, 3);
        box(c, "#293a32", 0, 473, 1920, 3);
        box(c, "#9a885b", 0, 476, 1920, 8);
        box(c, "#554e37", 0, 484, 1920, 56);
        for (let i = 0; i < 1600; i++) {
          const x = r() * 1920,
            y = 480 + r() * 60;
          box(
            c,
            ["#7d744733", "#a49b5a20", "#282d2228"][i % 3],
            x,
            y,
            2 + r() * 8,
            2 + r() * 6,
          );
        }
        for (let i = 0; i < 150; i++) {
          const x = r() * 1920;
          box(c, "#8e8f5b", x, 478 - r() * 9, 2, 10);
        }
      }
    }
  }
  draw(c: C, camera: number, region: number, time: number) {
    if (region !== this.region) this.build(region);
    for (let i = 0; i < 4; i++) {
      const off = (((camera * [0.025, 0.13, 0.35, 1][i]) % 1920) + 1920) % 1920;
      c.drawImage(this.layers[i], -Math.round(off), 0);
      c.drawImage(this.layers[i], 1920 - Math.round(off), 0);
    }
    for (let i = 0; i < 18; i++) {
      const x = (i * 73 + time * (4 + (i % 4))) % 960,
        y = 180 + ((i * 43) % 150) + Math.sin(time + i) * 6;
      box(c, "#e5d4a350", x, y, 2, 1);
    }
  }
}
