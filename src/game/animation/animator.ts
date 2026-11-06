import { WEAPONS } from "../combat/weapons";
import type { Player, Enemy, EnemyKind } from "../entities/model";
import { ENEMIES } from "../entities/model";
import {
  clamp,
  lerp,
  smooth,
  vec,
  mix,
  rotate,
  offset,
  solveIK,
  spring,
  samplePath,
  type Vec,
  type Chain,
  type Spring,
} from "./kinematics";

interface Foot {
  x: number;
  y: number;
  start: number;
  phase: number;
  planted: boolean;
}
export interface Animation {
  clock: number;
  previousX: number;
  previousFacing: number;
  velocity: number;
  gait: number;
  motion: number;
  facing: number;
  feet: [Foot, Foot];
  lean: Spring;
  recoil: Spring;
  flinch: Spring;
  previousRecoil: number;
  previousHurt: number;
  reloadDuration: number;
  reloadProgress: number;
  wasReloading: boolean;
  death: number;
  dead: boolean;
  deathDirection: number;
}
export interface Pose {
  pelvis: Vec;
  chest: Vec;
  head: Vec;
  neck: Vec;
  headAngle: number;
  torsoAngle: number;
  legs: [Chain, Chain];
  arms: [Chain, Chain];
  feet: [number, number];
  gun?: {
    position: Vec;
    angle: number;
    magazine: number;
    magazineHand: Vec;
    slide: number;
  };
  root: Vec;
  rotation: number;
  facing: number;
  breath: number;
  cloth: number;
  dead: boolean;
  hit: number;
}
function create(x: number, facing: number): Animation {
  return {
    clock: 0,
    previousX: x,
    previousFacing: facing,
    velocity: 0,
    gait: 0.5,
    motion: 0,
    facing,
    feet: [
      { x: x - 7, y: 0, start: x - 7, phase: 0.5, planted: true },
      { x: x + 8, y: 0, start: x + 8, phase: 0, planted: true },
    ],
    lean: { value: 0, velocity: 0 },
    recoil: { value: 0, velocity: 0 },
    flinch: { value: 0, velocity: 0 },
    previousRecoil: 0,
    previousHurt: 0,
    reloadDuration: 1,
    reloadProgress: 0,
    wasReloading: false,
    death: 0,
    dead: false,
    deathDirection: 1,
  };
}
function locomotion(
  a: Animation,
  x: number,
  dt: number,
  stride: number,
  scale = 1,
) {
  const dx = x - a.previousX;
  a.previousX = x;
  const speed = Math.abs(dx) / Math.max(dt, 0.0001),
    direction = Math.sign(dx) || a.previousFacing;
  a.velocity = lerp(
    a.velocity,
    dx / Math.max(dt, 0.0001),
    1 - Math.exp(-dt * 14),
  );
  a.motion = lerp(a.motion, speed > 2 ? 1 : 0, 1 - Math.exp(-dt * 14));
  const travel = Math.min(Math.abs(dx) / scale, stride * 0.45);
  a.gait += travel / stride;
  for (let i = 0; i < 2; i++) {
    const foot = a.feet[i],
      phase = (a.gait + i * 0.5) % 1,
      old = foot.phase,
      stance = 0.62;
    if (phase < old) {
      foot.x = x + direction * stride * 0.31 * scale;
      foot.planted = true;
      foot.y = 0;
    }
    if (phase >= stance) {
      if (old < stance) {
        foot.start = foot.x;
        foot.planted = false;
      }
      const t = (phase - stance) / (1 - stance),
        goal = x + direction * stride * 0.39 * scale;
      foot.x = lerp(foot.start, goal, smooth(t));
      foot.y = -Math.sin(Math.PI * t) * (stride > 55 ? 13 : 8) * scale;
    } else {
      foot.planted = true;
      foot.y = 0;
    }
    if (speed < 2) {
      foot.y = lerp(foot.y, 0, 1 - Math.exp(-dt * 24));
    }
    // Teleports and abrupt reversals should never leave a foot pinned metres away.
    foot.x = clamp(foot.x, x - 29 * scale, x + 29 * scale);
    foot.phase = phase;
  }
  if (speed > 2) a.previousFacing = direction;
}
export function updatePlayerAnimation(
  p: Player,
  dt: number,
  aim: number,
  reloadDuration: number,
  dead = false,
) {
  const a = (p.animation ??= create(p.x, p.facing));
  if (a.dead && a.death >= 1) return;
  a.clock += dt;
  a.facing = p.facing;
  const sprint = Math.abs(p.x - a.previousX) / Math.max(dt, 0.0001) > 125;
  if (!dead) locomotion(a, p.x, dt, sprint ? 68 : 47);
  spring(
    a.lean,
    dead ? 0 : clamp(a.velocity / 170, -1, 1) * p.facing * 0.14,
    14,
    dt,
  );
  if (p.recoil > a.previousRecoil + 0.5) a.recoil.velocity += p.recoil * 21;
  spring(a.recoil, 0, 24, dt);
  a.previousRecoil = p.recoil;
  if (p.hurt > a.previousHurt + 0.05) a.flinch.velocity += 12;
  spring(a.flinch, 0, 16, dt);
  a.previousHurt = p.hurt;
  if (p.reload > 0) {
    if (!a.wasReloading) a.reloadDuration = reloadDuration;
    a.reloadProgress = clamp(1 - p.reload / a.reloadDuration);
  } else a.reloadProgress = 0;
  a.wasReloading = p.reload > 0;
  if (dead && !a.dead) {
    a.deathDirection = -1;
    a.dead = true;
  }
  if (dead) a.death = clamp(a.death + dt / 1.0);
}
export function updateEnemyAnimation(e: Enemy, dt: number, targetX: number) {
  const a = (e.animation ??= create(e.x, Math.sign(targetX - e.x) || -1)),
    cfg = ENEMIES[e.kind];
  a.clock += a.dead && a.death >= 1 ? 0 : dt;
  if (e.state === "die") {
    if (!a.dead) {
      a.dead = true;
      a.deathDirection = (Math.sign(e.impulse) || -a.facing) * a.facing;
    }
    a.death = clamp(a.death + dt / (e.kind === "heavy" ? 1.1 : 0.85));
    return;
  }
  a.facing = Math.sign(targetX - e.x) || a.facing;
  locomotion(
    a,
    e.x,
    dt,
    e.kind === "heavy"
      ? 29
      : e.kind === "runner"
        ? 55
        : e.kind === "berserker"
          ? 52
          : e.kind === "crawler"
            ? 38
            : 32,
    cfg.scale,
  );
  spring(a.lean, clamp(Math.abs(a.velocity) / 100) * 0.15, 10, dt);
  if (e.state === "stagger" && a.previousHurt <= 0)
    a.flinch.velocity +=
      (e.headshot ? 25 : 17) * (Math.sign(e.impulse) || -a.facing) * a.facing;
  spring(a.flinch, 0, e.kind === "heavy" ? 12 : 17, dt);
  a.previousHurt = e.state === "stagger" ? 1 : 0;
}
function basePose(a: Animation): Pose {
  return {
    pelvis: vec(0, -47),
    chest: vec(0, -78),
    head: vec(0, -103),
    neck: vec(0, -90),
    headAngle: 0,
    torsoAngle: 0,
    legs: [] as unknown as [Chain, Chain],
    arms: [] as unknown as [Chain, Chain],
    feet: [0, 0],
    root: vec(0, 0),
    rotation: 0,
    facing: a.facing,
    breath: 0,
    cloth: 0,
    dead: a.dead,
    hit: 0,
  };
}
function makeLegs(
  pose: Pose,
  a: Animation,
  x: number,
  scale: number,
  bend: number,
  crouch = 0,
) {
  const targets = a.feet.map((foot, i) => {
    // Keep both feet in world space even while motion blends back to idle.
    // Blending feet toward a neutral pose here would reintroduce skating.
    const target = vec(((foot.x - x) / scale) * a.facing, foot.y / scale);
    if (crouch > 0) {
      target.x += (i ? -7 : 8) * crouch;
      target.y -= Math.sin(crouch * Math.PI) * 3;
    }
    return target;
  });
  // Lower the pelvis just enough to keep long strides within leg reach. This
  // makes grounded IK endpoints agree with the planted world-space feet.
  let drop = 0;
  for (let i = 0; i < 2; i++) {
    const horizontal = targets[i].x - (pose.pelvis.x + (i ? 4 : -4));
    const height = Math.sqrt(
      Math.max(1, 50.5 * 50.5 - horizontal * horizontal),
    );
    drop = Math.max(drop, targets[i].y - height - pose.pelvis.y);
  }
  for (const point of [pose.pelvis, pose.chest, pose.neck, pose.head])
    point.y += drop;
  for (let i = 0; i < 2; i++) {
    const foot = a.feet[i];
    pose.legs[i] = solveIK(
      offset(pose.pelvis, i ? 4 : -4, 0),
      targets[i],
      25,
      26,
      bend,
    );
    pose.feet[i] = foot.planted
      ? clamp((-a.velocity * a.facing) / 180, -0.2, 0.2) * a.motion
      : -Math.sin(foot.phase * Math.PI * 2) * 0.4;
  }
}
function groundDeath(p: Pose, a: Animation, headshot = false, crawler = false) {
  const t = a.death,
    fall = smooth((t - (headshot ? 0.06 : 0.12)) / (headshot ? 0.68 : 0.73)),
    buck = Math.sin(Math.PI * clamp(t / 0.7));
  p.pelvis.y += buck * (headshot ? 5 : 10);
  p.chest.y += buck * 8;
  p.neck.y += buck * 8;
  p.head.y += buck * 8;
  p.rotation = a.deathDirection * fall * (crawler ? 0.09 : 1.48);
  if (!crawler) {
    const relax = smooth((t - 0.25) / 0.65);
    p.chest.x = lerp(p.chest.x, p.pelvis.x + a.deathDirection * 3, relax);
    p.neck.x = lerp(p.neck.x, p.pelvis.x + a.deathDirection * 3, relax);
    p.head.x = lerp(p.head.x, p.pelvis.x + a.deathDirection * 4, relax);
  }
  p.headAngle +=
    a.deathDirection * (headshot ? 0.65 : 0.3) * Math.sin(Math.PI * t);
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    const foot = mix(
      p.legs[i].end,
      crawler
        ? vec(-51 + i * 5, -2)
        : vec(p.pelvis.x - a.deathDirection * (3 + i * 4), -3 - i * 3),
      smooth(t / 0.6),
    );
    p.legs[i] = solveIK(
      offset(p.pelvis, side * 4, 0),
      foot,
      25,
      26,
      crawler ? 1 : a.deathDirection,
    );
    const hand = mix(
      p.arms[i].end,
      crawler
        ? vec(32 + i * 9, -1)
        : vec(p.chest.x - a.deathDirection * (3 + i * 2), -55 + i * 12),
      smooth(t / 0.7),
    );
    p.arms[i] = solveIK(
      offset(p.chest, side * 6, 0),
      hand,
      21,
      24,
      crawler ? (i ? 1 : -1) : a.deathDirection,
    );
  }
  p.root.x = a.deathDirection * fall * 9;
  const points = [
    ...p.legs.flatMap((l) => [l.joint, l.end]),
    ...p.arms.flatMap((l) => [l.joint, l.end]),
    offset(p.head, -12, 12),
    offset(p.head, 12, 12),
    offset(p.head, -12, -16),
    offset(p.head, 12, -16),
    offset(p.chest, -14, 0),
    offset(p.chest, 14, 0),
    offset(p.pelvis, -13, 0),
    offset(p.pelvis, 13, 0),
  ];
  const max = Math.max(...points.map((v) => rotate(v, p.rotation).y + 4));
  p.root.y =
    -Math.max(0, max) -
    Math.sin(Math.PI * clamp((t - 0.65) / 0.35)) * 2 * (1 - t);
  p.cloth = 0;
  p.breath = 0;
}
export function playerPose(p: Player, aim: number, weapon: number): Pose {
  const a = p.animation ?? create(p.x, p.facing),
    out = basePose(a),
    stride = a.gait * Math.PI * 2;
  const breath = Math.sin(a.clock * 2.5) * 0.6,
    motion = a.motion,
    crouch = p.dodge > 0 ? Math.sin(Math.PI * clamp(1 - p.dodge / 0.32)) : 0;
  const bob = (1 - Math.cos(stride * 2)) * 1.25 * motion;
  out.pelvis = vec(
    Math.sin(stride) * 1.2 * motion,
    -49.5 + motion * 2.5 + bob + crouch * 17,
  );
  const lean = a.lean.value,
    flinch = a.flinch.value;
  out.chest = vec(
    out.pelvis.x + lean * 30 - a.recoil.value * 0.32 - flinch * 5,
    -78 + bob + breath + crouch * 27,
  );
  out.neck = offset(out.chest, 1, -12);
  out.head = offset(out.neck, 2, -13);
  const localAim = Math.atan2(Math.sin(aim), Math.cos(aim) * p.facing);
  out.headAngle = clamp(localAim, -0.9, 0.9) * 0.15 - flinch * 0.25;
  out.head.x += lean * 6;
  out.torsoAngle = lean;
  out.breath = breath;
  out.cloth = Math.sin(stride - 0.7) * motion * 1.4 + lean * 10;
  makeLegs(out, a, p.x, 1, -1, crouch);
  // The weapon is the constraint: both hands follow its grip points through IK.
  const reload = p.reload > 0 ? a.reloadProgress : 0,
    reloadBlend =
      p.reload > 0
        ? smooth(reload / 0.15) * (1 - smooth((reload - 0.85) / 0.15))
        : 0;
  const melee = p.melee > 0 ? 1 - p.melee / 0.28 : 0;
  const strike =
    p.melee > 0
      ? samplePath(
          [
            [0, -5, 0],
            [0.24, -10, 0],
            [0.48, 16, 0],
            [1, 0, 0],
          ],
          melee,
        ).x
      : 0;
  out.chest.x += strike * 0.4;
  out.neck.x += strike * 0.4;
  out.head.x += strike * 0.32;
  const angle =
    localAim * (1 - reloadBlend * 0.8) +
    reloadBlend * 0.6 -
    a.recoil.value * 0.035 +
    (p.melee > 0 ? -0.65 * Math.sin(melee * Math.PI) : 0);
  const direction = vec(Math.cos(angle), Math.sin(angle));
  const reach = weapon === 0 ? 25 : 21;
  const gun = offset(
    out.chest,
    direction.x * (reach - a.recoil.value * 0.6) + strike,
    direction.y * reach - 2 + crouch * -0.3,
  );
  const gripOffset = rotate(vec(3, 4), angle),
    supportOffset = rotate(
      vec(WEAPONS[weapon].support, weapon > 0 ? 4 : 8),
      angle,
    );
  const grip = offset(gun, gripOffset.x, gripOffset.y),
    support = offset(gun, supportOffset.x, supportOffset.y);
  let hand =
    p.melee > 0
      ? mix(support, offset(out.chest, 9, 11), Math.sin(melee * Math.PI) * 0.8)
      : support;
  if (p.reload > 0) {
    const path = samplePath(
      [
        [0, support.x, support.y],
        [0.18, gun.x + 5, gun.y + 11],
        [0.38, out.pelvis.x - 9, out.pelvis.y + 1],
        [0.59, out.pelvis.x - 7, out.pelvis.y - 2],
        [0.75, gun.x + 5, gun.y + 10],
        [0.87, gun.x + 11, gun.y - 7],
        [1, support.x, support.y],
      ],
      reload,
    );
    hand = path;
  }
  if (p.reload > 0 && weapon === 1) {
    const shellCycle = (reload * 3) % 1;
    hand = mix(
      offset(out.pelvis, -8, 0),
      offset(gun, 8, 8),
      Math.sin(shellCycle * Math.PI),
    );
  }
  if (weapon === 1 && p.reload <= 0) {
    hand.x -= Math.sin(clamp(p.recoil / 12) * Math.PI) * 5;
  }
  out.arms[0] = solveIK(offset(out.chest, -6, 1), hand, 22, 25, 1);
  out.arms[1] = solveIK(offset(out.chest, 4, -1), grip, 21, 23, 1);
  out.gun = {
    position: gun,
    angle,
    magazine: p.reload > 0 && reload > 0.2 && reload < 0.75 ? 1 : 0,
    magazineHand: out.arms[0].end,
    slide: clamp(a.recoil.value / 7),
  };
  out.hit = flinch;
  if (a.dead) {
    groundDeath(out, a);
    out.gun.position = out.arms[1].end;
    out.gun.angle += a.death * 1.2;
  }
  return out;
}
export const PERSONALITY: Record<
  EnemyKind,
  { hunch: number; headTilt: number; limp: number; reach: number }
> = {
  walker: { hunch: 8, headTilt: 0.14, limp: 3, reach: 24 },
  runner: { hunch: 13, headTilt: -0.1, limp: 0, reach: 8 },
  heavy: { hunch: 4, headTilt: 0.03, limp: 1, reach: 14 },
  crawler: { hunch: 0, headTilt: -0.2, limp: 0, reach: 35 },
  berserker: { hunch: 17, headTilt: 0.18, limp: 2, reach: 19 },
};
export function enemyPose(e: Enemy): Pose {
  const a = e.animation ?? create(e.x, -1),
    cfg = ENEMIES[e.kind],
    style = PERSONALITY[e.kind],
    out = basePose(a);
  const cycle = a.gait * Math.PI * 2,
    walk = a.motion,
    sway = Math.sin(cycle),
    breath = Math.sin(a.clock * 2 + e.id) * 0.7;
  const impact = a.flinch.value,
    attack =
      e.state === "attack"
        ? e.attack > 0
          ? Math.sin(Math.PI * clamp((1 - e.attack) / 0.45))
          : smooth(1 - e.timer / 0.48) * 0.3
        : 0;
  const weight =
    (1 - Math.cos(cycle * 2)) * (e.kind === "heavy" ? 2.5 : 1.2) * walk;
  const spawn = e.state === "spawn" ? smooth(clamp(e.timer / 0.35)) : 0;
  out.pelvis = vec(
    sway * walk,
    -47 + weight + Math.max(0, sway) * style.limp * walk + spawn * 8,
  );
  out.chest = vec(
    style.hunch + a.lean.value * 15 + attack * 11 + impact * 10,
    -78 + weight + breath + spawn * 13,
  );
  out.neck = offset(out.chest, 2, -12);
  out.head = offset(out.neck, 2, -13);
  out.headAngle =
    style.headTilt +
    Math.sin(cycle - 0.6) * 0.07 * walk +
    impact * (e.headshot ? 0.55 : 0.18) -
    attack * 0.15;
  out.cloth = Math.sin(cycle - 1) * walk * 2;
  out.breath = breath;
  out.torsoAngle = 0.1;
  makeLegs(out, a, e.x, cfg.scale, -1);
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1,
      shoulder = offset(out.chest, side * 6, 0);
    const running =
      e.kind === "runner" ||
      (e.kind === "berserker" && Math.abs(a.velocity) > 65);
    const pump = running
      ? Math.sin(cycle + side * Math.PI) * 16
      : Math.sin(cycle + side) * 4;
    let hand = offset(
      out.chest,
      style.reach + pump + attack * 19 - i * 4,
      -1 + (running ? 12 : 17) + side * 6 - attack * 20,
    );
    if (e.kind === "heavy")
      hand = offset(out.chest, 14 + attack * 25 + side * 4, 29 - attack * 30);
    out.arms[i] = solveIK(shoulder, hand, 23, 26, i ? 1 : -1);
  }
  if (e.kind === "crawler") {
    out.pelvis = vec(-18, -14 + sway * 1.5);
    out.chest = vec(15, -23 + Math.cos(cycle * 2) * 2);
    out.neck = offset(out.chest, 10, -2);
    out.head = offset(out.neck, 12, -4);
    out.headAngle = -0.18 + impact * 0.4;
    for (let i = 0; i < 2; i++) {
      const wave = Math.sin(cycle + i * Math.PI),
        root = offset(out.chest, i ? 4 : -5, 1);
      out.arms[i] = solveIK(
        root,
        vec(
          30 + wave * 18 + attack * 13,
          Math.min(0, -Math.cos(cycle + i * Math.PI) * 8),
        ),
        22,
        25,
        i ? 1 : -1,
      );
      out.legs[i] = solveIK(
        offset(out.pelvis, i ? 3 : -3, 0),
        vec(-51 + i * 5, -2 + Math.max(0, wave) * 3),
        25,
        26,
        1,
      );
      out.feet[i] = 0.35;
    }
  }
  out.hit = impact;
  if (a.dead) groundDeath(out, a, e.headshot, e.kind === "crawler");
  return out;
}
export function worldPoint(
  pose: Pose,
  point: Vec,
  x: number,
  y: number,
  scale = 1,
): Vec {
  const p = rotate(point, pose.rotation);
  return vec(
    x + (p.x + pose.root.x) * pose.facing * scale,
    y + (p.y + pose.root.y) * scale,
  );
}
export function playerMuzzle(p: Player, aim: number, weapon: number): Vec {
  const pose = playerPose(p, aim, weapon),
    gun = pose.gun!;
  const barrel = WEAPONS[weapon].barrel;
  const tip = rotate(vec(barrel, -1), gun.angle);
  return worldPoint(pose, offset(gun.position, tip.x, tip.y), p.x, p.y);
}
export function enemyHitAreas(e: Enemy) {
  const pose = enemyPose(e),
    scale = ENEMIES[e.kind].scale;
  return {
    head: worldPoint(pose, pose.head, e.x, e.y, scale),
    body: worldPoint(pose, mix(pose.pelvis, pose.chest, 0.6), e.x, e.y, scale),
  };
}
