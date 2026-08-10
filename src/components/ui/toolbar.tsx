"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {Camera, Image as ImageIcon, Video, Webcam, Pause, Download, Square, RotateCw} from "lucide-react"
import React from "react";

type InputMode = "image" | "video" | "camera" | null

export function Toolbar({
                          mediaPipeReady,
                          isStreamActive,
                          inputMode,
                          converting,
                          progress,
                          exported,
                          onToggleCamera,
                          onPickImage,
                          onPickVideo,
                          onExport,
                          onCancelConvert,
                          onReload
                        }: {
  mediaPipeReady: boolean
  isStreamActive: boolean
  inputMode: InputMode
  converting: boolean
  progress: number
  exported: string | null
  onToggleCamera: () => void
  onPickImage: () => void
  onPickVideo: () => void
  onExport: () => void
  onCancelConvert: () => void
  onReload: () => void
}) {
  return (
    <div className="flex items-center gap-0.5 border-b border-white/5 px-1.5 py-1.5 md:gap-1 md:px-3 md:py-2">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onToggleCamera}
              variant="ghost"
              size="icon"
              className={`size-7 ${isStreamActive ? "bg-white/10 text-white hover:bg-white/15" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              disabled={!mediaPipeReady}
            >
              {isStreamActive ? <Pause className="size-3.5" /> : <Webcam className="size-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{!mediaPipeReady ? "Loading…" : isStreamActive ? "Stop webcam" : "Start webcam"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onPickImage} variant="ghost" size="icon" className="size-7 text-white/70 hover:bg-white/10 hover:text-white" disabled={!mediaPipeReady}>
              <ImageIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload image</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onPickVideo} variant="ghost" size="icon" className="size-7 text-white/70 hover:bg-white/10 hover:text-white" disabled={!mediaPipeReady}>
              <Video className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload video</TooltipContent>
        </Tooltip>

        <div className="ml-auto hidden items-center gap-1.5 md:flex">
          {converting ? (
            <span className="font-mono text-[10px] tabular-nums text-blue-300/90">{Math.round(progress * 100)}%</span>
          ) : exported ? (
            <span className="font-mono text-[10px] tabular-nums text-emerald-300/90">{exported}</span>
          ) : (
            <StatusPill inputMode={inputMode} />
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={converting ? onCancelConvert : onExport}
                variant="ghost"
                size="icon"
                className={`size-7 ${converting ? "bg-blue-500/10 text-blue-300 hover:bg-blue-500/15" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                disabled={(inputMode !== "video" && inputMode !== "image") || !mediaPipeReady}
              >
                {converting ? <Square className="size-3.5 fill-current" /> : <Download className="size-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {converting ? "Stop converting" : inputMode === "image" ? "Save this pose as a VMD file" : "Convert this video to a VMD file"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onReload} variant="ghost" size="icon" className="size-7 text-white/70 hover:bg-white/10 hover:text-white">
                <RotateCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload to apply bone filter</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

function StatusPill({ inputMode }: { inputMode: InputMode }) {
  if (inputMode === "camera") return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-300">
      <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> Live
    </span>
  )
  if (inputMode === "video") return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">Video</span>
  )
  if (inputMode === "image") return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">Image</span>
  )
  return null
}