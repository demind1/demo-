export interface Weapon {
  name: string;
  tag: string;
  damage: number;
  rate: number;
  magazine: number;
  reload: number;
  recoil: number;
  spread: number;
  pellets: number;
  price: number;
  range: number;
  automatic: boolean;
  color: string;
  barrel: number;
  support: number;
}
export const WEAPONS: Weapon[] = [
  {
    name: "M9 PISTOL",
    tag: "Pistol",
    damage: 30,
    rate: 0.25,
    magazine: 15,
    reload: 1.25,
    recoil: 3,
    spread: 0.018,
    pellets: 1,
    price: 0,
    range: 820,
    automatic: false,
    color: "#9da5ad",
    barrel: 28,
    support: 3,
  },
  {
    name: "PUMP 12",
    tag: "Shotgun",
    damage: 24,
    rate: 0.85,
    magazine: 6,
    reload: 2.3,
    recoil: 12,
    spread: 0.13,
    pellets: 7,
    price: 320,
    range: 490,
    automatic: false,
    color: "#b1753c",
    barrel: 57,
    support: 19,
  },
  {
    name: "AK-47",
    tag: "Assault rifle",
    damage: 34,
    rate: 0.115,
    magazine: 30,
    reload: 1.8,
    recoil: 4,
    spread: 0.03,
    pellets: 1,
    price: 520,
    range: 1000,
    automatic: true,
    color: "#b46830",
    barrel: 52,
    support: 19,
  },
];
export function damageForHit(damage: number, head: boolean, level = 0) {
  return Math.round(damage * (head ? 2.4 : 1) * (1 + level * 0.2));
}
export function rayCircle(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  cx: number,
  cy: number,
  r: number,
): number | null {
  const x = ox - cx,
    y = oy - cy,
    b = x * dx + y * dy,
    c = x * x + y * y - r * r,
    d = b * b - c;
  if (d < 0) return null;
  const t = -b - Math.sqrt(d);
  return t >= 0 ? t : null;
}
