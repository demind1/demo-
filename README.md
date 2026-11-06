# DEADFALL

**Last light. Long road.** An original, playable desktop zombie survival shooter built with TypeScript, Phaser 3, Vite and a procedurally drawn pixel-art world. No external assets, paid services or API keys.

## Скачать и играть / Download and play

**[Скачать готовую игру DEADFALL 2.0.zip](https://github.com/demind1/demo-/raw/refs/heads/main/downloads/DEADFALL-2.0.zip)**

Распакуйте ZIP, откройте **DEADFALL.html** в Chrome или Edge и нажмите **BEGIN SURVIVAL**. Установка программ и интернет не нужны.

## 2.0 — Character animation update

This update focuses on the player and zombies. The economy, weapon statistics, levels and controls are unchanged.

- Two-bone IK for knees and elbows, with world-space foot planting and distance-driven walk/run cycles. Feet retain their stance when stopping; the pelvis adjusts to keep planted legs within reach.
- Frame-rate-independent damped recoil, torso inertia, breathing, head counter-motion and backpack/shirt follow-through.
- Both hands follow weapon grips. Reloading has staged magazine removal, belt reach, insertion and receiver manipulation; dodge compresses the whole skeleton, and melee has wind-up and follow-through. Firing interrupts the visual melee recovery without adding an input delay.
- Individual Walker limp, Runner arm drive, Heavy weight shifts, low Crawler hand-drag and Berserker forward hunch/burst posture. Enemies face the player and blend into attacks, stagger and recovery.
- Articulated knee collapse, directional fall, headshot reaction, ground contact and a stable corpse pose. Crawlers have a separate horizontal collapse. These remain authored procedural deaths, not a physical ragdoll simulation.
- Animated head/body positions supply hit regions. The established chamber ray preserves shot accuracy while muzzle flash/tracers follow the visible barrel. Pausing freezes the skeleton.

For a visual contact-sheet review, run `npm run review:animation` with Vite and a Playwright browser available (set `CHROMIUM_PATH` to use system Chromium). It writes player and enemy PNG sequences under the temporary directory `deadfall-animation`. Run `npm run test:standalone` to execute the packaged production HTML in an offline browser context. This cloud browser's managed policy blocks direct `file://` navigation, so that test embeds the exact HTML content instead; it is not a claim that the local-file launch was executed in this environment.

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

- Deaths use articulated procedural collapse with directional momentum and ground contact, not joint-constrained physics ragdolls. Arms and legs now use two-bone IK; this is not a full-body physics simulation.
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

The unit tests cover ray intersections, headshot scaling, weapon configuration, enemy state transitions, roster gating, waves, economy and upgrade caps, plus IK bone lengths, frame-rate consistency, planted feet, stopping, reload hand paths, aiming, per-type poses, head hit regions and settled deaths.

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
- `src/game/animation/` — IK, springs, locomotion and action poses.
- `src/game/graphics/characters.ts` — articulated pixel characters and weapon attachments.
- `src/game/graphics/art.ts` — cached landscapes.
- `src/game/systems/particles.ts` — pooled combat effects.
- `src/game/audio/sound.ts` — Web Audio synthesis.
- `src/game/ui/interface.ts`, `src/style.css` — menus, shop, HUD and settings.
- `tests/game.test.ts`, `scripts/smoke.mjs` — logic and browser checks.

Visual inspiration: the side-view road-defense genre and the supplied screenshot of _They Are Coming_. No artwork, audio, source code or branding from that game is included.
