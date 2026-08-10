import type { Engine } from "reze-engine"
import type { Solver } from "@/lib/solver"
import type { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import type { MikapoConfig, BoneFilterConfig, SceneConfig, SmoothingConfig, FaceConfig, MediaPipeConfig } from "./types"
import { enabledBoneNames } from "./bone-filter"
import { applySceneConfig } from "./scene"
import { applySmoothingConfig } from "./smoothing"
import { applyFaceConfig, isFaceEnabled } from "./face"
import { DEFAULT_CONFIG } from "@/configuration/default.config";

export type { MikapoConfig, BoneFilterConfig, SceneConfig, SmoothingConfig, FaceConfig, MediaPipeConfig }
export { isFaceEnabled, enabledBoneNames }

export class ConfigurationModule {
  private config: MikapoConfig

  constructor(config: Partial<MikapoConfig> = {}) {
    this.config = deepMerge(DEFAULT_CONFIG, config as any)
  }

  patch(patch: Partial<MikapoConfig>): void {
    this.config = deepMerge(this.config, patch as any)
  }

  applyToSolver(solver: Solver): void {
    applySmoothingConfig(solver, this.config.smoothing)
  }

  applyToScene(engine: Engine): void {
    applySceneConfig(engine, this.config.scene)
  }

  getMediaPipeConfig(): MediaPipeConfig {
    return this.config.mediapipe
  }

  get(): Readonly<MikapoConfig> {
    return this.config
  }

  toJSON(): string {
    return JSON.stringify(this.config, null, 2)
  }

  save(key = "mikapo-config"): void {
    try {
      localStorage.setItem(key, this.toJSON())
    } catch (e) {
      console.warn("Failed to save config:", e)
    }
  }

  static load(key = "mikapo-config"): ConfigurationModule {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        return new ConfigurationModule(parsed)
      }
    } catch (e) {
      console.warn("Failed to load config, using defaults:", e)
    }
    return new ConfigurationModule()
  }

  download(filename = "mikapo-config.json"): void {
    const blob = new Blob([this.toJSON()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  static async fromFile(file: File): Promise<ConfigurationModule> {
    const text = await file.text()
    const parsed = JSON.parse(text)
    return new ConfigurationModule(parsed)
  }

  reset(): void {
    this.config = deepMerge({}, DEFAULT_CONFIG)
  }
}

function deepMerge(base: any, override: any): any {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    const val = override[key]
    if (val !== undefined) {
      if (typeof val === "object" && !Array.isArray(val) && val !== null) {
        result[key] = deepMerge(base[key] ?? {}, val)
      } else {
        result[key] = val
      }
    }
  }
  return result
}