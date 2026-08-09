import type { HolisticLandmarkerResult } from "@mediapipe/tasks-vision"

export type PoseWorkerRequest =
  | { type: "init" }
  | { type: "mode"; running: "VIDEO" | "IMAGE" }
  | { type: "video"; bitmap: ImageBitmap; ts: number; mediaTs: number }
  | { type: "image"; bitmap: ImageBitmap; mediaTs: number }
  | { type: "reset" }

export interface PoseWorkerResult {
  poseWorldLandmarks: HolisticLandmarkerResult["poseWorldLandmarks"]
  leftHandWorldLandmarks: HolisticLandmarkerResult["leftHandWorldLandmarks"]
  rightHandWorldLandmarks: HolisticLandmarkerResult["rightHandWorldLandmarks"]
  faceLandmarks: HolisticLandmarkerResult["faceLandmarks"]
  faceBlendshapes?: HolisticLandmarkerResult["faceBlendshapes"]
}

export type PoseWorkerResponse =
  | { type: "ready" }
  | { type: "result"; result: PoseWorkerResult; mediaTs: number }
  | { type: "error"; message: string }