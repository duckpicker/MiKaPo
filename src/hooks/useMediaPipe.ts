"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import type { PoseWorkerRequest, PoseWorkerResponse, PoseWorkerResult } from "@/types/pose-worker"
import { MediaPipeConfig } from "@/configuration"

export type InputMode = "image" | "video" | "camera" | null

export function useMediaPipe(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  imageRef: React.RefObject<HTMLImageElement | null>,
  onResult: (result: PoseWorkerResult, mediaTs: number) => void,
  mediaPipeConfig?: MediaPipeConfig,
) {
  const workerRef = useRef<Worker | null>(null)
  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const awaitingRef = useRef<((r: PoseWorkerResult | null) => void) | null>(null)
  const convertingRef = useRef(false)

  const send = useCallback((msg: PoseWorkerRequest, transfer?: Transferable[]) => {
    workerRef.current?.postMessage(msg, transfer ?? [])
  }, [])

  useEffect(() => {
    let rafId = 0
    let ready = false
    let pending = false
    let pendingSince = 0
    let lastVideoTime = -1
    let lastImgSrc = ""

    const worker = new Worker(new URL("../lib/pose-worker.ts", import.meta.url))
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<PoseWorkerResponse>) => {
      const msg = e.data
      if (msg.type === "ready") {
        ready = true
        worker.postMessage({ type: "config", config: mediaPipeConfig })
        setMediaPipeReady(true)
      } else if (msg.type === "result") {
        pending = false
        if (awaitingRef.current) {
          awaitingRef.current(msg.result)
          awaitingRef.current = null
        } else if (msg.result.poseWorldLandmarks[0]) {
          onResult(msg.result, msg.mediaTs)
        }
      } else if (msg.type === "error") {
        pending = false
        awaitingRef.current?.(null)
        awaitingRef.current = null
        console.error("Pose worker error:", msg.message)
      }
    }
    worker.onerror = (e) => console.error("Failed to initialize pose worker:", e.message)
    send({ type: "init" })

    const detect = () => {
      rafId = requestAnimationFrame(detect)
      if (!ready || convertingRef.current) return
      const now = performance.now()
      if (pending) {
        if (now - pendingSince > 2000) pending = false
        else return
      }
      const video = videoRef.current
      if (video && video.videoWidth > 0 && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        const isCamera = !video.src && video.srcObject !== null
        if (!isCamera && video.currentTime === lastVideoTime) return
        lastVideoTime = video.currentTime
        const mediaTs = isCamera ? performance.now() : video.currentTime * 1000
        pending = true
        pendingSince = now
        createImageBitmap(video)
          .then((bitmap) => send({ type: "video", bitmap, ts: performance.now(), mediaTs }, [bitmap]))
          .catch(() => {
            pending = false
          })
      } else if (
        imageRef.current &&
        imageRef.current.complete &&
        imageRef.current.naturalWidth > 0 &&
        imageRef.current.src !== lastImgSrc
      ) {
        lastImgSrc = imageRef.current.src
        pending = true
        pendingSince = now
        createImageBitmap(imageRef.current)
          .then((bitmap) => send({ type: "image", bitmap, mediaTs: performance.now() }, [bitmap]))
          .catch(() => {
            pending = false
          })
      }
    }
    detect()

    return () => {
      cancelAnimationFrame(rafId)
      worker.terminate()
      workerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const awaitFrame = useCallback(
    (bitmap: ImageBitmap, mediaTs: number, tick: number) => {
      return new Promise<PoseWorkerResult | null>((resolve) => {
        awaitingRef.current = resolve
        send({ type: "video", bitmap, ts: tick, mediaTs }, [bitmap])
      })
    },
    [send],
  )

  const setConverting = useCallback((v: boolean) => {
    convertingRef.current = v
  }, [])

  const postMode = useCallback((mode: "VIDEO" | "IMAGE") => send({ type: "mode", running: mode }), [send])
  const postReset = useCallback(() => send({ type: "reset" }), [send])

  return { mediaPipeReady, awaitFrame, setConverting, postMode, postReset }
}
