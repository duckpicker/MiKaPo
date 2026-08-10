"use client"

import { useRef, useCallback, useState } from "react"
import { buildClip, clipSummary, type RecordedFrame } from "@/lib/vmd"
import { smoothTakeZeroPhase } from "@/lib/filters"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import type { BoneState } from "@/types/solver"
import type { FaceMorphWeights } from "@/types/face"
import type { PoseWorkerResult } from "@/types/pose-worker"

export function useVmdExport(
  solverRef: React.RefObject<Solver | null>,
  faceSolverRef: React.RefObject<FaceBlendshapeSolver | null>,
  currentBoneStatesRef: React.RefObject<BoneState[]>,
  currentMorphWeightsRef: React.RefObject<FaceMorphWeights | null>,
  faceEnabledRef: React.RefObject<boolean>,
  exportVmd?: (clip: ReturnType<typeof buildClip>) => void,
) {
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exported, setExported] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const exportPoseVmd = useCallback(() => {
    const pose = currentBoneStatesRef.current
    if (pose.length === 0) return
    const clip = buildClip([{
      time: 0,
      boneStates: pose.map((bs) => ({ name: bs.name, rotation: bs.rotation.clone() })),
      morphWeights: faceEnabledRef.current ? currentMorphWeightsRef.current : null,
    }])
    exportVmd?.(clip)
    setExported("pose saved")
  }, [currentBoneStatesRef, currentMorphWeightsRef, faceEnabledRef, exportVmd])

  const convertVideoToVmd = useCallback(async (
    video: HTMLVideoElement,
    awaitFrame: (bitmap: ImageBitmap, mediaTs: number, tick: number) => Promise<PoseWorkerResult | null>,
  ) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return
    video.pause()
    cancelRef.current = false
    setConverting(true)
    setProgress(0)
    setExported(null)

    const step = 1 / 30
    const frames: RecordedFrame[] = []
    let tick = performance.now()

    const seek = (t: number) => new Promise<void>((resolve) => {
      const done = () => { video.removeEventListener("seeked", done); resolve() }
      video.addEventListener("seeked", done)
      video.currentTime = t
    })

    const grab = async (t: number): Promise<ImageBitmap | null> => {
      if (t >= video.duration) return null
      await seek(t)
      return createImageBitmap(video)
    }

    let lastPaint = 0
    try {
      let bitmap = await grab(0)
      for (let t = 0; t < video.duration && !cancelRef.current; t += step) {
        if (!bitmap) break
        const ahead = grab(t + step)
        const result = await awaitFrame(bitmap, t * 1000, tick)
        tick += 33
        bitmap = await ahead
        if (cancelRef.current || !result?.poseWorldLandmarks[0]) continue

        const pose = solverRef.current!.solve(result, t * 1000)
        currentBoneStatesRef.current = pose
        let morphWeights: FaceMorphWeights | null = null
        if (faceEnabledRef.current && result.faceLandmarks?.[0]) {
          const face = faceSolverRef.current!.solve(result.faceLandmarks[0], t * 1000)
          morphWeights = face.morphWeights
          currentMorphWeightsRef.current = morphWeights
        }

        frames.push({
          time: t,
          boneStates: pose.map((bs) => ({ name: bs.name, rotation: bs.rotation.clone() })),
          morphWeights,
        })

        const now = performance.now()
        if (now - lastPaint > 100) { lastPaint = now; setProgress(t / video.duration) }
      }
    } finally {
      setConverting(false)
      setProgress(0)
    }

    if (frames.length === 0) return
    smoothTakeZeroPhase(frames)
    const clip = buildClip(frames)
    exportVmd?.(clip)
    const { frames: n, seconds } = clipSummary(clip)
    setExported(`${n}f · ${seconds.toFixed(1)}s`)
  }, [solverRef, faceSolverRef, currentBoneStatesRef, currentMorphWeightsRef, faceEnabledRef, exportVmd])

  return { converting, progress, exported, setExported, cancelRef, exportPoseVmd, convertVideoToVmd }
}