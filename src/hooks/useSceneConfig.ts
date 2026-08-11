"use client"

import { useCallback, useEffect, useState } from "react"
import type { Engine, Model } from "reze-engine"
import { Vec3 } from "reze-engine"
import { Solver } from "@/lib/solver"

interface SceneState {
  camera: {
    distance: number
    followBone: string
    followSmoothing: number
    offsetY: number
    alpha: number
    beta: number
  }
  background: { r: number; g: number; b: number } | null
  sun: { direction: { x: number; y: number; z: number }; strength: number; color: { r: number; g: number; b: number } }
  world: { strength: number; color: { r: number; g: number; b: number } }
  smoothing: { minCutoff: number; beta: number; dCutoff: number }
  groundEnabled: boolean
}

const DEFAULT_SCENE: SceneState = {
  camera: { distance: 12, followBone: "センター", followSmoothing: 0.15, offsetY: 0, alpha: 0, beta: 0 },
  background: { r: 0, g: 0.69, b: 0.14 },
  sun: { direction: { x: 0.5, y: -0.85, z: 0.15 }, strength: 2.5, color: { r: 1, g: 0.95, b: 0.9 } },
  world: { strength: 0.5, color: { r: 0.6, g: 0.7, b: 1.0 } },
  smoothing: { minCutoff: 1.5, beta: 1.5, dCutoff: 4.0 },
  groundEnabled: false,
}

export function useSceneConfig(
  engineRef: React.RefObject<Engine | null>,
  solverRef: React.RefObject<Solver | null>,
  modelRef: React.RefObject<Model | null>,
  modelLoaded: boolean,
) {
  const [scene, setScene] = useState<SceneState>(() => {
    try {
      const saved = localStorage.getItem("mikapo-scene-config")
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_SCENE
  })

  useEffect(() => {
    localStorage.setItem("mikapo-scene-config", JSON.stringify(scene))
  }, [scene])

  useEffect(() => {
    if (!modelLoaded) return

    const tryApply = () => {
      const engine = engineRef.current
      const model = modelRef.current
      if (!engine || !model) {
        requestAnimationFrame(tryApply)
        return
      }

      engine.setCameraDistance(scene.camera.distance)
      engine.setCameraFollow(
        model,
        scene.camera.followBone,
        new Vec3(0, scene.camera.offsetY, 0),
        scene.camera.followSmoothing,
      )

      engine.setCameraAlpha(scene.camera.alpha)
      engine.setCameraBeta(scene.camera.beta)

      engine.setSun({
        direction: new Vec3(scene.sun.direction.x, scene.sun.direction.y, scene.sun.direction.z),
        strength: scene.sun.strength,
        color: new Vec3(scene.sun.color.r, scene.sun.color.g, scene.sun.color.b),
      })
      engine.setWorld({
        color: new Vec3(scene.world.color.r, scene.world.color.g, scene.world.color.b),
        strength: scene.world.strength,
      })
      const bg = scene.background
      engine.setBackgroundColor(bg ? new Vec3(bg.r, bg.g, bg.b) : null)
      solverRef.current?.setSmoothing(scene.smoothing.minCutoff, scene.smoothing.beta, scene.smoothing.dCutoff)
    }

    tryApply()
  }, [modelLoaded, scene])

  return {
    sceneCamera: scene.camera,
    onSceneCameraChange: useCallback((c: Partial<SceneState["camera"]>) => {
      setScene((prev) => ({ ...prev, camera: { ...prev.camera, ...c } }))
    }, []),
    sceneBackground: scene.background,
    onSceneBackgroundChange: useCallback((bg: SceneState["background"]) => {
      setScene((prev) => ({ ...prev, background: bg }))
    }, []),
    sceneSun: scene.sun,
    onSceneSunChange: useCallback((s: Partial<SceneState["sun"]>) => {
      setScene((prev) => ({
        ...prev,
        sun: {
          ...prev.sun,
          ...s,
          direction: s.direction ? { ...prev.sun.direction, ...s.direction } : prev.sun.direction,
          color: s.color ? { ...prev.sun.color, ...s.color } : prev.sun.color,
        },
      }))
    }, []),
    sceneWorld: scene.world,
    onSceneWorldChange: useCallback((w: Partial<SceneState["world"]>) => {
      setScene((prev) => ({
        ...prev,
        world: {
          ...prev.world,
          ...w,
          color: w.color ? { ...prev.world.color, ...w.color } : prev.world.color,
        },
      }))
    }, []),
    sceneSmoothing: scene.smoothing,
    onSceneSmoothingChange: useCallback(
      (s: Partial<SceneState["smoothing"]>) => {
        setScene((prev) => ({ ...prev, smoothing: { ...prev.smoothing, ...s } }))
      },
      [modelLoaded, scene],
    ),
  }
}
