import Phaser from "phaser";
import { Survival } from "./game/scenes/Survival";
import "./style.css";
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#293c36",
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Survival],
  audio: { noAudio: true },
  banner: false,
});

// Development-only access for deterministic browser smoke tests.
if (import.meta.env.DEV)
  (window as Window & { __deadfall?: Phaser.Game }).__deadfall = game;
