import type { MediaPipeConfig } from "./types"

export function applyMediaPipeConfig(config: MediaPipeConfig): {
  minPosePresenceConfidence: number
  minPoseDetectionConfidence: number
  minHandLandmarksConfidence: number
} {
  return {
    minPosePresenceConfidence: config.minPosePresenceConfidence,
    minPoseDetectionConfidence: config.minPoseDetectionConfidence,
    minHandLandmarksConfidence: config.minHandLandmarksConfidence,
  }
}
