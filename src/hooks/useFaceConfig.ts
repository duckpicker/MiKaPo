"use client"

import { useState, useEffect, useRef } from "react"
import { useLocalStorage } from "./useLocalStorage"
import type { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"

interface FaceState {
  enabled: boolean
  morphs: { blink: boolean; wink: boolean; mouth: boolean; smile: boolean }
  thresholds: { eyeOpen: number; eyeClosed: number; mouthOpen: number; smile: number }
  smoothing: { eyes: number; mouth: number; smile: number }
  gaze: { enabled: boolean; strength: number }
}

const DEFAULT_FACE: FaceState = {
  enabled: true,
  morphs: { blink: true, wink: true, mouth: true, smile: true },
  thresholds: { eyeOpen: 0.3, eyeClosed: 0.1, mouthOpen: 0.18, smile: 0.008 },
  smoothing: { eyes: 0.5, mouth: 0.5, smile: 0.5 },
  gaze: { enabled: true, strength: 1.0 },
}

export function useFaceConfig(faceSolverRef: React.RefObject<FaceBlendshapeSolver | null>) {
  const [face, setFace] = useLocalStorage<FaceState>("mikapo-face-config", DEFAULT_FACE)

  useEffect(() => {
    const f = faceSolverRef.current
    if (!f) return
    f.setEnabled(face.enabled)
    f.setMorphEnabled("blink", face.morphs.blink)
    f.setMorphEnabled("wink", face.morphs.wink)
    f.setMorphEnabled("mouth", face.morphs.mouth)
    f.setMorphEnabled("smile", face.morphs.smile)
    f.setThresholds(face.thresholds)
    f.setSmoothing(face.smoothing)
    f.setGazeEnabled(face.gaze.enabled)
    f.setGazeStrength(face.gaze.strength)
  }, [face, faceSolverRef])

  const update = (patch: Partial<FaceState>) => setFace((prev) => ({ ...prev, ...patch }))

  return {
    faceEnabled: face.enabled,
    setFaceEnabled: (v: boolean) => update({ enabled: v }),
    faceMorphs: face.morphs,
    setFaceMorphs: (m: Partial<FaceState["morphs"]>) => update({ morphs: { ...face.morphs, ...m } }),
    faceThresholds: face.thresholds,
    setFaceThresholds: (t: Partial<FaceState["thresholds"]>) => update({ thresholds: { ...face.thresholds, ...t } }),
    faceSmoothing: face.smoothing,
    setFaceSmoothing: (s: Partial<FaceState["smoothing"]>) => update({ smoothing: { ...face.smoothing, ...s } }),
    faceGaze: face.gaze,
    setFaceGaze: (g: Partial<FaceState["gaze"]>) => update({ gaze: { ...face.gaze, ...g } }),
  }
}
