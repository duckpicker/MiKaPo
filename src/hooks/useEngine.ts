"use client"

import { useRef, useCallback, useState } from "react"
import { Engine, Vec3 } from "reze-engine"
import type { EngineStats } from "reze-engine"

export function useEngine() {
  const engineRef = useRef<Engine | null>(null)
  const [engineInited, setEngineInited] = useState(false)
  const [stats, setStats] = useState<EngineStats | null>(null)

  const initEngine = useCallback(async (canvas: HTMLCanvasElement) => {
    const engine = new Engine(canvas, {
      bloom: { color: new Vec3(0.5, 0.1, 0.9), intensity: 0.03 },
      camera: { distance: 30 },
    })
    engineRef.current = engine
    await engine.init()
    engine.setIKEnabled(false)
    engine.runRenderLoop(() => setStats(engine.getStats()))
    setEngineInited(true)
  }, [])

  const dispose = useCallback(() => {
    engineRef.current?.dispose()
  }, [])

  return { engineRef, engineInited, stats, initEngine, dispose }
}
