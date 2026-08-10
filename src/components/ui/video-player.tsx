"use client"

import { Pause, Play } from "lucide-react"

interface VideoControls {
  playing: boolean
  setPlaying: (v: boolean) => void
  time: number
  setTime: (v: number) => void
  duration: number
  resolveDuration: (video: HTMLVideoElement) => void
  formatTime: (s: number) => string
}

export function VideoPlayer({
    videoRef,
    src,
    isCamera,
    controls,
    converting,
  }: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  src: string | undefined
  isCamera: boolean
  controls: VideoControls
  converting: boolean
}) {
  const { playing, setPlaying, time, setTime, duration, resolveDuration, formatTime } = controls

  return (
    <>
      <video
        ref={videoRef}
        className={`h-full w-full object-contain ${isCamera ? "scale-x-[-1]" : ""}`}
        playsInline
        autoPlay={isCamera}
        disablePictureInPicture
        controlsList="nofullscreen noremoteplayback nodownload"
        src={isCamera ? undefined : src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => resolveDuration(e.currentTarget)}
        onDurationChange={(e) => resolveDuration(e.currentTarget)}
      />

      {!isCamera && src && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 py-1.5">
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current
              if (!v || converting) return
              v.paused ? v.play() : v.pause()
            }}
            disabled={converting}
            className="flex size-6 shrink-0 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-[1px]" />}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={time}
            disabled={converting}
            onChange={(e) => {
              if (videoRef.current && !converting) videoRef.current.currentTime = Number(e.target.value)
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 disabled:cursor-not-allowed accent-white outline-none [&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="hidden font-mono text-[10px] tabular-nums text-white/70 sm:block">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </>
  )
}