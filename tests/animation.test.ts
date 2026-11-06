import { describe, it, expect } from "vitest";
import {
  Run,
  ENEMIES,
  type Enemy,
  type EnemyKind,
} from "../src/game/entities/model";
import {
  solveIK,
  vec,
  spring,
  type Vec,
} from "../src/game/animation/kinematics";
import {
  updatePlayerAnimation,
  updateEnemyAnimation,
  playerPose,
  enemyPose,
  worldPoint,
  enemyHitAreas,
  playerMuzzle,
} from "../src/game/animation/animator";
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
function enemy(kind: EnemyKind = "walker"): Enemy {
  return {
    id: 5,
    kind,
    x: 500,
    y: 425,
    hp: 100,
    state: "approach",
    phase: 0,
    timer: 0,
    attack: 0,
    fall: 0,
    impulse: 0,
    headshot: false,
  };
}
describe("skeletal animation", () => {
  it("keeps exact bone lengths for reachable, unreachable and coincident IK targets", () => {
    for (const target of [vec(20, 20), vec(999, 0), vec(0, 0), vec(-30, -3)])
      for (const bend of [-1, 1]) {
        const chain = solveIK(vec(0, 0), target, 22, 25, bend);
        expect(distance(chain.root, chain.joint)).toBeCloseTo(22, 6);
        expect(distance(chain.joint, chain.end)).toBeCloseTo(25, 6);
      }
  });
  it("produces the same spring response at 30 and 120 FPS", () => {
    const run = (fps: number) => {
      const state = { value: 0, velocity: 40 };
      for (let i = 0; i < fps; i++) spring(state, 1, 12, 1 / fps);
      return state;
    };
    expect(run(30).value).toBeCloseTo(run(120).value, 9);
  });
  it("keeps planted feet at a fixed world position while the root moves", () => {
    const p = new Run().player;
    updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    for (let i = 0; i < 80; i++) {
      p.x += 95 / 60;
      updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    }
    let samples = 0;
    for (let i = 0; i < 50; i++) {
      const before = playerPose(p, 0, 0),
        states = p.animation!.feet.map((f) => ({
          planted: f.planted,
          phase: f.phase,
        }));
      const world = before.legs.map((l) => worldPoint(before, l.end, p.x, p.y));
      p.x += 95 / 60;
      updatePlayerAnimation(p, 1 / 60, 0, 1.25);
      const after = playerPose(p, 0, 0);
      for (let j = 0; j < 2; j++)
        if (
          states[j].planted &&
          p.animation!.feet[j].planted &&
          p.animation!.feet[j].phase > states[j].phase
        ) {
          const next = worldPoint(after, after.legs[j].end, p.x, p.y);
          expect(Math.abs(next.x - world[j].x)).toBeLessThan(0.08);
          expect(Math.abs(next.y - world[j].y)).toBeLessThan(0.08);
          samples++;
        }
    }
    expect(samples).toBeGreaterThan(30);
  });
  it("holds the stance horizontally while coming to a stop", () => {
    const p = new Run().player;
    updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    for (let i = 0; i < 40; i++) {
      p.x += 95 / 60;
      updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    }
    const before = playerPose(p, 0, 0).legs.map((l) => l.end.x);
    for (let i = 0; i < 60; i++) updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    const after = playerPose(p, 0, 0).legs.map((l) => l.end.x);
    for (let i = 0; i < 2; i++) expect(after[i]).toBeCloseTo(before[i], 5);
  });
  it("keeps a dying crawler horizontal throughout the collapse", () => {
    const e = enemy("crawler");
    updateEnemyAnimation(e, 1 / 60, 0);
    e.state = "die";
    e.hp = 0;
    e.impulse = 80;
    for (let i = 0; i < 80; i++) {
      updateEnemyAnimation(e, 1 / 60, 0);
      const pose = enemyPose(e);
      expect(Math.abs(pose.rotation)).toBeLessThan(0.15);
    }
  });
  it("moves the support hand through the magazine and belt during reload", () => {
    const p = new Run().player;
    p.reload = 1.1;
    updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    const first = playerPose(p, 0, 3);
    p.reload = 0.6;
    updatePlayerAnimation(p, 1 / 60, 0, 1.25);
    const middle = playerPose(p, 0, 3);
    expect(distance(first.arms[0].end, middle.arms[0].end)).toBeGreaterThan(15);
    expect(middle.gun!.magazine).toBe(1);
  });
  it("keeps wrists near the grips and muzzle positions finite when aiming both ways", () => {
    const p = new Run().player;
    for (const facing of [-1, 1])
      for (const aim of [-1.5, 0, 1.5, Math.PI]) {
        p.facing = facing;
        updatePlayerAnimation(p, 1 / 60, aim, 1.25);
        const pose = playerPose(p, aim, 3);
        expect(distance(pose.arms[1].end, pose.gun!.position)).toBeLessThan(7);
        const muzzle = playerMuzzle(p, aim, 3);
        expect(Number.isFinite(muzzle.x) && Number.isFinite(muzzle.y)).toBe(
          true,
        );
      }
  });
  it("gives every enemy a distinct skeleton, including a genuinely horizontal crawler", () => {
    const poses = Object.keys(ENEMIES).map((kind) => {
      const e = enemy(kind as EnemyKind);
      updateEnemyAnimation(e, 1 / 60, 0);
      return enemyPose(e);
    });
    expect(new Set(poses.map((p) => p.chest.x)).size).toBe(5);
    expect(poses[3].head.y).toBeGreaterThan(-40);
    expect(poses[0].head.y).toBeLessThan(-90);
  });
  it("uses the rendered head for hit detection through flinch and recovery", () => {
    const e = enemy();
    e.state = "stagger";
    e.headshot = true;
    e.impulse = 100;
    updateEnemyAnimation(e, 1 / 60, 0);
    const pose = enemyPose(e),
      expected = worldPoint(pose, pose.head, e.x, e.y, ENEMIES[e.kind].scale);
    expect(enemyHitAreas(e).head).toEqual(expected);
  });
  it("settles every corpse without continuing to breathe or drift", () => {
    for (const kind of Object.keys(ENEMIES)) {
      const e = enemy(kind as EnemyKind);
      updateEnemyAnimation(e, 1 / 60, 0);
      e.state = "die";
      e.hp = 0;
      e.impulse = 80;
      for (let i = 0; i < 100; i++) updateEnemyAnimation(e, 1 / 60, 0);
      const before = enemyPose(e);
      for (let i = 0; i < 60; i++) updateEnemyAnimation(e, 1 / 60, 0);
      expect(enemyPose(e)).toEqual(before);
      for (const l of [...before.legs, ...before.arms]) {
        const point = worldPoint(
          before,
          l.end,
          e.x,
          e.y,
          ENEMIES[e.kind as EnemyKind].scale,
        );
        expect(point.y).toBeLessThanOrEqual(e.y + 0.001);
      }
    }
  });
  it("renders the same pose repeatedly without advancing animation state", () => {
    const p = new Run().player;
    updatePlayerAnimation(p, 0.2, 0, 1.25);
    expect(playerPose(p, 0, 0)).toEqual(playerPose(p, 0, 0));
  });
});
