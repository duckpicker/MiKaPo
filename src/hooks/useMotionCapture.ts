// hooks/useMotionCapture.ts
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import { useMediaPipe } from "./useMediaPipe"
import { useVideoControls } from "./useVideoControls"
import { useVmdExport } from "./useVmdExport"
import { DEFAULT_BONE_GROUPS, useBoneFilter } from "./useBoneFilter"
import { useFaceConfig } from "./useFaceConfig"
import { useSceneConfig } from "./useSceneConfig"
import { useInputMode } from "./useInputMode"
import { useLocalStorage } from "./useLocalStorage"
import type { PanelsState, PanelsActions, MediaPipeConfig } from "@/configuration/types"
import type { BoneState, BodyCollider } from "@/types/solver"
import type { FaceSolverResult } from "@/types/face"
import type { PoseWorkerResult } from "@/types/pose-worker"
import { buildClip } from "@/lib/vmd"
import { Engine, Model } from "reze-engine"
import { DEFAULT_MEDIAPIPE_CONFIG } from "@/configuration/constants/mediapipe"
import { DEBUG_PREVIEW_INTERVAL_MS } from "@/configuration/constants/capture"
import { ConfigurationModule } from "@/configuration"

export function useMotionCapture({
  applyPose,
  applyFace,
  modelLoaded,
  onMediaPipeReadyChange,
  resetModel,
  restPose,
  colliders,
  modelMorphs,
  exportVmd,
  onSolverReady,
  onFaceSolverReady,
  engineRef,
  modelRef,
  configModule,
}: {
  applyPose: (boneStates: BoneState[], tweenMs: number) => void
  applyFace: (faceResult: FaceSolverResult, tweenMs: number) => void
  modelLoaded: boolean
  onMediaPipeReadyChange?: (ready: boolean) => void
  resetModel?: () => void
  exportVmd?: (clip: ReturnType<typeof buildClip>) => void
  restPose?: Record<string, { x: number; y: number; z: number }> | null
  colliders?: BodyCollider[] | null
  modelMorphs?: string[] | null
  onSolverReady?: (solver: Solver) => void
  onFaceSolverReady?: (face: FaceBlendshapeSolver) => void
  engineRef: React.RefObject<Engine | null>
  modelRef: React.RefObject<Model | null>
  configModule?: ConfigurationModule
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const solverRef = useRef<Solver>(new Solver())
  const faceSolverRef = useRef<FaceBlendshapeSolver>(new FaceBlendshapeSolver())
  const [landmarks, setLandmarks] = useState<PoseWorkerResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { boneGroupsSet, handleBoneChange, filterPose } = useBoneFilter()
  const faceCfg = useFaceConfig(faceSolverRef)
  const sceneCfg = useSceneConfig(engineRef, solverRef, modelRef, modelLoaded)
  const [mediaPipeConfig, setMediaPipeConfig] = useLocalStorage<MediaPipeConfig>(
    "mikapo-mediapipe-config",
    DEFAULT_MEDIAPIPE_CONFIG,
  )
  const resetAll = useCallback(() => {
    resetModel?.()
    solverRef.current.reset()
    faceSolverRef.current.reset()
  }, [resetModel])

  const modelLoadedRef = useRef(modelLoaded)
  useEffect(() => {
    modelLoadedRef.current = modelLoaded
  }, [modelLoaded])
  const applyPoseRef = useRef(applyPose)
  useEffect(() => {
    applyPoseRef.current = applyPose
  }, [applyPose])
  const applyFaceRef = useRef(applyFace)
  useEffect(() => {
    applyFaceRef.current = applyFace
  }, [applyFace])
  const faceEnabledRef = useRef(faceCfg.faceEnabled)
  useEffect(() => {
    faceEnabledRef.current = faceCfg.faceEnabled
  }, [faceCfg.faceEnabled])

  const lastDebugUpdateRef = useRef(0)
  const lastResultAtRef = useRef(0)
  const resultIntervalEmaRef = useRef(33)

  const handleResult = useCallback(
    (result: PoseWorkerResult, timestampMs: number) => {
      const now = performance.now()
      if (now - lastDebugUpdateRef.current >= DEBUG_PREVIEW_INTERVAL_MS) {
        lastDebugUpdateRef.current = now
        setLandmarks(result)
      }
      if (lastResultAtRef.current > 0) {
        const dt = now - lastResultAtRef.current
        if (dt < 500) resultIntervalEmaRef.current = resultIntervalEmaRef.current * 0.8 + dt * 0.2
      }
      lastResultAtRef.current = now
      const tweenMs = Math.max(40, resultIntervalEmaRef.current * 2)
      if (!modelLoadedRef.current) return
      const pose = solverRef.current.solve(result, timestampMs)
      const filtered = filterPose(pose)
      applyPoseRef.current(filtered, tweenMs)
      if (faceEnabledRef.current && result.faceLandmarks?.[0]) {
        applyFaceRef.current(faceSolverRef.current.solve(result.faceLandmarks[0], timestampMs), tweenMs)
      }
    },
    [filterPose],
  )

  const { mediaPipeReady, awaitFrame, setConverting, postMode, postReset } = useMediaPipe(
    videoRef,
    imageRef,
    handleResult,
    mediaPipeConfig,
  )
  const videoControls = useVideoControls()
  const { converting, progress, exported, cancelRef, exportPoseVmd, convertVideoToVmd } = useVmdExport(
    solverRef,
    faceSolverRef,
    exportVmd,
    faceEnabledRef,
  )
  const { inputMode, isStreamActive, currentImage, videoSrc, toggleCamera, handleImageUpload, handleVideoUpload } =
    useInputMode(videoRef, resetAll, postMode, postReset)

  const handleExport = useCallback(() => {
    inputMode === "image" ? exportPoseVmd() : videoRef.current && convertVideoToVmd(videoRef.current, awaitFrame)
  }, [inputMode, exportPoseVmd, convertVideoToVmd, awaitFrame])
  const handleReload = useCallback(() => window.location.reload(), [])

  useEffect(() => {
    if (restPose) solverRef.current.calibrate(restPose)
  }, [restPose])
  useEffect(() => {
    if (restPose && colliders) solverRef.current.calibrateColliders(colliders, restPose)
  }, [restPose, colliders])
  useEffect(() => {
    if (modelMorphs?.length) faceSolverRef.current.configure(modelMorphs)
  }, [modelMorphs])
  useEffect(() => {
    onMediaPipeReadyChange?.(mediaPipeReady)
  }, [mediaPipeReady, onMediaPipeReadyChange])
  useEffect(() => {
    onSolverReady?.(solverRef.current)
    onFaceSolverReady?.(faceSolverRef.current)
  }, [onSolverReady, onFaceSolverReady])

  const handleLoadConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const json = JSON.parse(await file.text())

      if (json.scene) {
        const sceneState = {
          camera: {
            distance: json.scene.camera?.distance ?? 12,
            followBone: json.scene.camera?.followBone ?? "センター",
            followSmoothing: json.scene.camera?.followSmoothing ?? 0.15,
            offsetY: json.scene.camera?.offsetY ?? 0,
            alpha: json.scene.camera?.alpha ?? 0,
            beta: json.scene.camera?.beta ?? 0,
          },
          background: json.scene.background ?? { r: 0, g: 0.69, b: 0.14 },
          sun: json.scene.sun ?? {
            direction: { x: 0.5, y: -0.85, z: 0.15 },
            strength: 2.5,
            color: { r: 1, g: 0.95, b: 0.9 },
          },
          world: json.scene.world ?? { strength: 0.5, color: { r: 0.6, g: 0.7, b: 1 } },
          smoothing: json.scene.smoothing ?? { minCutoff: 1.5, beta: 1.5, dCutoff: 4 },
          groundEnabled: json.scene.groundEnabled ?? false,
        }
        localStorage.setItem("mikapo-scene-config", JSON.stringify(sceneState))
      }

      if (json.face) {
        localStorage.setItem("mikapo-face-config", JSON.stringify(json.face))
      }

      if (json.bones?.groups) {
        const enabled = Object.entries(json.bones.groups)
          .filter(([k, v]) => v && DEFAULT_BONE_GROUPS.includes(k as any))
          .map(([k]) => k)
        localStorage.setItem("mikapo-bone-groups", JSON.stringify(enabled))
      }

      if (json.mediapipe) {
        localStorage.setItem("mikapo-mediapipe-config", JSON.stringify(json.mediapipe))
      }

      window.location.reload()
    } catch (err) {
      console.error("Failed to load config:", err)
    }
  }

  const panels: PanelsState = {
    inputMode,
    isStreamActive,
    mediaPipeReady,
    boneGroups: boneGroupsSet,
    faceEnabled: faceCfg.faceEnabled,
    faceMorphs: faceCfg.faceMorphs,
    faceThresholds: faceCfg.faceThresholds,
    faceSmoothing: faceCfg.faceSmoothing,
    faceGaze: faceCfg.faceGaze,
    sceneCamera: sceneCfg.sceneCamera,
    sceneBackground: sceneCfg.sceneBackground,
    sceneSun: sceneCfg.sceneSun,
    sceneWorld: sceneCfg.sceneWorld,
    sceneSmoothing: sceneCfg.sceneSmoothing,
    mediaPipeConfig,
  }

  const actions: PanelsActions = {
    onToggleCamera: toggleCamera,
    onPickImage: () => imageInputRef.current?.click(),
    onPickVideo: () => videoInputRef.current?.click(),
    onBoneChange: handleBoneChange,
    onFaceEnabledChange: faceCfg.setFaceEnabled,
    onFaceMorphChange: faceCfg.setFaceMorphs,
    onFaceThresholdChange: faceCfg.setFaceThresholds,
    onFaceSmoothingChange: faceCfg.setFaceSmoothing,
    onFaceGazeChange: faceCfg.setFaceGaze,
    onSceneCameraChange: sceneCfg.onSceneCameraChange,
    onSceneBackgroundChange: sceneCfg.onSceneBackgroundChange,
    onSceneSunChange: sceneCfg.onSceneSunChange,
    onSceneWorldChange: sceneCfg.onSceneWorldChange,
    onSceneSmoothingChange: sceneCfg.onSceneSmoothingChange,
    onMediaPipeConfigChange: (c) => setMediaPipeConfig((prev) => ({ ...prev, ...c })),
    onReload: handleReload,
    onSaveConfig: () => configModule?.download(),
    onLoadConfig: () => fileInputRef.current?.click(),
  }

  return {
    videoRef,
    imageRef,
    imageInputRef,
    videoInputRef,
    videoControls,
    inputMode,
    isStreamActive,
    currentImage,
    videoSrc,
    landmarks,
    panels,
    actions,
    converting,
    progress,
    exported,
    cancelRef,
    handleImageUpload,
    handleVideoUpload,
    fileInputRef,
    handleLoadConfig,
  }
}
