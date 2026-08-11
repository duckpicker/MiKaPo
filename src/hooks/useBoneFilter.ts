"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { BONE_GROUP_MEMBERS } from "@/configuration/bone-filter"
import { Quat } from "reze-engine"
import type { BoneGroup } from "@/configuration/types"
import type { BoneState } from "@/types/solver"

const DEFAULT_BONE_GROUPS: BoneGroup[] = [
  "head",
  "upperTorso",
  "lowerTorso",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
  "fingers",
]

export function useBoneFilter() {
  const [boneGroups, setBoneGroups] = useLocalStorage<BoneGroup[]>("mikapo-bone-groups", DEFAULT_BONE_GROUPS)
  const boneGroupsRef = useRef(boneGroups)
  useEffect(() => {
    boneGroupsRef.current = boneGroups
  }, [boneGroups])

  const boneGroupsSet = new Set(boneGroups)

  const filterPose = useCallback((pose: BoneState[]): BoneState[] => {
    const groups = boneGroupsRef.current
    const activeNames = new Set<string>()
    for (const group of groups) {
      for (const name of BONE_GROUP_MEMBERS[group]) {
        activeNames.add(name)
      }
    }
    if (groups.includes("leftArm") || groups.includes("rightArm")) activeNames.add("上半身")
    if (groups.includes("leftLeg") || groups.includes("rightLeg")) activeNames.add("下半身")
    if (groups.includes("head")) activeNames.add("首")

    return pose.map((b) => (activeNames.has(b.name) ? b : { name: b.name, rotation: Quat.identity() }))
  }, [])

  const handleBoneChange = useCallback(
    (groups: Set<BoneGroup>) => {
      setBoneGroups([...groups])
    },
    [setBoneGroups],
  )

  return { boneGroupsSet, handleBoneChange, filterPose }
}
