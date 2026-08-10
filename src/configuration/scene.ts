import { Vec3 } from "reze-engine"
import type { Engine } from "reze-engine"
import type { SceneConfig } from "./types"

export function applySceneConfig(engine: Engine, config: SceneConfig): void {
  engine.setCameraDistance(config.camera.distance)
  engine.setCameraAlpha(config.camera.alpha)
  engine.setCameraBeta(config.camera.beta)

  const bg = config.background
  engine.setBackgroundColor(bg ? new Vec3(bg.r, bg.g, bg.b) : null)

  const l = config.lighting
  engine.setSun({
    direction: new Vec3(l.sunDirection.x, l.sunDirection.y, l.sunDirection.z),
    strength: l.sunStrength,
    color: new Vec3(l.sunColor.r, l.sunColor.g, l.sunColor.b),
  })
  engine.setWorld({
    color: new Vec3(l.worldColor.r, l.worldColor.g, l.worldColor.b),
    strength: l.worldStrength,
  })
}