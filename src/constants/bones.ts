import { Vec3 } from "reze-engine"
import type { BoneDef, BendLimit, DirectionDef, LandmarkSource } from "../types/solver"

// ── Shared helpers ──

export const DEG = Math.PI / 180

/** Finger flexion axes: fingers point ±X at rest, palms face inward/down. */
export const FINGER_BEND: Record<"左" | "右", BendLimit> = {
  左: { axis: new Vec3(0, 0, -1), min: -15 * DEG, max: 110 * DEG, spreadMax: 22 * DEG },
  右: { axis: new Vec3(0, 0, 1), min: -15 * DEG, max: 110 * DEG, spreadMax: 22 * DEG },
}

export const THUMB_BEND: Record<"左" | "右", BendLimit> = {
  左: { axis: new Vec3(-1, -1, 0).normalize(), min: -25 * DEG, max: 80 * DEG, spreadMax: 40 * DEG },
  右: { axis: new Vec3(-1, 1, 0).normalize(), min: -25 * DEG, max: 80 * DEG, spreadMax: 40 * DEG },
}

export const fingerCurl = (
  side: "左" | "右",
  finger: string,
  axis: Vec3,
  ratios: [number, number],
): BoneDef[] => [
  { kind: "fingerRatio", name: `${side}${finger}２`, base: `${side}${finger}１`, bendAxis: axis, ratio: ratios[0] },
  { kind: "fingerRatio", name: `${side}${finger}３`, base: `${side}${finger}１`, bendAxis: axis, ratio: ratios[1] },
]

export const fingerBase = (
  side: "左" | "右",
  source: LandmarkSource,
  finger: string,
  mcp: string,
  pip: string,
): DirectionDef => ({
  kind: "direction",
  name: `${side}${finger}１`,
  parent: `${side}手首`,
  source,
  from: mcp,
  to: pip,
  bend: FINGER_BEND[side],
})

// ── Bone definitions ──

export const BONE_DEFS: BoneDef[] = [
  // Torso & head
  { kind: "basis", name: "上半身", parent: null },
  { kind: "direction", name: "首", parent: "上半身", source: "pose", from: ["left_shoulder", "right_shoulder"], to: ["left_ear", "right_ear"] },
  { kind: "basis", name: "頭", parent: "首" },
  { kind: "basis", name: "下半身", parent: null },

  // Left leg
  { kind: "direction", name: "左足", parent: "下半身", source: "pose", from: "left_hip", to: "left_knee", witness: "左ひざ", rollFallback: "左足首" },
  { kind: "direction", name: "左ひざ", parent: "左足", source: "pose", from: "left_knee", to: "left_ankle" },
  { kind: "direction", name: "左足首", parent: "左ひざ", source: "pose", from: "left_ankle", to: "left_foot_index" },

  // Right leg
  { kind: "direction", name: "右足", parent: "下半身", source: "pose", from: "right_hip", to: "right_knee", witness: "右ひざ", rollFallback: "右足首" },
  { kind: "direction", name: "右ひざ", parent: "右足", source: "pose", from: "right_knee", to: "right_ankle" },
  { kind: "direction", name: "右足首", parent: "右ひざ", source: "pose", from: "right_ankle", to: "right_foot_index" },

  // Left arm
  { kind: "direction", name: "左腕", parent: "上半身", source: "pose", from: "left_shoulder", to: "left_elbow", witness: "左ひじ" },
  { kind: "direction", name: "左ひじ", parent: "左腕", source: "pose", from: "left_elbow", to: "left_wrist" },
  { kind: "twist", name: "左手捩", parent: "左ひじ", source: "leftHand", from: "ring_mcp", to: "index_mcp", axisRef: "左ひじ" },
  { kind: "direction", name: "左手首", parent: "左手捩", source: "leftHand", from: "wrist", to: "middle_mcp" },

  // Right arm
  { kind: "direction", name: "右腕", parent: "上半身", source: "pose", from: "right_shoulder", to: "right_elbow", witness: "右ひじ" },
  { kind: "direction", name: "右ひじ", parent: "右腕", source: "pose", from: "right_elbow", to: "right_wrist" },
  { kind: "twist", name: "右手捩", parent: "右ひじ", source: "rightHand", from: "ring_mcp", to: "index_mcp", axisRef: "右ひじ" },
  { kind: "direction", name: "右手首", parent: "右手捩", source: "rightHand", from: "wrist", to: "middle_mcp" },

  // Left fingers
  { kind: "direction", name: "左親指１", parent: "左手首", source: "leftHand", from: "thumb_mcp", to: "thumb_ip", bend: THUMB_BEND["左"] },
  fingerBase("左", "leftHand", "人指", "index_mcp", "index_pip"),
  fingerBase("左", "leftHand", "中指", "middle_mcp", "middle_pip"),
  fingerBase("左", "leftHand", "薬指", "ring_mcp", "ring_pip"),
  fingerBase("左", "leftHand", "小指", "pinky_mcp", "pinky_pip"),

  // Right fingers
  { kind: "direction", name: "右親指１", parent: "右手首", source: "rightHand", from: "thumb_mcp", to: "thumb_ip", bend: THUMB_BEND["右"] },
  fingerBase("右", "rightHand", "人指", "index_mcp", "index_pip"),
  fingerBase("右", "rightHand", "中指", "middle_mcp", "middle_pip"),
  fingerBase("右", "rightHand", "薬指", "ring_mcp", "ring_pip"),
  fingerBase("右", "rightHand", "小指", "pinky_mcp", "pinky_pip"),

  // Distal joints (fingerRatio)
  { kind: "fingerRatio", name: "左親指２", base: "左親指１", bendAxis: new Vec3(-1, -1, 0).normalize(), ratio: 0.85 },
  ...fingerCurl("左", "人指", new Vec3(-0.031, 0, -0.993).normalize(), [0.9, 0.65]),
  ...fingerCurl("左", "中指", new Vec3(0.03, 0, -0.996).normalize(), [0.9, 0.65]),
  ...fingerCurl("左", "薬指", new Vec3(0.048, 0, 0.997).normalize(), [0.88, 0.6]),
  ...fingerCurl("左", "小指", new Vec3(0.088, 0, -0.997).normalize(), [0.85, 0.55]),
  { kind: "fingerRatio", name: "右親指２", base: "右親指１", bendAxis: new Vec3(-1, 1, 0).normalize(), ratio: 0.85 },
  ...fingerCurl("右", "人指", new Vec3(-0.031, 0, 0.993).normalize(), [0.9, 0.65]),
  ...fingerCurl("右", "中指", new Vec3(0.03, 0, 0.996).normalize(), [0.9, 0.65]),
  ...fingerCurl("右", "薬指", new Vec3(0.048, 0, 0.997).normalize(), [0.88, 0.6]),
  ...fingerCurl("右", "小指", new Vec3(0.088, 0, 0.997).normalize(), [0.85, 0.55]),
]

// ── Derived lookup ──

export const DEF_BY_NAME: Record<string, BoneDef> = Object.fromEntries(
  BONE_DEFS.map((d) => [d.name, d]),
)

// ── Special bone groups ──

export const GROUNDING_BONES = ["センター", "左足ＩＫ", "右足ＩＫ"] as const
export const SHOULDER_BONES = ["左肩", "右肩"] as const

// ── Bones for rest-pose calibration ──

export const SOLVER_REST_BONES: readonly string[] = [
  "左足", "右足", "左ひざ", "右ひざ", "左足首", "右足首",
  "左つま先", "右つま先",
  "首", "頭", "左肩", "右肩", "左目", "右目",
  "上半身", "上半身2", "下半身",
  "センター", "左足ＩＫ", "右足ＩＫ",
  "左腕", "右腕", "左ひじ", "右ひじ", "左手首", "右手首",
  "左中指１", "右中指１",
  "左親指１", "左親指２", "右親指１", "右親指２",
  "左人指１", "左人指２", "右人指１", "右人指２",
  "左中指２", "右中指２",
  "左薬指１", "左薬指２", "右薬指１", "右薬指２",
  "左小指１", "左小指２", "右小指１", "右小指２",
]

// ── Default reference directions ──

export const DEFAULT_REFS: Record<string, Vec3> = {
  左腕: new Vec3(0, -1, 0).normalize(),
  右腕: new Vec3(0, -1, 0).normalize(),
  左ひじ: new Vec3(0, -1, 0).normalize(),
  右ひじ: new Vec3(0, -1, 0).normalize(),
  左足: new Vec3(-0.01338665, -0.99819434, 0.05855645).normalize(),
  右足: new Vec3(0.01338609, -0.99819433, 0.05855677).normalize(),
  左ひざ: new Vec3(-0.01333798, -0.98954426, 0.14361147).normalize(),
  右ひざ: new Vec3(0.01333724, -0.98954425, 0.14361163).normalize(),
  左足首: new Vec3(0.00000064, -0.80765191, -0.58965955).normalize(),
  右足首: new Vec3(0.00000054, -0.80765185, -0.58965964).normalize(),
  首: new Vec3(0.00000258, 0.97346054, -0.22885491).normalize(),
  左手首: new Vec3(0.81635913, -0.57754444, -0.00043314).normalize(),
  右手首: new Vec3(-0.81635927, -0.57754425, -0.00043491).normalize(),
  左親指１: new Vec3(0.62716533, -0.72577692, -0.28268623).normalize(),
  右親指１: new Vec3(-0.62716428, -0.72578107, -0.28267792).normalize(),
  左人指１: new Vec3(0.84121176, -0.54001806, 0.02726296).normalize(),
  右人指１: new Vec3(-0.84121092, -0.54001943, 0.02726177).normalize(),
  左中指１: new Vec3(0.82851523, -0.55942638, 0.0245895).normalize(),
  右中指１: new Vec3(-0.82851643, -0.55942465, 0.02458833).normalize(),
  左薬指１: new Vec3(0.80448878, -0.59258445, 0.04051516).normalize(),
  右薬指１: new Vec3(-0.8044868, -0.59258726, 0.04051333).normalize(),
  左小指１: new Vec3(0.86110206, -0.49661517, 0.10897986).normalize(),
  右小指１: new Vec3(-0.86110169, -0.49661597, 0.10897917).normalize(),
  左手捩: new Vec3(0, 0, -1),
  右手捩: new Vec3(0, 0, -1),
}

// ── Witness & visibility ──

export const WITNESS_REST: Record<string, Vec3> = {
  左腕: new Vec3(0, 0, -1),
  右腕: new Vec3(0, 0, -1),
  左足: new Vec3(0, 0, 1),
  右足: new Vec3(0, 0, 1),
}

export const BASIS_LANDMARKS: Record<string, string[]> = {
  上半身: ["left_shoulder", "right_shoulder"],
  下半身: ["left_hip", "right_hip", "left_shoulder", "right_shoulder"],
  頭: ["left_ear", "right_ear", "left_eye", "right_eye"],
}

export const MIN_VISIBILITY = 0.0
export const WITNESS_FADE_LO = 0.15
export const WITNESS_FADE_HI = 0.35