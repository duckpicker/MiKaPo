"use client"

import { useState, useCallback, Suspense } from "react"
import { Webcam, Bone, Smile, RotateCw, Download, Video, ImageIcon, Camera, Mountain, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BoneToggles } from "./bone-toggles"
import { FacePanel } from "./face-panel"
import { SettingsPanel } from "./settings-panel"
import { MediaPipePanel } from "./mediapipe-panel"
import Image from "next/image"
import type { PanelsState, PanelsActions } from "@/configuration/types"
import type { PoseWorkerResult } from "@/types/pose-worker"

type TabId = "media" | "bones" | "face" | "world" | "mediapipe"

interface SidebarProps {
  panels: PanelsState
  actions: PanelsActions
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentImage: string
  videoSrc?: string
  landmarks: PoseWorkerResult | null
  DebugScene: React.ComponentType<{ landmarks: PoseWorkerResult | null }> | null
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

export function Sidebar({ panels, actions, videoRef, currentImage, videoSrc, landmarks, DebugScene }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>("media")
  const toggle = useCallback((tab: TabId) => setActiveTab((prev) => (prev === tab ? null : tab)), [])
  const isOpen = activeTab !== null
  const [showPreview, setShowPreview] = useState(false)
  const p = panels
  const a = actions

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
          <TabIcon icon={RotateCw} label="Reload" onClick={a.onReload} />
          <TabIcon icon={Download} label="Export" onClick={a.onExport} />
        </div>

        <div
          className={`w-64 rounded-xl border border-white/10 bg-zinc-950/60 p-3 backdrop-blur-md shadow-2xl shadow-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className={activeTab === "media" ? "" : "hidden"}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Camera</span>
              <Button
                onClick={a.onToggleCamera}
                variant="ghost"
                size="sm"
                disabled={!p.mediaPipeReady}
                className={`justify-start gap-2 text-xs ${p.isStreamActive ? "text-red-300" : "text-white/70"} hover:bg-white/10 hover:text-white`}
              >
                <Webcam className="size-3.5" /> {p.isStreamActive ? "Stop Camera" : "Start Camera"}
              </Button>
              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="size-3.5 accent-white"
                />
                Show Preview
              </label>
            </div>
          </div>
          <div className={activeTab === "bones" ? "" : "hidden"}>
            <BoneToggles enabled={p.boneGroups} onChange={a.onBoneChange} />
          </div>
          <div className={activeTab === "face" ? "" : "hidden"}>
            <FacePanel
              enabled={p.faceEnabled}
              onEnabledChange={a.onFaceEnabledChange}
              morphs={p.faceMorphs}
              onMorphChange={a.onFaceMorphChange}
              thresholds={p.faceThresholds}
              onThresholdChange={a.onFaceThresholdChange}
              smoothing={p.faceSmoothing}
              onSmoothingChange={a.onFaceSmoothingChange}
              gaze={p.faceGaze}
              onGazeChange={a.onFaceGazeChange}
            />
          </div>
          <div className={activeTab === "world" ? "" : "hidden"}>
            <SettingsPanel
              camera={p.sceneCamera}
              onCameraChange={a.onSceneCameraChange}
              background={p.sceneBackground}
              onBackgroundChange={a.onSceneBackgroundChange}
              sun={p.sceneSun}
              onSunChange={a.onSceneSunChange}
              world={p.sceneWorld}
              onWorldChange={a.onSceneWorldChange}
              smoothing={p.sceneSmoothing}
              onSmoothingChange={a.onSceneSmoothingChange}
            />
          </div>
          <div className={activeTab === "mediapipe" ? "" : "hidden"}>
            <MediaPipePanel config={p.mediaPipeConfig} onChange={a.onMediaPipeConfigChange} />
          </div>
        </div>
      </div>

      <div
        className={`fixed right-4 bottom-4 z-20 flex flex-col gap-2 w-56 md:w-64 lg:w-72 transition-opacity ${showPreview ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="aspect-video rounded-xl border border-white/10 bg-black/50 overflow-hidden">
          {p.inputMode === "image" && (
            <Image src={currentImage} alt="" width={320} height={180} className="w-full h-full object-contain" />
          )}
          {(p.inputMode === "video" || p.inputMode === "camera") && (
            <video
              ref={videoRef}
              src={p.isStreamActive ? undefined : videoSrc}
              className={`w-full h-full object-contain ${p.inputMode === "camera" ? "scale-x-[-1]" : ""}`}
              playsInline
              autoPlay={p.inputMode === "camera"}
              disablePictureInPicture
              muted
            />
          )}
          {!p.inputMode && (
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
