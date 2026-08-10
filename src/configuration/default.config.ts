import { MikapoConfig } from "@/configuration/types";

export const DEFAULT_CONFIG: MikapoConfig = {
  bones: {
    groups: {
      head: true,
      upperTorso: true,
      lowerTorso: true,
      leftArm: true,
      rightArm: true,
      leftLeg: true,
      rightLeg: true,
      fingers: true,
    },
  },
  scene: {
    camera: {
      distance: 12,
      alpha: 0,
      beta: 0,
      followBone: "センター",
      followOffset: { x: 0, y: 3, z: 0 },
      followSmoothing: 0.15,
    },
    background: { r: 0, g: 0.69, b: 0.14 },
    lighting: {
      sunDirection: { x: 0.5, y: -0.85, z: 0.15 },
      sunStrength: 2.5,
      sunColor: { r: 1.0, g: 0.95, b: 0.9 },
      worldStrength: 0.5,
      worldColor: { r: 0.6, g: 0.7, b: 1.0 },
    },
  },
  smoothing: {
    minCutoff: 1.5,
    beta: 1.5,
    dCutoff: 4.0,
  },
  mediapipe: {
    minPosePresenceConfidence: 0.5,
    minPoseDetectionConfidence: 0.5,
    minHandLandmarksConfidence: 0.7,
  },
}