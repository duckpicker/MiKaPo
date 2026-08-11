import { BONE_DEFS, BONE_GROUP_MEMBERS } from "@/constants/bones"
import type { BoneFilterConfig } from "./types"
import type { BoneDef } from "@/types/solver"

export { BONE_GROUP_MEMBERS }

export function filterBoneDefs(config: BoneFilterConfig): BoneDef[] {
  const allowed = new Set<string>()

  for (const [group, enabled] of Object.entries(config.groups)) {
    if (enabled) {
      for (const name of BONE_GROUP_MEMBERS[group as keyof typeof BONE_GROUP_MEMBERS]) {
        allowed.add(name)
      }
    }
  }

  const g = config.groups
  if (g.head || g.leftArm || g.rightArm) allowed.add("上半身")
  if (g.leftLeg || g.rightLeg) allowed.add("下半身")
  if (g.head) allowed.add("首")

  return BONE_DEFS.filter((def) => allowed.has(def.name))
}

export function enabledBoneNames(config: BoneFilterConfig): Set<string> {
  return new Set(filterBoneDefs(config).map((d) => d.name))
}
