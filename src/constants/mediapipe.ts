export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"

export const HOLISTIC_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task"

export const HOLISTIC_CREATE_OPTIONS = {
  baseOptions: {
    modelAssetPath: HOLISTIC_MODEL_URL,
    delegate: "GPU" as const,
  },
  numFaces: 1,
  numHands: 2,
  minPosePresenceConfidence: 0.5,
  minPoseDetectionConfidence: 0.5,
  minFaceDetectionConfidence: 0.5,
  minHandLandmarksConfidence: 0.95,
  runningMode: "VIDEO" as const,
  enableFaceGeometry: true,
} as const
