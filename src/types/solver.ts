import { Landmark } from "@mediapipe/tasks-vision"
import { Quat, Vec3 } from "reze-engine"

export interface BodyCollider {
  bone: string
  shape: number
  size: XYZ
  /** Rest-pose world position from the PMX. */
  position: XYZ
}

export interface BoneState {
  name: string
  rotation: Quat
  /** Only bones that MOVE carry this. */
  translation?: Vec3
}

export interface SolverInput {
  poseWorldLandmarks: Landmark[][]
  leftHandWorldLandmarks: Landmark[][]
  rightHandWorldLandmarks: Landmark[][]
}

export type LandmarkSource = "pose" | "leftHand" | "rightHand"
export type Point = string | [string, string]

export interface BasisDef {
  kind: "basis"
  name: "上半身" | "下半身" | "頭"
  parent: string | null
}

export interface BendLimit {
  axis: Vec3
  min: number
  max: number
  spreadMax: number
}

export interface DirectionDef {
  kind: "direction"
  name: string
  parent: string | null
  source: LandmarkSource
  from: Point
  to: Point
  witness?: string
  rollFallback?: string
  bend?: BendLimit
}

export interface TwistDef {
  kind: "twist"
  name: string
  parent: string
  source: LandmarkSource
  from: string
  to: string
  axisRef: string
}

export interface FingerRatioDef {
  kind: "fingerRatio"
  name: string
  base: string
  bendAxis: Vec3
  ratio: number
}

export type BoneDef = BasisDef | DirectionDef | TwistDef | FingerRatioDef

export interface XYZ {
  x: number
  y: number
  z: number
}
