import type { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import type { FaceConfig } from "./types"

export function applyFaceConfig(face: FaceBlendshapeSolver, config: FaceConfig): void {
  if (config.enabled !== undefined) face.setEnabled(config.enabled)
  if (config.thresholds) face.setThresholds(config.thresholds)
  if (config.smoothing) face.setSmoothing(config.smoothing)
  if (config.gaze) {
    if (config.gaze.enabled !== undefined) face.setGazeEnabled(config.gaze.enabled)
    if (config.gaze.strength !== undefined) face.setGazeStrength(config.gaze.strength)
  }
  if (config.morphs) {
    for (const [key, val] of Object.entries(config.morphs)) {
      face.setMorphEnabled(key as any, val)
    }
  }
}

export function isFaceEnabled(config: FaceConfig): boolean {
  return config.enabled
}
