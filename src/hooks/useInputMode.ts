"use client"

import { useState, useCallback, useRef } from "react"
import type { InputMode } from "./useMediaPipe"

export function useInputMode(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  resetAll: () => void,
  postMode: (mode: "VIDEO" | "IMAGE") => void,
  postReset: () => void,
) {
  const [inputMode, setInputMode] = useState<InputMode>("video")
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [currentImage, setCurrentImage] = useState("/4.png")
  const [videoSrc, setVideoSrc] = useState<string>()
  const [lastMedia, setLastMedia] = useState<"IMAGE" | "VIDEO">("VIDEO")
  const inputModeRef = useRef<InputMode>(null)

  const stopCamera = useCallback(() => {
    const video = videoRef.current
    if (video?.srcObject) {
      ;(video.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
    if (video) {
      video.pause()
      video.src = ""
      video.load()
    }
    setIsStreamActive(false)
    setInputMode(null)
  }, [videoRef])

  const startCamera = useCallback(async () => {
    try {
      stopCamera()
      resetAll()
      if (lastMedia === "IMAGE") postMode("VIDEO")
      setInputMode("camera")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsStreamActive(true)
      setLastMedia("VIDEO")
    } catch (err) {
      console.error("Camera error:", err)
      setIsStreamActive(false)
      setInputMode(null)
    }
  }, [stopCamera, resetAll, postMode, lastMedia, videoRef])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file?.type.includes("image")) return
      resetAll()
      postMode("IMAGE")
      postReset()
      setCurrentImage(URL.createObjectURL(file))
      setVideoSrc(undefined)
      setInputMode("image")
      setLastMedia("IMAGE")
    },
    [resetAll, postMode, postReset],
  )

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file?.type.includes("video")) return
      resetAll()
      if (lastMedia === "IMAGE") {
        postMode("VIDEO")
        setCurrentImage("")
      }
      setVideoSrc(URL.createObjectURL(file))
      setInputMode("video")
      if (videoRef.current) videoRef.current.currentTime = 0
      setLastMedia("VIDEO")
    },
    [resetAll, postMode, lastMedia, videoRef],
  )

  const toggleCamera = useCallback(() => {
    isStreamActive ? stopCamera() : startCamera()
  }, [isStreamActive, stopCamera, startCamera])

  return {
    inputMode,
    isStreamActive,
    currentImage,
    videoSrc,
    lastMedia,
    toggleCamera,
    handleImageUpload,
    handleVideoUpload,
  }
}
