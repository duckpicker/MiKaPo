"use client"

import { useEffect, useRef, useState, useCallback, Suspense, ComponentType, lazy } from "react"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import { useMediaPipe, type InputMode } from "@/hooks/useMediaPipe"
import { useVideoControls } from "@/hooks/useVideoControls"
import { useVmdExport } from "@/hooks/useVmdExport"
import { Sidebar } from "./ui/sidebar"
import { ConfigurationModule } from "@/configuration"
import type { BoneGroup } from "@/configuration/types"
import type { BoneState, BodyCollider } from "@/types/solver"
import type { FaceSolverResult, FaceMorphWeights } from "@/types/face"
import type { PoseWorkerResult } from "@/types/pose-worker"
import { buildClip } from "@/lib/vmd"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { BONE_GROUP_MEMBERS } from "@/configuration/bone-filter"
import { Quat } from "reze-engine"

type DebugSceneProps = { landmarks: PoseWorkerResult | null }
const DebugScene = lazy<ComponentType<DebugSceneProps>>(() => import("./debug-scene"))

const DEBUG_PREVIEW_INTERVAL_MS = 66
const DEFAULT_BONE_GROUPS: BoneGroup[] = ["head", "upperTorso", "lowerTorso", "leftArm", "rightArm", "leftLeg", "rightLeg", "fingers"]

export const MotionCapture = ({
                                applyPose, applyFace, modelLoaded, onMediaPipeReadyChange, resetModel,
                                restPose, colliders, modelMorphs, exportVmd,
                                configModule, onSolverReady, onFaceSolverReady,
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
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const solverRef = useRef<Solver>(new Solver())
  const faceSolverRef = useRef<FaceBlendshapeSolver>(new FaceBlendshapeSolver())
  const faceEnabledRef = useRef(true)

  const [inputMode, setInputMode] = useState<InputMode>("video")
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [currentImage, setCurrentImage] = useState("/4.png")
  const [videoSrc, setVideoSrc] = useState<string>()
  const [landmarks, setLandmarks] = useState<PoseWorkerResult | null>(null)
  const [lastMedia, setLastMedia] = useState<"IMAGE" | "VIDEO">("VIDEO")

  // Bone groups
  const [boneGroups, setBoneGroups] = useLocalStorage<BoneGroup[]>("mikapo-bone-groups", DEFAULT_BONE_GROUPS)
  const boneGroupsRef = useRef(boneGroups)
  useEffect(() => { boneGroupsRef.current = boneGroups }, [boneGroups])
  const boneGroupsSet = new Set(boneGroups)

  // Face state
  const [faceEnabled, setFaceEnabled] = useState(true)
  const [faceMorphs, setFaceMorphs] = useState({ blink: true, wink: true, mouth: true, smile: true })
  const [faceThresholds, setFaceThresholds] = useState({ eyeOpen: 0.3, eyeClosed: 0.1, mouthOpen: 0.18, smile: 0.008 })
  const [faceSmoothing, setFaceSmoothing] = useState({ eyes: 0.5, mouth: 0.5, smile: 0.5 })
  const [faceGaze, setFaceGaze] = useState({ enabled: true, strength: 1.0 })

  // Sync face state → solver
  const faceSolverRef2 = useRef(faceSolverRef.current)
  useEffect(() => {
    const f = faceSolverRef.current
    f.setEnabled(faceEnabled)
    f.setMorphEnabled("blink", faceMorphs.blink)
    f.setMorphEnabled("wink", faceMorphs.wink)
    f.setMorphEnabled("mouth", faceMorphs.mouth)
    f.setMorphEnabled("smile", faceMorphs.smile)
    f.setThresholds(faceThresholds)
    f.setSmoothing(faceSmoothing)
    f.setGazeEnabled(faceGaze.enabled)
    f.setGazeStrength(faceGaze.strength)
  }, [faceEnabled, faceMorphs, faceThresholds, faceSmoothing, faceGaze])

  const currentBoneStatesRef = useRef<BoneState[]>([])
  const currentMorphWeightsRef = useRef<FaceMorphWeights | null>(null)
  const modelLoadedRef = useRef(modelLoaded)
  useEffect(() => { modelLoadedRef.current = modelLoaded }, [modelLoaded])
  const applyPoseRef = useRef(applyPose)
  useEffect(() => { applyPoseRef.current = applyPose }, [applyPose])
  const applyFaceRef = useRef(applyFace)
  useEffect(() => { applyFaceRef.current = applyFace }, [applyFace])
  const inputModeRef = useRef<InputMode>(null)
  useEffect(() => { inputModeRef.current = inputMode }, [inputMode])

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

    const pose = solverRef.current.solve(result, timestampMs, inputModeRef.current === "image")

    const groups = boneGroupsRef.current
    const activeNames = new Set<string>()
    for (const group of groups) {
      for (const name of BONE_GROUP_MEMBERS[group]) {
        activeNames.add(name)
      }
    }
    if (groups.includes("leftArm") || groups.includes("rightArm")) activeNames.add("上半身")
    if (groups.includes("leftLeg") || groups.includes("rightLeg")) activeNames.add("下半身")
    if (groups.includes("head")) activeNames.add("首")

    const filtered = pose.map(b => activeNames.has(b.name) ? b : { name: b.name, rotation: Quat.identity() })
    currentBoneStatesRef.current = filtered
    applyPoseRef.current(filtered, inputModeRef.current === "image" ? 0 : tweenMs)

    if (faceEnabledRef.current && result.faceLandmarks?.[0]) {
      const faceResult = faceSolverRef.current.solve(result.faceLandmarks[0], timestampMs)
      currentMorphWeightsRef.current = faceResult.morphWeights
      applyFaceRef.current(faceResult, tweenMs)
    }
  }, [])

  const { mediaPipeReady, awaitFrame, setConverting, postMode, postReset } = useMediaPipe(videoRef, imageRef, handleResult)
  const videoControls = useVideoControls()
  const { converting, progress, exported, setExported, cancelRef, exportPoseVmd, convertVideoToVmd } = useVmdExport(
    { current: solverRef.current }, { current: faceSolverRef.current },
    currentBoneStatesRef, currentMorphWeightsRef, faceEnabledRef, exportVmd,
  )

  useEffect(() => { onSolverReady?.(solverRef.current); onFaceSolverReady?.(faceSolverRef.current) }, [onSolverReady, onFaceSolverReady])
  useEffect(() => { if (restPose) solverRef.current.calibrate(restPose) }, [restPose])
  useEffect(() => { if (restPose && colliders) solverRef.current.calibrateColliders(colliders, restPose) }, [restPose, colliders])
  useEffect(() => { if (modelMorphs?.length) faceSolverRef.current.configure(modelMorphs) }, [modelMorphs])
  useEffect(() => { onMediaPipeReadyChange?.(mediaPipeReady) }, [mediaPipeReady, onMediaPipeReadyChange])

  const resetAll = useCallback(() => { resetModel?.(); solverRef.current.reset(); faceSolverRef.current.reset() }, [resetModel])
  const toggleCamera = useCallback(() => { isStreamActive ? stopCamera() : startCamera() }, [isStreamActive])
  const handleExport = useCallback(() => { inputMode === "image" ? exportPoseVmd() : videoRef.current && convertVideoToVmd(videoRef.current, awaitFrame) }, [inputMode, exportPoseVmd, convertVideoToVmd, awaitFrame])
  const handleBoneChange = useCallback((groups: Set<BoneGroup>) => setBoneGroups([...groups]), [setBoneGroups])
  const handleReload = useCallback(() => window.location.reload(), [])

  const stopCamera = useCallback(() => {
    const video = videoRef.current
    if (video?.srcObject) { (video.srcObject as MediaStream).getTracks().forEach(t => t.stop()); video.srcObject = null }
    if (video) { video.pause(); video.src = ""; video.load() }
    setIsStreamActive(false); setInputMode(null)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      stopCamera(); resetAll()
      if (lastMedia === "IMAGE") postMode("VIDEO")
      setInputMode("camera")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setIsStreamActive(true); setLastMedia("VIDEO")
    } catch (err) { console.error("Camera error:", err); setIsStreamActive(false); setInputMode(null) }
  }, [stopCamera, resetAll, postMode, lastMedia])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file?.type.includes("image")) return
    resetAll(); postMode("IMAGE"); postReset()
    setCurrentImage(URL.createObjectURL(file)); setVideoSrc(undefined); setInputMode("image"); setLastMedia("IMAGE")
  }, [resetAll, postMode, postReset])

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file?.type.includes("video")) return
    resetAll()
    if (lastMedia === "IMAGE") { postMode("VIDEO"); setCurrentImage("") }
    setVideoSrc(URL.createObjectURL(file)); setInputMode("video")
    if (videoRef.current) videoRef.current.currentTime = 0
    setLastMedia("VIDEO")
  }, [resetAll, postMode, lastMedia])

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
        faceEnabled={faceEnabled} onFaceEnabledChange={setFaceEnabled}
        faceMorphs={faceMorphs} onFaceMorphChange={m => setFaceMorphs(p => ({ ...p, ...m }))}
        faceThresholds={faceThresholds} onFaceThresholdChange={t => setFaceThresholds(p => ({ ...p, ...t }))}
        faceSmoothing={faceSmoothing} onFaceSmoothingChange={s => setFaceSmoothing(p => ({ ...p, ...s }))}
        faceGaze={faceGaze} onFaceGazeChange={g => setFaceGaze(p => ({ ...p, ...g }))}
      />

      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoUpload} />
    </>
  )
}