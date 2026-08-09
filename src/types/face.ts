import type { BoneState } from "./solver"

export type FaceMorphWeights = Record<string, number>

export interface FaceSolverResult {
  boneStates: BoneState[]
  morphWeights: FaceMorphWeights
}

export interface FaceThresholds {
  eyeOpen: number
  eyeClosed: number
  mouthOpen: number
  smile: number
}