import { WEAPONS } from "../combat/weapons";
export type EnemyKind = "walker" | "runner" | "heavy" | "crawler" | "berserker";
export type EnemyState =
  | "spawn"
  | "approach"
  | "attack"
  | "stagger"
  | "recover"
  | "die";
export const ENEMIES: Record<
  EnemyKind,
  {
    hp: number;
    speed: number;
    damage: number;
    scale: number;
    reward: number;
    shirt: string;
    skin: string;
  }
> = {
  walker: {
    hp: 65,
    speed: 26,
    damage: 9,
    scale: 1,
    reward: 18,
    shirt: "#b6ae8a",
    skin: "#939c6c",
  },
  runner: {
    hp: 45,
    speed: 65,
    damage: 7,
    scale: 0.91,
    reward: 22,
    shirt: "#ac644b",
    skin: "#9da37e",
  },
  heavy: {
    hp: 230,
    speed: 19,
    damage: 20,
    scale: 1.32,
    reward: 45,
    shirt: "#58665a",
    skin: "#788b73",
  },
  crawler: {
    hp: 45,
    speed: 33,
    damage: 6,
    scale: 0.7,
    reward: 16,
    shirt: "#737c8a",
    skin: "#a6aa7d",
  },
  berserker: {
    hp: 120,
    speed: 49,
    damage: 13,
    scale: 1.08,
    reward: 35,
    shirt: "#654d58",
    skin: "#a8a08a",
  },
};
export interface Enemy {
  id: number;
  x: number;
  y: number;
  kind: EnemyKind;
  hp: number;
  state: EnemyState;
  timer: number;
  phase: number;
  attack: number;
  fall: number;
  impulse: number;
  headshot: boolean;
}
export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  facing: number;
  phase: number;
  moving: number;
  recoil: number;
  reload: number;
  dodge: number;
  dodgeCooldown: number;
  hurt: number;
  melee: number;
}
export type Phase =
  | "menu"
  | "playing"
  | "prep"
  | "paused"
  | "settings"
  | "over";
export class Run {
  player: Player = {
    x: 260,
    y: 425,
    hp: 100,
    maxHp: 100,
    facing: 1,
    phase: 0,
    moving: 0,
    recoil: 0,
    reload: 0,
    dodge: 0,
    dodgeCooldown: 0,
    hurt: 0,
    melee: 0,
  };
  enemies: Enemy[] = [];
  wave = 0;
  kills = 0;
  headshots = 0;
  money = 120;
  score = 0;
  elapsed = 0;
  weapon = 0;
  owned = [true, false, false, false, false, false];
  ammo = WEAPON_AMMO();
  reserve = [90, 36, 30, 120, 160, 25];
  damageLevel = 0;
  reloadLevel = 0;
  speedLevel = 0;
  medkits = 2;
  phase: Phase = "menu";
  remaining = 0;
  spawnTimer = 0;
  prepTimer = 0;
  nextId = 0;
  cooldown = 0;
  region = 0;
  startWave() {
    this.wave++;
    this.region = Math.floor((this.wave - 1) / 3) % 5;
    this.remaining = 6 + this.wave * 3;
    this.spawnTimer = 1;
    this.phase = "playing";
  }
  finishWave() {
    this.phase = "prep";
    this.prepTimer = 25;
    this.money += 70 + this.wave * 20;
  }
  purchase(item: string): boolean {
    const id = Number(item);
    if (Number.isInteger(id) && id >= 0 && id < 6) {
      if (!this.owned[id] && this.money >= WEAPONS[id].price) {
        this.money -= WEAPONS[id].price;
        this.owned[id] = true;
        this.weapon = id;
        this.player.reload = 0;
        return true;
      }
      return false;
    }
    const prices: Record<string, number> = {
      ammo: 60,
      heal: 65,
      health: 150,
      reload: 140,
      speed: 120,
      damage: 180,
      medkit: 70,
    };
    const price = prices[item];
    if (price === undefined || this.money < price) return false;
    if (item === "heal" && this.player.hp === this.player.maxHp) return false;
    if (
      (item === "damage" && this.damageLevel >= 5) ||
      (item === "reload" && this.reloadLevel >= 3) ||
      (item === "speed" && this.speedLevel >= 3) ||
      (item === "health" && this.player.maxHp >= 200)
    )
      return false;
    this.money -= price;
    if (item === "ammo")
      this.reserve = this.reserve.map(
        (v, i) => v + [60, 24, 18, 90, 100, 15][i],
      );
    if (item === "heal") this.player.hp = this.player.maxHp;
    if (item === "health") {
      this.player.maxHp += 25;
      this.player.hp += 25;
    }
    if (item === "reload") this.reloadLevel++;
    if (item === "speed") this.speedLevel++;
    if (item === "damage") this.damageLevel++;
    if (item === "medkit") this.medkits++;
    return true;
  }
}
function WEAPON_AMMO() {
  return WEAPONS.map((w) => w.magazine);
}
export function enemyKind(wave: number, random: number): EnemyKind {
  const options: EnemyKind[] =
    wave < 2
      ? ["walker", "runner"]
      : wave < 3
        ? ["walker", "runner", "crawler"]
        : ["walker", "runner", "heavy", "crawler", "berserker"];
  return options[
    Math.min(options.length - 1, Math.floor(random * options.length))
  ];
}
export function transitionEnemy(e: Enemy, dt: number, distance: number) {
  e.timer -= dt;
  e.attack = Math.max(0, e.attack - dt);
  if (e.hp <= 0) {
    e.state = "die";
    return;
  }
  if (e.state === "spawn" && e.timer <= 0) e.state = "approach";
  if (e.state === "stagger" && e.timer <= 0) {
    e.state = "recover";
    e.timer = 0.18;
  }
  if (e.state === "recover" && e.timer <= 0) e.state = "approach";
  if (e.state === "approach" && distance < 39) {
    e.state = "attack";
    e.timer = 0.48;
  }
  if (e.state === "attack" && distance > 55) e.state = "approach";
}
