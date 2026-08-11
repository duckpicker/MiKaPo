"use client"

import { useCallback } from "react"
import type { BoneGroup } from "@/configuration/types"

const GROUP_LABELS: Record<BoneGroup, string> = {
  head: "Head",
  upperTorso: "Chest",
  lowerTorso: "Hips",
  leftArm: "Left Arm",
  rightArm: "Right Arm",
  leftLeg: "Left Leg",
  rightLeg: "Right Leg",
  fingers: "Fingers",
}

const ALL_GROUPS = Object.keys(GROUP_LABELS) as BoneGroup[]

export function BoneToggles({
  enabled,
  onChange,
}: {
  enabled: Set<BoneGroup>
  onChange: (enabled: Set<BoneGroup>) => void
}) {
  const toggle = useCallback(
    (group: BoneGroup) => {
      const next = new Set(enabled)
      next.has(group) ? next.delete(group) : next.add(group)
      onChange(next)
    },
    [enabled, onChange],
  )

  return (
    <div className="flex flex-col gap-1.5 border-t border-white/5 p-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Bones</span>
      {ALL_GROUPS.map((group) => (
        <label key={group} className="flex items-center gap-2 cursor-pointer text-xs text-white/80 hover:text-white">
          <input
            type="checkbox"
            checked={enabled.has(group)}
            onChange={() => toggle(group)}
            className="size-3.5 rounded border-white/20 bg-white/5 accent-white"
          />
          {GROUP_LABELS[group]}
        </label>
      ))}
    </div>
  )
}
