"use client"

import { useRef, useCallback, useState } from "react"
import { Model, Vec3 } from "reze-engine"
import { SOLVER_REST_BONES } from "@/constants/bones"
import type { BodyCollider } from "@/types/solver"

export function useModelLoader() {
  const modelRef = useRef<Model | null>(null)
  const loadGenerationRef = useRef(0)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [restPose, setRestPose] = useState<Record<string, Vec3> | null>(null)
  const [colliders, setColliders] = useState<BodyCollider[] | null>(null)
  const [modelMorphs, setModelMorphs] = useState<string[] | null>(null)

  const buildRestPose = useCallback((model: Model) => {
    const dict: Record<string, Vec3> = {}
    for (const name of SOLVER_REST_BONES) {
      try {
        const p = model.getBoneWorldPosition(name)
        if (p) dict[name] = new Vec3(p.x, p.y, p.z)
      } catch {}
    }
    setRestPose(dict)

    const bones = model.getSkeleton().bones
    setColliders(
      model.getRigidbodies().map((rb) => ({
        bone: bones[rb.boneIndex]?.name ?? "",
        shape: rb.shape as number,
        size: { x: rb.size.x, y: rb.size.y, z: rb.size.z },
        position: { x: rb.shapePosition.x, y: rb.shapePosition.y, z: rb.shapePosition.z },
      })),
    )

    try {
      const morphs = (model as any).morphing?.morphs
      setModelMorphs(morphs ? morphs.map((m: any) => m.name) : null)
    } catch {
      setModelMorphs(null)
    }
  }, [])

  return { modelRef, loadGenerationRef, modelLoaded, setModelLoaded, restPose, colliders, modelMorphs, buildRestPose }
}