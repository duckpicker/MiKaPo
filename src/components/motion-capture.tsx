"use client"

import { Sidebar } from "./ui/sidebar"
import { useMotionCapture } from "@/hooks/useMotionCapture"
import { ConfigurationModule } from "@/configuration"
import type { BoneState, BodyCollider } from "@/types/solver"
import type { FaceSolverResult } from "@/types/face"
import { buildClip } from "@/lib/vmd"
import { Engine, Model } from "reze-engine"
import { Solver } from "@/lib/solver"
import { FaceBlendshapeSolver } from "@/lib/face-blendshape-solver"
import DebugScene from "@/components/debug-scene"

export const MotionCapture = (props: {
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
  const {
    videoRef,
    imageRef,
    videoControls,
    inputMode,
    isStreamActive,
    currentImage,
    videoSrc,
    landmarks,
    panels,
    actions,
    fileInputRef,
    handleLoadConfig,
  } = useMotionCapture(props)

  return (
    <>
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
        playsInline
        autoPlay={inputMode === "camera"}
        disablePictureInPicture
        controlsList="nofullscreen noremoteplayback nodownload"
        src={isStreamActive ? undefined : videoSrc}
        onPlay={() => videoControls.setPlaying(true)}
        onPause={() => videoControls.setPlaying(false)}
        onTimeUpdate={(e) => videoControls.setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => videoControls.resolveDuration(e.currentTarget)}
        onDurationChange={(e) => videoControls.resolveDuration(e.currentTarget)}
      />
      <img
        ref={imageRef}
        src={currentImage}
        alt=""
        className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
      />
      <Sidebar
        panels={panels}
        actions={actions}
        videoRef={videoRef}
        currentImage={currentImage}
        videoSrc={videoSrc}
        landmarks={landmarks}
        DebugScene={DebugScene}
      />
      <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleLoadConfig} />
    </>
  )
}
