export { survivor, zombie, weaponArt } from "./characters";
type C = CanvasRenderingContext2D;
export const W = 960,
  H = 540;
function box(c: C, color: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
export function poly(c: C, color: string, points: number[][]) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
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
        sky.addColorStop(0, "#6e9abe");
        sky.addColorStop(0.65, "#d8b59b");
        sky.addColorStop(1, "#ecc69a");
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
          poly(c, "#74849b", [
            [x - 100, 230],
            [x + 15, 130 + r() * 65],
            [x + 100, 160 + r() * 25],
            [x + 220, 230],
          ]);
        }
        for (let i = 0; i < 190; i++) {
          const x = i * 11;
          const h = 20 + r() * 36;
          box(c, "#526c67", x, 243 - h, 9, h);
          poly(c, "#667969", [
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
        box(c, "#798444", 0, 246, 1920, 95);
        for (let i = 0; i < 2400; i++) {
          const x = r() * 1920,
            y = 250 + r() * 88;
          box(
            c,
            ["#8da04b", "#b1ae55", "#c5b96c", "#526b35"][i % 4],
            x,
            y,
            2 + r() * 5,
            3 + r() * 13,
          );
        }
        for (let i = 0; i < 25; i++) {
          const x = i * 94,
            h = 36 + r() * 55;
          box(c, "#6e523b", x, 300 - h, 5, h);
          for (let j = 0; j < 6; j++)
            poly(c, region === 3 ? "#32573b" : "#4c673b", [
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
        box(c, "#bfa378", 0, 334, 1920, 10);
        box(c, "#d1c08b", 0, 344, 1920, 4);
        box(c, "#484747", 0, 348, 1920, 121);
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
        box(c, "#69533b", 0, 484, 1920, 56);
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
