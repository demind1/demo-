import { weaponThumbnail } from "../graphics/characters";
import type { Survival } from "../scenes/Survival";
import type { Phase } from "../entities/model";
import { WEAPONS } from "../combat/weapons";
import { REGIONS } from "../graphics/art";
const icon = '<span class="mark">╱╱</span>';
export class Interface {
  root = document.getElementById("interface")!;
  settingsBack: Phase = "menu";
  lastUpdate = 0;
  toastUntil = 0;
  constructor(public scene: Survival) {
    this.root.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "button[data-action]",
      );
      if (!button || button.disabled) return;
      this.scene.soundFX.unlock();
      this.scene.soundFX.play("ui");
      this.action(button.dataset.action!);
    });
  }
  action(action: string) {
    const s = this.scene,
      r = s.run;
    if (action === "start") s.start();
    if (action === "resume") s.resume();
    if (action === "menu") {
      r.phase = "menu";
      s.held = false;
      this.render();
    }
    if (action === "pause") s.pause();
    if (action === "settings") {
      this.settingsBack = r.phase;
      r.phase = "settings";
      this.render();
    }
    if (action === "back") {
      r.phase = this.settingsBack;
      this.render();
    }
    if (action === "wave") {
      r.startWave();
      s.soundFX.play("wave");
      this.render();
    }
    if (action.startsWith("buy:")) {
      const ok = r.purchase(action.slice(4));
      this.toast(
        ok ? "SUPPLIES SECURED" : "INSUFFICIENT FUNDS OR UPGRADE MAXED",
      );
      this.render();
    }
    if (action === "heal") s.heal();
  }
  toast(message: string) {
    let node = this.root.querySelector<HTMLElement>(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      this.root.append(node);
    }
    node.textContent = message;
    this.toastUntil = performance.now() + 2300;
  }
  button(label: string, action: string, cls = "", disabled = false) {
    return `<button class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
  }
  render() {
    const s = this.scene,
      r = s.run;
    this.root.className = r.phase;
    const header = `<header><a class="wordmark">${icon} DEADFALL<span>FIELD OPERATIONS / 01</span></a><span class="status"><i></i> OFFLINE SURVIVAL</span></header>`;
    if (r.phase === "menu") {
      this.root.innerHTML = `<div class="menu-shade"></div>${header}<section class="hero"><div class="eyebrow">38° 42′ N &nbsp; / &nbsp; ASHWOOD COUNTY</div><h1>DEAD<span>FALL</span><b>●</b></h1><p class="tagline">LAST LIGHT. LONG ROAD.</p><p class="intro">The highway is silent. The treeline isn’t.<br>Make your stand. See another dawn.</p><div class="menu-actions">${this.button("BEGIN SURVIVAL <span>↗</span>", "start", "primary")}${this.button("SETTINGS <span>⚙</span>", "settings", "secondary")}</div><div class="record">PERSONAL BEST <strong>${s.best.toLocaleString()}</strong> <span>PTS</span></div></section><aside class="dispatch"><div class="eyebrow">EMERGENCY BROADCAST</div><div class="signal">▂ ▄ ▆ █ <span>89.4 FM</span></div><h3>No rescue inbound.</h3><p>Conserve your ammunition.<br>Keep moving. Aim for the head.</p><div class="dispatch-bottom">TRANSMISSION 001 <span>● LIVE</span></div></aside><div class="location"><span>01 — THE LAST HIGHWAY</span><small>COUNTRYSIDE / DUSK</small></div><footer><span>AN ORIGINAL SURVIVAL EXPERIENCE</span><span><kbd>A</kbd><kbd>D</kbd> MOVE <b>·</b> MOUSE AIM <b>·</b> CLICK FIRE <b>·</b> <kbd>R</kbd> RELOAD</span><span>v2.1 / NO WAY BACK</span></footer>`;
    } else if (r.phase === "playing" || r.phase === "prep") {
      this.root.innerHTML = `<div class="hud-top"><div class="hud-brand">${icon} DEADFALL <span id="region"></span></div><div class="wave-label"><span id="wave"></span><small id="remaining"></small></div><div class="resources"><span id="cash"></span>${this.button("II", "pause", "pause-button")}</div></div><div class="wave-message" id="wave-message"></div><div class="hud-bottom"><div class="health-card"><div class="small-label">VITAL SIGNS <strong id="health-value"></strong></div><div class="health-track"><i id="health-bar"></i></div><div class="small-label"><span id="medkits"></span><span id="dodge"></span></div></div><div class="loadout"><div class="small-label" id="weapon-name"></div><strong id="ammo"></strong><span id="reserve"></span><div class="weapon-slots">${WEAPONS.map((w, i) => `<span id="slot-${i}" title="${w.name}">${i + 1}</span>`).join("")}</div></div><div class="run-stats"><strong id="kills"></strong><span>ELIMINATED</span><small id="clock"></small></div></div><div class="control-strip">A / D MOVE &nbsp; SHIFT SPRINT &nbsp; R RELOAD &nbsp; SPACE DODGE &nbsp; F MELEE &nbsp; E MEDKIT &nbsp; 1–3 WEAPON</div>`;
      if (r.phase === "prep") this.shop();
    } else if (r.phase === "paused") {
      this.root.innerHTML = `<div class="overlay"></div>${header}<section class="modal pause-modal"><div class="eyebrow">TAKE A BREATH</div><h2>HOLD THE LINE.</h2><p>The road can wait.</p>${this.button("RESUME SURVIVAL ↗", "resume", "primary")}${this.button("SETTINGS", "settings", "secondary")}${this.button("RETURN TO TITLE", "menu", "text-button")}</section>`;
    } else if (r.phase === "over") {
      this.root.innerHTML = `<div class="overlay death-overlay"></div>${header}<section class="modal death-modal"><div class="eyebrow">SIGNAL LOST / ASHWOOD COUNTY</div><h2>END OF<br>THE ROAD<span>.</span></h2><p>You held the line. Someone will remember.</p><div class="results"><div><strong>${r.wave}</strong><span>WAVE REACHED</span></div><div><strong>${r.kills}</strong><span>ELIMINATED</span></div><div><strong>${r.score}</strong><span>FINAL SCORE</span></div></div><div class="small-label">${r.headshots} HEADSHOTS &nbsp; / &nbsp; ${this.clock(r.elapsed)} SURVIVED</div>${this.button("MAKE ANOTHER STAND ↗", "start", "primary")}${this.button("RETURN TO TITLE", "menu", "text-button")}</section>`;
    } else if (r.phase === "settings") {
      this.root.innerHTML = `<div class="overlay"></div>${header}<section class="modal settings-modal"><div class="eyebrow">FIELD PREFERENCES</div><h2>SETTINGS</h2><label>MASTER VOLUME <input id="volume" type="range" min="0" max="1" step=".05" value="${s.soundFX.volume}"></label><label>BLOOD EFFECTS <select id="blood"><option value="0">Off</option><option value="0.4">Reduced</option><option value="1">Full</option></select></label><label>SCREEN SHAKE <select id="intensity"><option value="0">Off</option><option value="0.4">Reduced</option><option value="1">Full</option></select></label><label>NIGHT ATMOSPHERE <input id="night" type="checkbox" ${s.settings.night ? "checked" : ""}></label><p class="settings-note">Audio starts after your first interaction.<br>Settings are saved on this device.</p>${this.button("BACK ↗", "back", "primary")}</section>`;
      (this.root.querySelector("#blood") as HTMLSelectElement).value = String(
        s.settings.blood,
      );
      (this.root.querySelector("#intensity") as HTMLSelectElement).value =
        String(s.settings.intensity);
      this.root.querySelectorAll("input,select").forEach((input) =>
        input.addEventListener("input", () => {
          s.soundFX.volume = Number(
            (this.root.querySelector("#volume") as HTMLInputElement).value,
          );
          s.settings.blood = Number(
            (this.root.querySelector("#blood") as HTMLSelectElement).value,
          );
          s.settings.intensity = Number(
            (this.root.querySelector("#intensity") as HTMLSelectElement).value,
          );
          s.settings.night = (
            this.root.querySelector("#night") as HTMLInputElement
          ).checked;
          try {
            localStorage.setItem(
              "deadfall-settings",
              JSON.stringify({ visual: s.settings, volume: s.soundFX.volume }),
            );
          } catch {}
        }),
      );
    }
    this.lastUpdate = 0;
    this.update();
  }
  shop() {
    const r = this.scene.run;
    const offers = [
      ["ammo", "FIELD AMMUNITION", "Refill reserves for all weapons", 60],
      ["heal", "MEDICAL AID", "Restore all health", 65],
      ["medkit", "FIELD DRESSING", "Carry one extra healing item", 70],
      [
        "health",
        "REINFORCED VEST",
        `+25 maximum health · ${r.player.maxHp}/200`,
        150,
      ],
      ["damage", "GUNSMITH", `+20% damage · ${r.damageLevel}/5`, 180],
      ["reload", "QUICK HANDS", `15% faster reload · ${r.reloadLevel}/3`, 140],
      ["speed", "ROAD RUNNER", `+12% movement speed · ${r.speedLevel}/3`, 120],
    ];
    this.root.insertAdjacentHTML(
      "beforeend",
      `<div class="shop-shade"></div><section class="shop"><div class="shop-heading"><div><div class="eyebrow">WAVE ${r.wave} CLEARED / +$${70 + r.wave * 20} BONUS</div><h2>SUPPLY DROP<span>.</span></h2></div><div><span id="prep-clock"></span>${this.button("NEXT WAVE ↗", "wave", "primary")}</div></div><div class="shop-columns"><div><h4>ARMORY <span>01 / WEAPONS</span></h4><div class="weapon-grid">${WEAPONS.map((w, i) => `<article class="weapon-offer ${r.owned[i] ? "owned" : ""}"><div class="small-label">0${i + 1} / ${w.tag.toUpperCase()}</div><img class="weapon-preview" src="${weaponThumbnail(i)}" alt="${w.name}"><h3>${w.name}</h3><small>DMG ${w.damage}${w.pellets > 1 ? " × " + w.pellets : ""} &nbsp; MAG ${w.magazine}</small>${this.button(r.owned[i] ? "ISSUED ✓" : `ACQUIRE / $${w.price}`, `buy:${i}`, "buy", r.owned[i] || r.money < w.price)}</article>`).join("")}</div></div><div class="upgrades"><h4>FIELD UPGRADES <span>02 / SUPPLIES</span></h4>${offers
        .map(([id, name, desc, price]) => {
          const maxed =
            (id === "health" && r.player.maxHp >= 200) ||
            (id === "damage" && r.damageLevel >= 5) ||
            (id === "reload" && r.reloadLevel >= 3) ||
            (id === "speed" && r.speedLevel >= 3);
          return `<article><div><strong>${name}</strong><small>${desc}</small></div>${this.button(maxed ? "MAX" : `$${price}`, `buy:${id}`, "buy", maxed || r.money < Number(price) || (id === "heal" && r.player.hp === r.player.maxHp))}</article>`;
        })
        .join(
          "",
        )}</div></div><p class="small-label">SUPPLIES ARE LIMITED. SPEND WISELY. <span>PRESS E TO CONTINUE</span></p></section>`,
    );
  }
  clock(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }
  update() {
    const now = performance.now();
    if (now - this.lastUpdate < 90) return;
    this.lastUpdate = now;
    const r = this.scene.run;
    const set = (id: string, v: string) => {
      const n = this.root.querySelector("#" + id);
      if (n) n.textContent = v;
    };
    if (r.phase === "playing" || r.phase === "prep") {
      set("region", REGIONS[r.region]);
      set("wave", `WAVE ${String(r.wave).padStart(2, "0")}`);
      set(
        "remaining",
        r.phase === "prep"
          ? "SECTOR SECURED"
          : `${r.remaining + r.enemies.filter((e) => e.state !== "die").length} HOSTILES REMAIN`,
      );
      set("cash", `$ ${r.money.toLocaleString()}`);
      set("health-value", `${Math.ceil(r.player.hp)} / ${r.player.maxHp}`);
      const bar = this.root.querySelector<HTMLElement>("#health-bar");
      if (bar) bar.style.width = `${(r.player.hp / r.player.maxHp) * 100}%`;
      set("medkits", `[E] DRESSING ×${r.medkits}`);
      set(
        "dodge",
        r.player.dodgeCooldown > 0 ? "DODGE RECOVERING" : "DODGE READY",
      );
      set(
        "weapon-name",
        `${String(r.weapon + 1).padStart(2, "0")} / ${WEAPONS[r.weapon].name}`,
      );
      set(
        "ammo",
        r.player.reload > 0 ? "—" : String(r.ammo[r.weapon]).padStart(2, "0"),
      );
      set("reserve", ` / ${r.reserve[r.weapon]}`);
      set("kills", String(r.kills).padStart(3, "0"));
      set("clock", this.clock(r.elapsed));
      set("prep-clock", `INBOUND IN ${Math.ceil(r.prepTimer)}s`);
      set(
        "wave-message",
        r.elapsed < 4 ? "ASHWOOD COUNTY · HOLD YOUR GROUND" : "",
      );
      for (let i = 0; i < WEAPONS.length; i++) {
        const slot = this.root.querySelector("#slot-" + i);
        if (slot)
          slot.className = `${r.owned[i] ? "unlocked" : ""} ${r.weapon === i ? "selected" : ""}`;
      }
    }
    if (now > this.toastUntil) this.root.querySelector(".toast")?.remove();
  }
}
