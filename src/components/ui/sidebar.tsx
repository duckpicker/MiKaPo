"use client"

import { useState, useCallback, Suspense } from "react"
import { Webcam, Bone, Smile, RotateCw, Download, Video, ImageIcon, Camera, Mountain, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BoneToggles } from "./bone-toggles"
import type { BoneGroup, MediaPipeConfig } from "@/configuration/types"
import type { InputMode } from "@/hooks/useMediaPipe"
import type { PoseWorkerResult } from "@/types/pose-worker"
import { FacePanel } from "@/components/ui/face-panel"
import { SettingsPanel } from "@/components/ui/settings-panel"
import Image from "next/image"
import { MediaPipePanel } from "@/components/ui/mediapipe-panel"

type TabId = "media" | "bones" | "face" | "world" | "mediapipe"

interface SidebarProps {
  inputMode: InputMode
  isStreamActive: boolean
  mediaPipeReady: boolean
  onToggleCamera: () => void
  onPickImage: () => void
  onPickVideo: () => void
  boneGroups: Set<BoneGroup>
  onBoneChange: (groups: Set<BoneGroup>) => void
  onReload: () => void
  onExport: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentImage: string
  videoSrc?: string
  landmarks: PoseWorkerResult | null
  DebugScene: React.ComponentType<{ landmarks: PoseWorkerResult | null }> | null
  faceEnabled: boolean
  onFaceEnabledChange: (on: boolean) => void
  faceMorphs: { blink: boolean; wink: boolean; mouth: boolean; smile: boolean }
  onFaceMorphChange: (m: Partial<{ blink: boolean; wink: boolean; mouth: boolean; smile: boolean }>) => void
  faceThresholds: { eyeOpen: number; eyeClosed: number; mouthOpen: number; smile: number }
  onFaceThresholdChange: (t: Partial<{ eyeOpen: number; eyeClosed: number; mouthOpen: number; smile: number }>) => void
  faceSmoothing: { eyes: number; mouth: number; smile: number }
  onFaceSmoothingChange: (s: Partial<{ eyes: number; mouth: number; smile: number }>) => void
  faceGaze: { enabled: boolean; strength: number }
  onFaceGazeChange: (g: Partial<{ enabled: boolean; strength: number }>) => void
  sceneCamera: { distance: number; followBone: string; followSmoothing: number; offsetY: number }
  onSceneCameraChange: (
    c: Partial<{ distance: number; followBone: string; followSmoothing: number; offsetY: number }>,
  ) => void
  sceneBackground: { r: number; g: number; b: number } | null
  onSceneBackgroundChange: (bg: { r: number; g: number; b: number } | null) => void
  sceneSun: {
    direction: { x: number; y: number; z: number }
    strength: number
    color: { r: number; g: number; b: number }
  }
  onSceneSunChange: (
    s: Partial<{
      direction: { x: number; y: number; z: number }
      strength: number
      color: { r: number; g: number; b: number }
    }>,
  ) => void
  sceneWorld: { strength: number; color: { r: number; g: number; b: number } }
  onSceneWorldChange: (w: Partial<{ strength: number; color: { r: number; g: number; b: number } }>) => void
  sceneSmoothing: { minCutoff: number; beta: number; dCutoff: number }
  onSceneSmoothingChange: (s: Partial<{ minCutoff: number; beta: number; dCutoff: number }>) => void
  mediaPipeConfig: MediaPipeConfig
  onMediaPipeConfigChange: (c: Partial<MediaPipeConfig>) => void
}

function TabIcon({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          size="icon"
          className={`size-8 ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar({
  inputMode,
  isStreamActive,
  mediaPipeReady,
  onToggleCamera,
  onPickImage,
  onPickVideo,
  boneGroups,
  onBoneChange,
  onReload,
  onExport,
  videoRef,
  currentImage,
  videoSrc,
  landmarks,
  DebugScene,
  faceEnabled,
  onFaceEnabledChange,
  faceMorphs,
  onFaceMorphChange,
  faceThresholds,
  onFaceThresholdChange,
  faceSmoothing,
  onFaceSmoothingChange,
  faceGaze,
  onFaceGazeChange,
  sceneCamera,
  onSceneCameraChange,
  sceneBackground,
  onSceneBackgroundChange,
  sceneSun,
  onSceneSunChange,
  sceneWorld,
  onSceneWorldChange,
  sceneSmoothing,
  onSceneSmoothingChange,
  mediaPipeConfig,
  onMediaPipeConfigChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>("media")

  const toggle = useCallback((tab: TabId) => {
    setActiveTab((prev) => (prev === tab ? null : tab))
  }, [])

  const isOpen = activeTab !== null

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute left-3 top-12 z-20 flex gap-2">
        <div className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-zinc-950/60 p-1.5 backdrop-blur-md shadow-2xl shadow-black/40">
          <TabIcon icon={Camera} label="Media" active={activeTab === "media"} onClick={() => toggle("media")} />
          <TabIcon icon={Bone} label="Bones" active={activeTab === "bones"} onClick={() => toggle("bones")} />
          <TabIcon icon={Smile} label="Face" active={activeTab === "face"} onClick={() => toggle("face")} />
          <TabIcon icon={Mountain} label="World" active={activeTab === "world"} onClick={() => toggle("world")} />
          <TabIcon
            icon={Cpu}
            label="MediaPipe"
            active={activeTab === "mediapipe"}
            onClick={() => toggle("mediapipe")}
          />
          <div className="my-0.5 h-px bg-white/10" />
          <TabIcon icon={RotateCw} label="Reload" onClick={onReload} />
          <TabIcon icon={Download} label="Export" onClick={onExport} />
        </div>

        <div
          className={`w-64 rounded-xl border border-white/10 bg-zinc-950/60 p-3 backdrop-blur-md shadow-2xl shadow-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className={activeTab === "media" ? "" : "hidden"}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Media</span>
              <Button
                onClick={onToggleCamera}
                variant="ghost"
                size="sm"
                disabled={!mediaPipeReady}
                className={`justify-start gap-2 text-xs ${isStreamActive ? "text-red-300" : "text-white/70"} hover:bg-white/10 hover:text-white`}
              >
                <Webcam className="size-3.5" /> {isStreamActive ? "Stop camera" : "Start camera"}
              </Button>
              <Button
                onClick={onPickImage}
                variant="ghost"
                size="sm"
                disabled={!mediaPipeReady}
                className="justify-start gap-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ImageIcon className="size-3.5" /> Upload image
              </Button>
              <Button
                onClick={onPickVideo}
                variant="ghost"
                size="sm"
                disabled={!mediaPipeReady}
                className="justify-start gap-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Video className="size-3.5" /> Upload video
              </Button>
            </div>
          </div>
          <div className={activeTab === "bones" ? "" : "hidden"}>
            <BoneToggles enabled={boneGroups} onChange={onBoneChange} />
          </div>
          <div className={activeTab === "face" ? "" : "hidden"}>
            <FacePanel
              enabled={faceEnabled}
              onEnabledChange={onFaceEnabledChange}
              morphs={faceMorphs}
              onMorphChange={onFaceMorphChange}
              thresholds={faceThresholds}
              onThresholdChange={onFaceThresholdChange}
              smoothing={faceSmoothing}
              onSmoothingChange={onFaceSmoothingChange}
              gaze={faceGaze}
              onGazeChange={onFaceGazeChange}
            />
          </div>
          <div className={activeTab === "world" ? "" : "hidden"}>
            <SettingsPanel
              camera={sceneCamera}
              onCameraChange={onSceneCameraChange}
              background={sceneBackground}
              onBackgroundChange={onSceneBackgroundChange}
              sun={sceneSun}
              onSunChange={onSceneSunChange}
              world={sceneWorld}
              onWorldChange={onSceneWorldChange}
              smoothing={sceneSmoothing}
              onSmoothingChange={onSceneSmoothingChange}
            />
          </div>
          <div className={activeTab === "mediapipe" ? "" : "hidden"}>
            <MediaPipePanel config={mediaPipeConfig} onChange={onMediaPipeConfigChange} />
          </div>
        </div>
      </div>

      <div
        className={`fixed right-4 bottom-4 z-20 flex flex-col gap-2 w-56 md:w-64 lg:w-72 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="aspect-video rounded-xl border border-white/10 bg-black/50 overflow-hidden">
          {inputMode === "image" && (
            <Image src={currentImage} alt="" width={320} height={180} className="w-full h-full object-contain" />
          )}
          {(inputMode === "video" || inputMode === "camera") && (
            <video
              ref={videoRef}
              src={isStreamActive ? undefined : videoSrc}
              className={`w-full h-full object-contain ${inputMode === "camera" ? "scale-x-[-1]" : ""}`}
              playsInline
              autoPlay={inputMode === "camera"}
              disablePictureInPicture
              muted
            />
          )}
          {!inputMode && (
            <div className="flex items-center justify-center h-full">
              <Camera className="size-6 text-white/30" />
            </div>
          )}
        </div>
        <div className="aspect-[16/10] rounded-xl border border-white/10 bg-black/50 overflow-hidden">
          <Suspense fallback={null}>{DebugScene && <DebugScene landmarks={landmarks} />}</Suspense>
        </div>
      </div>
    </TooltipProvider>
  )
}
