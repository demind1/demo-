export class Sound {
  context: AudioContext | null = null;
  volume = 0.35;
  enabled = true;
  unlock() {
    this.context ??= new AudioContext();
    void this.context.resume();
  }
  play(type: string, weapon = 0) {
    if (!this.context || !this.enabled) return;
    const c = this.context,
      t = c.currentTime;
    const gun = type === "shot",
      duration = gun ? 0.12 + weapon * 0.012 : type === "wave" ? 0.6 : 0.12;
    const gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(this.volume * (gun ? 0.35 : 0.12), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    if (
      gun ||
      type === "hit" ||
      type === "step" ||
      type === "death" ||
      type === "melee"
    ) {
      const b = c.createBuffer(
          1,
          Math.ceil(c.sampleRate * duration),
          c.sampleRate,
        ),
        data = b.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const n = c.createBufferSource();
      n.buffer = b;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = gun
        ? [2200, 1400, 900, 2700, 3400, 1100][weapon]
        : type === "step"
          ? 180
          : 650;
      n.connect(f);
      f.connect(gain);
      n.start();
    }
    const o = c.createOscillator();
    o.type = gun ? "triangle" : "sine";
    o.frequency.setValueAtTime(
      gun
        ? 120
        : ({
            wave: 520,
            reload: 700,
            empty: 160,
            hit: 95,
            death: 65,
            melee: 180,
            step: 75,
            ui: 460,
            attack: 80,
          }[type] ?? 300),
      t,
    );
    o.frequency.exponentialRampToValueAtTime(
      type === "wave" ? 900 : 40,
      t + duration,
    );
    o.connect(gain);
    o.start();
    o.stop(t + duration);
  }
}
