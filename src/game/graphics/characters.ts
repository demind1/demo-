import { ENEMIES, type Player, type Enemy } from "../entities/model";
import { WEAPONS } from "../combat/weapons";
import { playerPose, enemyPose, type Pose } from "../animation/animator";
import {
  vec,
  offset,
  rotate,
  type Vec,
  type Chain,
} from "../animation/kinematics";
type C = CanvasRenderingContext2D;
function rect(c: C, color: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function shape(c: C, color: string, pts: number[][]) {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
/** Tapered, bevelled sprite segments: the joints share exact IK endpoints. */
function segment(
  c: C,
  a: Vec,
  b: Vec,
  width: number,
  color: string,
  light: string,
  dark: string,
  taper = 0.8,
) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  c.save();
  c.translate(a.x, a.y);
  c.rotate(Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2);
  const w = width / 2,
    end = w * taper;
  shape(c, "#172723", [
    [-w - 1, 1],
    [-w + 1, -2],
    [w - 1, -2],
    [w + 1, 1],
    [end + 1, length - 1],
    [end - 1, length + 2],
    [-end + 1, length + 2],
    [-end - 1, length - 1],
  ]);
  shape(c, color, [
    [-w, 1],
    [-w + 2, -1],
    [w - 1, -1],
    [w, 2],
    [end, length],
    [-end, length],
  ]);
  shape(c, light, [
    [-w + 1, 2],
    [-w + 3, 1],
    [-end + 3, length - 3],
    [-end + 1, length - 2],
  ]);
  shape(c, dark, [
    [w - 3, 3],
    [w, 3],
    [end, length],
    [end - 3, length - 1],
  ]);
  rect(c, dark, -end, length * 0.65, width * 0.7, 2);
  c.restore();
}
function leg(
  c: C,
  chain: Chain,
  front: boolean,
  zombie: boolean,
  skin: string,
  footAngle: number,
  crawler = false,
) {
  const cloth = zombie
    ? front
      ? "#626b5c"
      : "#495448"
    : front
      ? "#b7a17b"
      : "#8e8369";
  const light = zombie ? "#8d9374" : front ? "#d1bd94" : "#a59879";
  segment(
    c,
    chain.root,
    chain.joint,
    zombie ? 9 : 11,
    cloth,
    light,
    zombie ? "#3d4c42" : "#736c54",
  );
  segment(
    c,
    chain.joint,
    chain.end,
    zombie ? 7 : 9,
    zombie ? skin : cloth,
    zombie ? "#bcc09a" : light,
    zombie ? "#58684e" : "#746e58",
  );
  c.save();
  c.translate(chain.joint.x, chain.joint.y);
  rect(c, zombie ? "#713b30" : "#736e56", -4, -2, 8, 5);
  rect(c, zombie ? "#af6f4c" : "#a49472", -3, -2, 5, 2);
  c.restore();
  c.save();
  c.translate(chain.end.x, chain.end.y);
  c.rotate(footAngle + (crawler ? 0.5 : 0));
  shape(c, "#1b2927", [
    [-6, -4],
    [3, -4],
    [5, -1],
    [10, 0],
    [11, 5],
    [-6, 5],
  ]);
  rect(c, "#4d5141", -5, -3, 8, 4);
  rect(c, "#8b8568", -4, -3, 5, 1);
  rect(c, "#9a9679", -5, 5, 15, 1);
  rect(c, "#293831", -4, 0, 7, 2);
  c.restore();
}
function arm(
  c: C,
  chain: Chain,
  shirt: string,
  skin: string,
  front: boolean,
  zombie = false,
) {
  segment(
    c,
    chain.root,
    chain.joint,
    zombie ? 8 : 10,
    shirt,
    front ? "#96a58a" : "#667a66",
    zombie ? "#495449" : "#354e43",
  );
  const elbow = chain.joint;
  segment(
    c,
    elbow,
    chain.end,
    zombie ? 6 : 7,
    skin,
    front ? "#d7bc93" : "#a69b77",
    zombie ? "#657252" : "#8c7759",
  );
  rect(c, zombie ? "#8c3e32" : "#576d5b", elbow.x - 4, elbow.y - 2, 8, 4);
}
function hand(c: C, p: Vec, skin: string, angle = 0, zombie = false) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(angle);
  shape(c, skin, [
    [-3, -3],
    [3, -3],
    [5, -1],
    [6, 3],
    [3, 5],
    [-2, 4],
  ]);
  rect(c, zombie ? "#c2c4a0" : "#dfc29a", -2, -2, 5, 2);
  rect(c, zombie ? "#63714f" : "#495d4e", -3, 2, 4, 3);
  if (zombie) {
    rect(c, "#c2b48d", 3, 3, 5, 2);
    rect(c, "#828d67", 3, 0, 4, 2);
  }
  c.restore();
}
function torso(c: C, p: Pose, shirt: string, zombie: boolean, heavy = false) {
  const { chest: t, pelvis: h } = p;
  shape(c, "#172b26", [
    [t.x - 13, t.y - 4],
    [t.x + 10, t.y - 5],
    [t.x + 16, t.y + 5],
    [h.x + 13, h.y + 4],
    [h.x - 13, h.y + 4],
    [t.x - 17, t.y + 8],
  ]);
  shape(c, shirt, [
    [t.x - 11, t.y - 4],
    [t.x + 9, t.y - 4],
    [t.x + 13, t.y + 5],
    [h.x + 11, h.y + 2],
    [h.x - 11, h.y + 2],
    [t.x - 14, t.y + 7],
  ]);
  shape(c, zombie ? "#d7c5a22b" : "#8f9c7c55", [
    [t.x - 10, t.y - 2],
    [t.x - 4, t.y - 2],
    [h.x - 5, h.y - 3],
    [h.x - 11, h.y - 2],
  ]);
  shape(c, "#18352d35", [
    [t.x + 9, t.y + 4],
    [t.x + 13, t.y + 5],
    [h.x + 11, h.y + 1],
    [h.x + 3, h.y],
  ]);
  if (zombie) {
    shape(c, "#6a352c", [
      [t.x + 6, t.y + 9],
      [t.x + 9, t.y + 21],
      [h.x + 5, h.y],
      [h.x - 1, h.y - 2],
      [t.x + 1, t.y + 17],
    ]);
    rect(c, "#c6b38d55", t.x - 8, t.y + 7, 5, 2);
    rect(c, "#4d4a372c", h.x - 8, h.y - 8, 16, 3);
    if (heavy) {
      shape(c, "#273b35", [
        [t.x - 12, t.y + 1],
        [t.x + 12, t.y + 2],
        [h.x + 10, h.y - 8],
        [h.x - 11, h.y - 9],
      ]);
      rect(c, "#778c73", t.x - 9, t.y + 5, 19, 2);
      rect(c, "#a4996c", t.x - 2, t.y + 12, 7, 8);
    }
  } else {
    // Harness, jacket seams, asymmetric pouches and worn plate carrier.
    shape(c, "#a4ac87", [
      [t.x - 8, t.y - 3],
      [t.x - 5, t.y - 3],
      [h.x + 5, h.y - 9],
      [h.x + 2, h.y - 9],
    ]);
    shape(c, "#233e34", [
      [t.x - 10, t.y + 11],
      [t.x + 11, t.y + 12],
      [h.x + 11, h.y - 3],
      [h.x - 10, h.y - 4],
    ]);
    for (let i = 0; i < 2; i++) {
      rect(c, "#526e59", t.x - 8 + i * 10, t.y + 18, 8, 10);
      rect(c, "#829276", t.x - 7 + i * 10, t.y + 18, 6, 2);
      rect(c, "#1c332c", t.x - 5 + i * 10, t.y + 20, 2, 5);
    }
    rect(c, "#b1b18b", t.x + 6, t.y + 4, 5, 3);
    rect(c, "#3c5142", t.x - 10, t.y + 3, 9, 5);
  }
  rect(c, "#293a2e", h.x - 12, h.y - 1, 25, 5);
  rect(c, zombie ? "#8b825e" : "#baad7c", h.x + 2, h.y, 5, 3);
}
function head(c: C, p: Pose, skin: string, kind: "player" | Enemy["kind"]) {
  segment(
    c,
    p.neck,
    offset(p.chest, 0, -1),
    8,
    skin,
    kind === "player" ? "#d2b48a" : "#a3aa7d",
    "#647253",
  );
  c.save();
  c.translate(p.head.x, p.head.y);
  c.rotate(p.headAngle);
  // The neck remains connected while the head counter-rotates with the gait.
  rect(c, kind === "player" ? "#927454" : "#717d55", -4, 10, 9, 8);
  shape(c, "#203129", [
    [-10, -10],
    [-6, -15],
    [6, -15],
    [11, -10],
    [12, 0],
    [15, 2],
    [11, 6],
    [9, 13],
    [-2, 15],
    [-10, 8],
    [-12, -3],
  ]);
  shape(c, skin, [
    [-9, -10],
    [-5, -13],
    [5, -13],
    [10, -9],
    [10, 0],
    [13, 2],
    [9, 4],
    [8, 11],
    [-1, 13],
    [-9, 7],
    [-10, -3],
  ]);
  rect(c, kind === "player" ? "#dfba8b" : "#c0bf92", 4, -8, 5, 9);
  rect(c, kind === "player" ? "#a4825e" : "#6c7e56", -10, -1, 4, 8);
  rect(c, kind === "player" ? "#cfaa7f" : "#969b73", -11, 0, 3, 4);
  rect(c, "#293c2b", 3, -5, 8, 3);
  rect(c, kind === "player" ? "#d4deaf" : "#d6d88b", 6, -4, 4, 2);
  rect(c, "#384b31", 9, -4, 1, 2);
  if (kind === "player") {
    shape(c, "#6f553e", [
      [0, 7],
      [7, 8],
      [9, 6],
      [8, 12],
      [1, 14],
      [-4, 10],
    ]);
    rect(c, "#bb9671", 3, 7, 5, 1);
    shape(c, "#263e33", [
      [-13, -10],
      [-11, -19],
      [-5, -22],
      [7, -21],
      [12, -17],
      [12, -10],
    ]);
    rect(c, "#667d61", -9, -18, 17, 3);
    rect(c, "#1c322c", -13, -11, 31, 5);
    rect(c, "#a3ad81", -3, -12, 6, 2);
  } else {
    shape(c, "#303d2e", [
      [-12, -6],
      [-12, -15],
      [-7, -19],
      [5, -19],
      [11, -13],
      [5, -10],
      [-2, -13],
      [-7, -8],
      [-8, 0],
    ]);
    rect(c, "#853c30", 3, 7, 7, 4);
    rect(c, "#cec6a0", 4, 7, 5, 2);
    rect(c, "#6f6c49", 1, 2, 4, 2);
    if (kind === "runner") {
      rect(c, "#995c43", -11, -15, 22, 6);
      rect(c, "#c48c60", -8, -15, 16, 2);
    }
    if (kind === "heavy") {
      shape(c, "#44594b", [
        [-13, -10],
        [-12, -21],
        [6, -23],
        [13, -17],
        [14, -9],
      ]);
      rect(c, "#73846c", -8, -20, 15, 3);
      rect(c, "#293e33", -12, -10, 26, 3);
    }
    if (kind === "berserker") {
      rect(c, "#7e3b32", -5, -7, 16, 4);
      rect(c, "#dee0a2", 7, -5, 4, 2);
      rect(c, "#715045", -7, 5, 4, 7);
    }
  }
  c.restore();
}
export function weaponArt(
  c: C,
  id: number,
  x: number,
  y: number,
  angle: number,
  recoil = 0,
  magazine = true,
  slide = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.translate(-recoil, 0);
  const long = id > 1,
    l = long ? [0, 0, 37, 39, 26, 50][id] : 19;
  shape(c, "#111f1c", [
    [-6, -6],
    [l + 8, -6],
    [l + 10, -3],
    [l + 10, 3],
    [8, 4],
    [7, 12],
    [1, 12],
    [-1, 2],
    [-6, 2],
  ]);
  rect(c, WEAPONS[id].color, -4 - slide * 3, -5, l - 4, 3);
  rect(c, "#687c70", 0, -2, l, 3);
  rect(c, "#1c2a25", l + 5, -4, 4, 5);
  rect(c, "#445548", 2, 1, 5, 10);
  rect(c, "#9a9d82", 4, 3, 1, 5);
  if (long) {
    shape(c, "#806c4e", [
      [-18, -4],
      [-5, -4],
      [-5, 3],
      [-16, 8],
      [-19, 7],
    ]);
    rect(c, "#443e30", -18, -2, 3, 9);
    if (magazine) {
      shape(c, "#263d32", [
        [14, 2],
        [22, 2],
        [20, 14],
        [14, 12],
      ]);
      rect(c, "#62755d", 16, 4, 3, 6);
    }
    rect(c, "#899b82", 10, -7, 4, 2);
    rect(c, "#172b25", 25, -3, 2, 4);
  }
  if (id === 5) {
    rect(c, "#142822", 8, -12, 21, 5);
    rect(c, "#9cad91", 10, -12, 15, 1);
    rect(c, "#637a6a", 26, -11, 3, 3);
  }
  if (id === 1) {
    rect(c, "#7d897b", 4, -4, 8, 8);
    rect(c, "#c3be98", 6, -3, 2, 5);
  }
  if (id === 2) rect(c, "#9e8056", 17, -1, 14, 4);
  c.restore();
}
function transform(c: C, x: number, y: number, p: Pose, scale = 1) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(p.facing * scale, scale);
  c.translate(p.root.x, p.root.y);
  c.rotate(p.rotation);
}
export function survivor(
  c: C,
  p: Player,
  aim: number,
  weapon: number,
  _time: number,
) {
  const pose = playerPose(p, aim, weapon),
    gun = pose.gun!;
  transform(c, p.x, p.y, pose);
  leg(c, pose.legs[0], false, false, "", pose.feet[0]);
  leg(c, pose.legs[1], true, false, "", pose.feet[1]);
  const t = pose.chest;
  c.save();
  c.translate(t.x - 18, t.y + 4);
  c.rotate(-pose.cloth * 0.025);
  shape(c, "#203b30", [
    [-8, -7],
    [2, -8],
    [7, -2],
    [7, 27],
    [-5, 30],
    [-10, 21],
  ]);
  rect(c, "#50684f", -7, -4, 9, 27);
  rect(c, "#83936f", -5, -3, 5, 2);
  rect(c, "#2d4938", -7, 11, 8, 12);
  rect(c, "#9a9870", -4, 12, 3, 2);
  c.restore();
  arm(c, pose.arms[0], "#526e5c", "#b69a73", false);
  torso(c, pose, "#526b58", false);
  head(c, pose, "#c7a179", "player");
  arm(c, pose.arms[1], "#637c66", "#c5a77e", true);
  weaponArt(
    c,
    weapon,
    gun.position.x,
    gun.position.y,
    gun.angle,
    0,
    !gun.magazine,
    gun.slide,
  );
  hand(c, pose.arms[1].end, "#c8ac82", gun.angle);
  // Offhand stays readable above the receiver and manipulates a visible magazine.
  hand(c, pose.arms[0].end, "#b89e77", p.reload > 0 ? -0.2 : gun.angle);
  if (gun.magazine) {
    c.save();
    c.translate(gun.magazineHand.x, gun.magazineHand.y);
    c.rotate(-0.25);
    rect(c, "#172e25", -2, -2, 6, 12);
    rect(c, "#72836a", -1, -1, 2, 9);
    rect(c, "#c1ac70", -1, -3, 4, 2);
    c.restore();
  }
  c.restore();
}
export function zombie(c: C, e: Enemy, _time: number) {
  const pose = enemyPose(e),
    cfg = ENEMIES[e.kind],
    crawler = e.kind === "crawler";
  transform(c, e.x, e.y, pose, cfg.scale);
  leg(c, pose.legs[0], false, true, cfg.skin, pose.feet[0], crawler);
  arm(c, pose.arms[0], cfg.shirt, cfg.skin, false, true);
  leg(c, pose.legs[1], true, true, cfg.skin, pose.feet[1], crawler);
  torso(c, pose, cfg.shirt, true, e.kind === "heavy");
  // Loose shirt tails lag behind the hips instead of moving as a rigid block.
  const hip = pose.pelvis;
  shape(c, cfg.shirt, [
    [hip.x - 10, hip.y - 3],
    [hip.x + 10, hip.y - 2],
    [hip.x + 8 + pose.cloth, hip.y + 6],
    [hip.x + 3, hip.y + 3],
    [hip.x - 2, hip.y + 7],
    [hip.x - 9 + pose.cloth, hip.y + 4],
  ]);
  head(c, pose, cfg.skin, e.kind);
  arm(c, pose.arms[1], cfg.shirt, cfg.skin, true, true);
  for (let i = 0; i < 2; i++) {
    const a = pose.arms[i];
    hand(
      c,
      a.end,
      cfg.skin,
      Math.atan2(a.end.y - a.joint.y, a.end.x - a.joint.x),
      true,
    );
  }
  c.restore();
}
