import { describe, it, expect } from "vitest";
import {
  Run,
  enemyKind,
  transitionEnemy,
  ENEMIES,
  type Enemy,
} from "../src/game/entities/model";
import { damageForHit, rayCircle, WEAPONS } from "../src/game/combat/weapons";
function enemy(): Enemy {
  return {
    id: 1,
    x: 0,
    y: 425,
    kind: "walker",
    hp: 65,
    state: "spawn",
    timer: 0.1,
    phase: 0,
    attack: 0,
    fall: 0,
    impulse: 0,
    headshot: false,
  };
}
describe("ballistics", () => {
  it("resolves nearest forward intersections, misses and targets behind the muzzle", () => {
    expect(rayCircle(0, 0, 1, 0, 100, 0, 10)).toBe(90);
    expect(rayCircle(0, 0, 1, 0, 100, 20, 10)).toBeNull();
    expect(rayCircle(0, 0, 1, 0, -100, 0, 10)).toBeNull();
    expect(rayCircle(0, 0, -1, 0, -100, 0, 10)).toBe(90);
  });
  it("rewards headshots and applies purchased damage upgrades", () => {
    expect(damageForHit(30, false)).toBe(30);
    expect(damageForHit(30, true)).toBe(72);
    expect(damageForHit(30, true, 2)).toBe(101);
  });
  it("defines six distinct finite, usable weapon configurations", () => {
    expect(new Set(WEAPONS.map((w) => w.name)).size).toBe(6);
    for (const w of WEAPONS) {
      expect(w.magazine).toBeGreaterThan(0);
      expect(w.reload).toBeGreaterThan(w.rate);
      expect(w.damage).toBeGreaterThan(0);
    }
  });
});
describe("enemy state machine", () => {
  it("spawns, approaches, attacks, disengages, staggers, recovers and dies", () => {
    const e = enemy();
    transitionEnemy(e, 0.2, 300);
    expect(e.state).toBe("approach");
    transitionEnemy(e, 0.01, 30);
    expect(e.state).toBe("attack");
    transitionEnemy(e, 0.01, 100);
    expect(e.state).toBe("approach");
    e.state = "stagger";
    e.timer = 0.1;
    transitionEnemy(e, 0.2, 100);
    expect(e.state).toBe("recover");
    transitionEnemy(e, 0.3, 100);
    expect(e.state).toBe("approach");
    e.hp = 0;
    transitionEnemy(e, 0.01, 100);
    expect(e.state).toBe("die");
  });
  it("unlocks the full roster while keeping the first wave approachable", () => {
    for (let i = 0; i < 10; i++)
      expect(["walker", "runner"]).toContain(enemyKind(1, i / 10));
    expect(
      new Set(Array.from({ length: 10 }, (_, i) => enemyKind(3, i / 10))).size,
    ).toBe(5);
    expect(ENEMIES.heavy.hp).toBeGreaterThan(ENEMIES.runner.hp);
  });
});
describe("survival economy", () => {
  it("advances waves, awards bonuses and changes location every three waves", () => {
    const r = new Run();
    r.startWave();
    expect(r.remaining).toBe(9);
    expect(r.phase).toBe("playing");
    r.finishWave();
    expect(r.phase).toBe("prep");
    expect(r.money).toBe(210);
    for (let i = 0; i < 3; i++) r.startWave();
    expect(r.region).toBe(1);
  });
  it("rejects unaffordable and duplicate purchases without spending", () => {
    const r = new Run();
    expect(r.purchase("5")).toBe(false);
    expect(r.money).toBe(120);
    r.money = 1000;
    expect(r.purchase("5")).toBe(true);
    expect(r.weapon).toBe(5);
    expect(r.money).toBe(300);
    expect(r.purchase("5")).toBe(false);
    expect(r.money).toBe(300);
  });
  it("applies health, ammo and upgrades and caps progression", () => {
    const r = new Run();
    r.money = 10000;
    r.player.hp = 50;
    expect(r.purchase("heal")).toBe(true);
    expect(r.player.hp).toBe(100);
    expect(r.purchase("heal")).toBe(false);
    r.purchase("health");
    expect(r.player.maxHp).toBe(125);
    expect(r.player.hp).toBe(125);
    const reserves = [...r.reserve];
    r.purchase("ammo");
    expect(r.reserve.every((v, i) => v > reserves[i])).toBe(true);
    for (let i = 0; i < 7; i++) r.purchase("damage");
    expect(r.damageLevel).toBe(5);
    expect(r.purchase("damage")).toBe(false);
  });
});
