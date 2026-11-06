# DEADFALL

**Last light. Long road.** An original, playable desktop zombie survival shooter built with TypeScript, Phaser 3, Vite and a procedurally drawn pixel-art world. No external assets, paid services or API keys.

## Easiest way: one file, no installation

The standalone edition is `DEADFALL.html`. Download it and open it directly in a desktop browser (Chrome or Edge recommended). No Node.js, server or Internet connection is required. Click **BEGIN SURVIVAL** to start.

Developers can generate this file with `npm run build:standalone`; the result is written to `release/DEADFALL.html` with all JavaScript and CSS embedded.

## Run on Windows, macOS or Linux

Install Node.js 20.19+ (Node 22.12+ or 24 LTS recommended), then open a terminal in this repository:

```sh
npm install
npm run dev
```

Open the address Vite prints. Click **BEGIN SURVIVAL**. The first interaction enables Web Audio. A keyboard and mouse are required; touch controls are not implemented. The game scales to the window, with a 960×540 pixel canvas for sharp 1920×1080 presentation.

For reproducible installs use `npm ci`. For a production build run `npm run build`; serve `dist/` with any static web server. No backend is needed. Vite binds to all interfaces for cloud development; use `npm run dev -- --host 127.0.0.1` to restrict local access.

## Controls

| Input              | Action                                                     |
| ------------------ | ---------------------------------------------------------- |
| A / D              | Move                                                       |
| Shift              | Sprint                                                     |
| Mouse / left click | Aim / fire (hold for rifle and SMG)                        |
| R                  | Reload from finite reserves                                |
| Space              | Dodge, with a 2-second cooldown and brief invulnerability  |
| F                  | Melee, with a cooldown                                     |
| E                  | Use a field dressing (+55 HP); start next wave in the shop |
| 1–6                | Switch to an owned weapon                                  |
| Escape             | Pause / resume; back from settings                         |

## Survive the road

Enemies approach from beyond the right edge of the screen. Shoot heads for 2.4× damage. The pistol starts with 15 loaded rounds and 90 in reserve. Each weapon has its own magazine and reserve. Reload proactively; melee and dodge are useful when enemies close in. Every kill earns cash. Clearing a wave awards a bonus and opens a **25-second supply window**. Buy weapons, ammunition, medical aid, field dressings, armor, damage, reload speed or movement upgrades. Click **NEXT WAVE** or press E when ready; Escape pauses the supply countdown too.

Five enemy types have different health, speed, rewards, proportions and behaviors: Walker, Runner, Heavy, Crawler and burst-moving Berserker. Early waves introduce the roster gradually. Enemy counts and health increase each wave. Every three waves the background changes: countryside, city skyline, industrial zone, forest road and checkpoint. Later waves cycle into night. These are procedural variations of the same road arena, not five separately authored levels.

Settings control sound volume, blood, shake and night lighting. Settings and best score persist locally; an active run does not. Storage failures do not block play.

## Implemented

- Complete title → combat → wave-clear shop → next wave → game-over → restart loop.
- Articulated pixel characters with procedural walk, sprint, aim, recoil, reload, melee, dodge, hit and collapse poses. Enemy spawn, approach, attack, stagger, recover and death states.
- Six distinct weapons: pistol, revolver, shotgun, assault rifle, SMG and sniper. Per-weapon damage, cadence, spread, reload, magazine, recoil, sound and range; shotgun multi-pellet shots.
- Ray/circle hit detection, headshots, hit marker, tracers, muzzle flash, ejected casings, directional knockback, blood and persistent capped corpses.
- Health, healing, finite ammunition, dodge invulnerability, wave scaling, money, purchases and capped upgrades.
- Layered cached landscapes, smooth horizontal camera follow, parallax, weather motes, dusk/night color treatment, restrained lighting and configurable shake.
- Original synthesized gunfire, reload, empty click, footsteps, impacts, attacks, deaths, melee, UI and wave cues.
- Styled responsive title, HUD, shop, pause, settings and death screens. Particle objects are pooled; corpses and stains are capped.

## Scope and limitations

This is a playable first release, with the Stage A foundation and substantial B–D systems. It is **not a claim that all commercial-quality targets in the brief are finished**:

- Deaths use procedural pivot collapse with directional momentum, not joint-constrained physics ragdolls. Limbs are procedurally articulated, without a full IK solver.
- Regional identity is background art and palette variation. There are no collidable barricades, destructible scenery, obstacle-navigation AI, building interiors, bosses or campaign.
- Art and sound are original procedural work; they have not received a dedicated artist/audio production pass. Weapon shop thumbnails are simplified silhouettes.
- No run saves, remappable controls, gamepad/mobile support or localization yet.
- A browser smoke test verifies functionality, not 60 FPS across hardware or long-run balance. Windows instructions are cross-platform commands; actual validation was in Linux Chromium. Audio was executed in the browser but not audited by listening.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

The eight unit tests cover ray intersections, headshot scaling, weapon configuration, enemy state transitions and roster gating, waves, purchases, supplies and upgrade caps.

Browser smoke test (with the dev server already running in another terminal):

```sh
npx playwright install chromium
npm run test:browser
```

To use an existing Chromium executable, set `CHROMIUM_PATH`. On Linux, for example:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

The smoke test uses the real browser and keyboard/pointer input. A development-only scene hook supplies deterministic enemy fixtures and cash; production builds do not expose it. It checks menus, settings, movement, dodge, headshots, reload, pause timing, shop and upgrades, wave transitions, weapon switching, automatic fire, enemy damage, healing, melee, all six weapons, regional rendering, death and restart. Screenshots go to the system temporary directory under `deadfall-smoke` (override with `ARTIFACT_DIR`). `GAME_URL` overrides the default dev-server URL.

## Source map

- `src/game/scenes/Survival.ts` — Phaser lifecycle, input and combat orchestration.
- `src/game/entities/model.ts` — run state, economy, enemy definitions and state transitions.
- `src/game/combat/weapons.ts` — weapon balance and collision math.
- `src/game/graphics/art.ts` — original articulated characters and cached landscapes.
- `src/game/systems/particles.ts` — pooled combat effects.
- `src/game/audio/sound.ts` — Web Audio synthesis.
- `src/game/ui/interface.ts`, `src/style.css` — menus, shop, HUD and settings.
- `tests/game.test.ts`, `scripts/smoke.mjs` — logic and browser checks.

Visual inspiration: the side-view road-defense genre and the supplied screenshot of _They Are Coming_. No artwork, audio, source code or branding from that game is included.
