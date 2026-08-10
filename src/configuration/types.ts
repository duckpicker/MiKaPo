import { FaceThresholds } from "@/types/face";

export type BoneGroup = "head" | "upperTorso" | "lowerTorso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg" | "fingers"

export interface BoneFilterConfig {
  groups: Record<BoneGroup, boolean>
}

export interface SceneConfig {
  camera: {
    distance: number
    alpha: number
    beta: number
    followBone: string
    followOffset: { x: number; y: number; z: number }
    followSmoothing: number
  }
  background: { r: number; g: number; b: number } | null
  lighting: {
    sunDirection: { x: number; y: number; z: number }
    sunStrength: number
    sunColor: { r: number; g: number; b: number }
    worldStrength: number
    worldColor: { r: number; g: number; b: number }
  }
}

export interface SmoothingConfig {
  minCutoff: number
  beta: number
  dCutoff: number
}

export interface FaceConfig {
  enabled: boolean
  thresholds: FaceThresholds
  smoothing: {
    eyes: number
    mouth: number
    smile: number
  }
  gaze: {
    enabled: boolean
    strength: number
  }
  morphs: {
    blink: boolean
    wink: boolean
    mouth: boolean
    smile: boolean
  }
}

export interface MediaPipeConfig {
  minPosePresenceConfidence: number
  minPoseDetectionConfidence: number
  minHandLandmarksConfidence: number
}

export interface MikapoConfig {
  bones: BoneFilterConfig
  scene: SceneConfig
  smoothing: SmoothingConfig
  face: FaceConfig
  mediapipe: MediaPipeConfig
}