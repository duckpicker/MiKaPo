"use client"

import { useState, useCallback, useRef } from "react"

export function useVideoControls() {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const nudged = useRef(false)

  const resolveDuration = useCallback((video: HTMLVideoElement) => {
    const d = video.duration
    if (Number.isFinite(d) && d > 0) {
      setDuration(d)
      nudged.current = false
      return
    }
    if (nudged.current) return
    nudged.current = true
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked)
      video.currentTime = 0
    }
    video.addEventListener("seeked", onSeeked)
    video.currentTime = 1e9
  }, [])

  const formatTime = (s: number): string => {
    if (!Number.isFinite(s) || s < 0) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return { playing, setPlaying, time, setTime, duration, setDuration, resolveDuration, formatTime }
}
