export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  gravity: number;
}
export class Particles {
  pool: Particle[] = Array.from({ length: 450 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 0,
    color: "",
    size: 1,
    gravity: 0,
  }));
  cursor = 0;
  emit(
    x: number,
    y: number,
    count: number,
    color: string,
    power = 100,
    gravity = 260,
  ) {
    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor++ % this.pool.length];
      Object.assign(p, {
        active: true,
        x,
        y,
        vx: (Math.random() - 0.5) * power,
        vy: -Math.random() * power,
        life: 0.25 + Math.random() * 0.5,
        max: 0.8,
        color,
        size: 1 + Math.floor(Math.random() * 3),
        gravity,
      });
    }
  }
  update(dt: number) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }
  draw(c: CanvasRenderingContext2D, camera: number) {
    for (const p of this.pool) {
      if (!p.active) continue;
      c.globalAlpha = Math.min(1, p.life * 4);
      c.fillStyle = p.color;
      c.fillRect(Math.round(p.x - camera), Math.round(p.y), p.size, p.size);
    }
    c.globalAlpha = 1;
  }
}
