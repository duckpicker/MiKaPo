import type { FaceThresholds } from "../types/face"

/** Face landmark indices from MediaPipe 478-point face mesh */
export const FACE_INDEX = {
  LeftEyeUpper: 159,
  LeftEyeLower: 145,
  LeftEyeLeft: 33,
  LeftEyeRight: 133,
  LeftEyeIris: 468,
  RightEyeUpper: 386,
  RightEyeLower: 374,
  RightEyeLeft: 362,
  RightEyeRight: 263,
  RightEyeIris: 473,
  UpperLipTop: 13,
  LowerLipBottom: 14,
  MouthLeft: 61,
  MouthRight: 291,
} as const

/** Canonical MMD morph names with per-model aliases */
export const MORPH_ALIASES: Record<string, string[]> = {
  まばたき: ["瞬き"],
  ウィンク: ["ウィンク２"],
  ウィンク右: ["ウィンク右２", "ウインク右"],
  あ: ["あ２"],
  ワ: ["にっこり", "にやり"],
}

export const DEFAULT_FACE_THRESHOLDS: FaceThresholds = {
  eyeOpen: 0.3,
  eyeClosed: 0.1,
  mouthOpen: 0.18,
  smile: 0.008,
}

/** One-Euro filter settings for face channels.
 *  Higher beta (15) than body — blinks are faster than limb movements. */
export const FACE_FILTER_FAST = { minCutoff: 2.0, beta: 15, dCutoff: 1.0 }
export const FACE_FILTER_GAZE = { minCutoff: 2.0, beta: 10, dCutoff: 1.0 }