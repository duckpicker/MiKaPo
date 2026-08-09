/// <reference lib="webworker" />

import { FilesetResolver, HolisticLandmarker, type HolisticLandmarkerResult } from "@mediapipe/tasks-vision"
import type { PoseWorkerRequest, PoseWorkerResponse } from "@/types/pose-worker"
import { MEDIAPIPE_WASM_URL, HOLISTIC_CREATE_OPTIONS } from "@/constants/mediapipe"

let landmarker: HolisticLandmarker | null = null
let runningMode: "VIDEO" | "IMAGE" = "VIDEO"

const post = (msg: PoseWorkerResponse) => (self as unknown as Worker).postMessage(msg)

const emit = (result: HolisticLandmarkerResult, mediaTs: number) => {
  post({
    type: "result",
    mediaTs,
    result: {
      poseWorldLandmarks: result.poseWorldLandmarks,
      leftHandWorldLandmarks: result.leftHandWorldLandmarks,
      rightHandWorldLandmarks: result.rightHandWorldLandmarks,
      faceLandmarks: result.faceLandmarks,
      faceBlendshapes: result.faceBlendshapes,
    },
  })
}

async function init(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)

  try {
    landmarker = await HolisticLandmarker.createFromOptions(vision, { ...HOLISTIC_CREATE_OPTIONS })
  } catch (gpuError) {
    console.warn("GPU delegate failed in worker, falling back to CPU:", gpuError)
    landmarker = await HolisticLandmarker.createFromOptions(vision, {
      ...HOLISTIC_CREATE_OPTIONS,
      baseOptions: { ...HOLISTIC_CREATE_OPTIONS.baseOptions, delegate: "CPU" },
    })
  }

  // Warm up: force shader compilation / tensor allocation before the first real frame
  try {
    const canvas = new OffscreenCanvas(256, 256)
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#808080"
      ctx.fillRect(0, 0, 256, 256)
    }
    landmarker!.detectForVideo(canvas, performance.now())
  } catch (warmupError) {
    console.warn("MediaPipe warmup failed (non-fatal):", warmupError)
  }

  post({ type: "ready" })
}

self.onmessage = async (e: MessageEvent<PoseWorkerRequest>) => {
  const msg = e.data
  try {
    switch (msg.type) {
      case "init":
        await init()
        break
      case "mode":
        if (landmarker && msg.running !== runningMode) {
          await landmarker.setOptions({ runningMode: msg.running })
          runningMode = msg.running
        }
        break
      case "reset":
        if (landmarker) await landmarker.setOptions({ runningMode })
        break
      case "video":
        if (landmarker && runningMode === "VIDEO") {
          landmarker.detectForVideo(msg.bitmap, msg.ts, (result) => emit(result, msg.mediaTs))
        }
        msg.bitmap.close()
        break
      case "image":
        if (landmarker && runningMode === "IMAGE") {
          landmarker.detect(msg.bitmap, (result) => emit(result, msg.mediaTs))
        }
        msg.bitmap.close()
        break
    }
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) })
  }
}