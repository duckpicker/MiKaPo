"use client"

import { useEffect, useRef, useState, useCallback, Suspense, ComponentType, lazy } from "react"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import { useMediaPipe } from "@/hooks/useMediaPipe"
import { useVideoControls } from "@/hooks/useVideoControls"
import { useVmdExport } from "@/hooks/useVmdExport"
import { useBoneFilter } from "@/hooks/useBoneFilter"
import { useFaceConfig } from "@/hooks/useFaceConfig"
import { useInputMode } from "@/hooks/useInputMode"
import { Sidebar } from "./ui/sidebar"
import { ConfigurationModule } from "@/configuration"
import type { BoneState, BodyCollider } from "@/types/solver"
import type { FaceSolverResult, FaceMorphWeights } from "@/types/face"
import type { PoseWorkerResult } from "@/types/pose-worker"
import { buildClip } from "@/lib/vmd"
import {useSceneConfig} from "@/hooks/useSceneConfig";
import {Engine, Model} from "reze-engine";

type DebugSceneProps = { landmarks: PoseWorkerResult | null }
const DebugScene = lazy<ComponentType<DebugSceneProps>>(() => import("./debug-scene"))

const DEBUG_PREVIEW_INTERVAL_MS = 66

export const MotionCapture = ({
    applyPose, applyFace, modelLoaded, onMediaPipeReadyChange, resetModel,
    restPose, colliders, modelMorphs, exportVmd,
    onSolverReady, onFaceSolverReady,
    engineRef, modelRef
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
  configModule?: ConfigurationModule
  onSolverReady?: (solver: Solver) => void
  onFaceSolverReady?: (face: FaceBlendshapeSolver) => void
  engineRef: React.RefObject<Engine | null>
  modelRef: React.RefObject<Model | null>
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const solverRef = useRef<Solver>(new Solver())
  const faceSolverRef = useRef<FaceBlendshapeSolver>(new FaceBlendshapeSolver())

  const [landmarks, setLandmarks] = useState<PoseWorkerResult | null>(null)

  const { boneGroupsSet, handleBoneChange, filterPose } = useBoneFilter()
  const faceCfg = useFaceConfig(faceSolverRef)
  const sceneCfg = useSceneConfig(engineRef, solverRef, modelRef, modelLoaded)
  const resetAll = useCallback(() => { resetModel?.(); solverRef.current.reset(); faceSolverRef.current.reset() }, [resetModel])
  const modelLoadedRef = useRef(modelLoaded)
  useEffect(() => { modelLoadedRef.current = modelLoaded }, [modelLoaded])
  const applyPoseRef = useRef(applyPose)
  useEffect(() => { applyPoseRef.current = applyPose }, [applyPose])
  const applyFaceRef = useRef(applyFace)
  useEffect(() => { applyFaceRef.current = applyFace }, [applyFace])
  const faceEnabledRef = useRef(faceCfg.faceEnabled)
  useEffect(() => { faceEnabledRef.current = faceCfg.faceEnabled }, [faceCfg.faceEnabled])

  const lastDebugUpdateRef = useRef(0)
  const lastResultAtRef = useRef(0)
  const resultIntervalEmaRef = useRef(33)

  const handleResult = useCallback((result: PoseWorkerResult, timestampMs: number) => {
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
      const faceResult = faceSolverRef.current.solve(result.faceLandmarks[0], timestampMs)
      applyFaceRef.current(faceResult, tweenMs)
    }
  }, [filterPose])

  const { mediaPipeReady, awaitFrame, setConverting, postMode, postReset } = useMediaPipe(videoRef, imageRef, handleResult)

  const videoControls = useVideoControls()
  const { converting, progress, exported, cancelRef, exportPoseVmd, convertVideoToVmd } = useVmdExport(
    solverRef, faceSolverRef, exportVmd, faceEnabledRef,
  )

  const { inputMode, isStreamActive, currentImage, videoSrc, toggleCamera, handleImageUpload, handleVideoUpload } = useInputMode(videoRef, resetAll, postMode, postReset)


  const handleExport = useCallback(() => {
    if (inputMode === "image") exportPoseVmd()
    else if (videoRef.current) convertVideoToVmd(videoRef.current, awaitFrame)
  }, [inputMode, exportPoseVmd, convertVideoToVmd, awaitFrame])

  const handleReload = useCallback(() => window.location.reload(), [])

  useEffect(() => { if (restPose) solverRef.current.calibrate(restPose) }, [restPose])
  useEffect(() => { if (restPose && colliders) solverRef.current.calibrateColliders(colliders, restPose) }, [restPose, colliders])
  useEffect(() => { if (modelMorphs?.length) faceSolverRef.current.configure(modelMorphs) }, [modelMorphs])
  useEffect(() => { onMediaPipeReadyChange?.(mediaPipeReady) }, [mediaPipeReady, onMediaPipeReadyChange])
  useEffect(() => { onSolverReady?.(solverRef.current); onFaceSolverReady?.(faceSolverRef.current) }, [onSolverReady, onFaceSolverReady])

  return (
    <>
      <video ref={videoRef} className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
             playsInline autoPlay={inputMode === "camera"} disablePictureInPicture
             controlsList="nofullscreen noremoteplayback nodownload"
             src={isStreamActive ? undefined : videoSrc}
             onPlay={() => videoControls.setPlaying(true)} onPause={() => videoControls.setPlaying(false)}
             onTimeUpdate={(e) => videoControls.setTime(e.currentTarget.currentTime)}
             onLoadedMetadata={(e) => videoControls.resolveDuration(e.currentTarget)}
             onDurationChange={(e) => videoControls.resolveDuration(e.currentTarget)}
      />
      <img ref={imageRef} src={currentImage} alt="" className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />

      <Sidebar
        inputMode={inputMode} isStreamActive={isStreamActive} mediaPipeReady={mediaPipeReady}
        onToggleCamera={toggleCamera}
        onPickImage={() => imageInputRef.current?.click()}
        onPickVideo={() => videoInputRef.current?.click()}
        boneGroups={boneGroupsSet} onBoneChange={handleBoneChange}
        onReload={handleReload} onExport={handleExport}
        videoRef={videoRef} currentImage={currentImage} videoSrc={videoSrc}
        landmarks={landmarks} DebugScene={DebugScene}
        faceEnabled={faceCfg.faceEnabled} onFaceEnabledChange={faceCfg.setFaceEnabled}
        faceMorphs={faceCfg.faceMorphs} onFaceMorphChange={faceCfg.setFaceMorphs}
        faceThresholds={faceCfg.faceThresholds} onFaceThresholdChange={faceCfg.setFaceThresholds}
        faceSmoothing={faceCfg.faceSmoothing} onFaceSmoothingChange={faceCfg.setFaceSmoothing}
        faceGaze={faceCfg.faceGaze} onFaceGazeChange={faceCfg.setFaceGaze}
        sceneCamera={sceneCfg.sceneCamera} onSceneCameraChange={sceneCfg.onSceneCameraChange}
        sceneBackground={sceneCfg.sceneBackground} onSceneBackgroundChange={sceneCfg.onSceneBackgroundChange}
        sceneSun={sceneCfg.sceneSun} onSceneSunChange={sceneCfg.onSceneSunChange}
        sceneWorld={sceneCfg.sceneWorld} onSceneWorldChange={sceneCfg.onSceneWorldChange}
        sceneSmoothing={sceneCfg.sceneSmoothing} onSceneSmoothingChange={sceneCfg.onSceneSmoothingChange}
      />

      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoUpload} />
    </>
  )
}