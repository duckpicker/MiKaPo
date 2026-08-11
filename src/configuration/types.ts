import { FaceThresholds } from "@/types/face"
import { InputMode } from "@/hooks/useMediaPipe"

export type BoneGroup =
  "head" | "upperTorso" | "lowerTorso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg" | "fingers"

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
  smoothing: { eyes: number; mouth: number; smile: number }
  gaze: { enabled: boolean; strength: number }
  morphs: { blink: boolean; wink: boolean; mouth: boolean; smile: boolean }
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
  mediapipe: MediaPipeConfig
}

// ── Panels (переиспользуют существующие типы) ──

export interface PanelsState {
  inputMode: InputMode
  isStreamActive: boolean
  mediaPipeReady: boolean
  boneGroups: Set<BoneGroup>
  faceEnabled: boolean
  faceMorphs: FaceConfig["morphs"]
  faceThresholds: FaceConfig["thresholds"]
  faceSmoothing: FaceConfig["smoothing"]
  faceGaze: FaceConfig["gaze"]
  sceneCamera: { distance: number; followBone: string; followSmoothing: number; offsetY: number }
  sceneBackground: SceneConfig["background"]
  sceneSun: {
    direction: { x: number; y: number; z: number }
    strength: number
    color: { r: number; g: number; b: number }
  }
  sceneWorld: { strength: number; color: { r: number; g: number; b: number } }
  sceneSmoothing: SmoothingConfig
  mediaPipeConfig: MediaPipeConfig
}

export interface PanelsActions {
  onToggleCamera: () => void
  onPickImage: () => void
  onPickVideo: () => void
  onBoneChange: (groups: Set<BoneGroup>) => void
  onFaceEnabledChange: (on: boolean) => void
  onFaceMorphChange: (m: Partial<FaceConfig["morphs"]>) => void
  onFaceThresholdChange: (t: Partial<FaceConfig["thresholds"]>) => void
  onFaceSmoothingChange: (s: Partial<FaceConfig["smoothing"]>) => void
  onFaceGazeChange: (g: Partial<FaceConfig["gaze"]>) => void
  onSceneCameraChange: (c: Partial<PanelsState["sceneCamera"]>) => void
  onSceneBackgroundChange: (bg: PanelsState["sceneBackground"]) => void
  onSceneSunChange: (s: Partial<PanelsState["sceneSun"]>) => void
  onSceneWorldChange: (w: Partial<PanelsState["sceneWorld"]>) => void
  onSceneSmoothingChange: (s: Partial<SmoothingConfig>) => void
  onMediaPipeConfigChange: (c: Partial<MediaPipeConfig>) => void
  onReload: () => void
  onExport: () => void
}
