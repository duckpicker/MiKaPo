import { NormalizedLandmark } from "@mediapipe/tasks-vision"
import { Quat } from "reze-engine"
import { OneEuroFilter } from "./filters"
import type { BoneState } from "@/types/solver"
import type { FaceSolverResult, FaceMorphWeights, FaceThresholds } from "@/types/face"
import {
  FACE_INDEX,
  MORPH_ALIASES,
  DEFAULT_FACE_THRESHOLDS,
  FACE_FILTER_FAST,
  FACE_FILTER_GAZE,
} from "@/constants/face"
export { DEFAULT_FACE_THRESHOLDS }

export class FaceBlendshapeSolver {
  private morphNames: Record<string, string>
  private thresholds: FaceThresholds = { ...DEFAULT_FACE_THRESHOLDS }

  setThresholds(next: Partial<FaceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...next }
  }

  restWeights(): FaceMorphWeights {
    const n = this.morphNames
    return { [n["まばたき"]]: 0, [n["ウィンク"]]: 0, [n["ウィンク右"]]: 0, [n["あ"]]: 0, [n["ワ"]]: 0 }
  }

  private levels = { blink: 0, mouth: 0, smile: 0 }

  private enabled = true
  private smoothingScale = { eyes: 0.5, mouth: 0.5, smile: 0.5 }
  private gazeEnabled = true
  private gazeStrength = 1.0
  private morphEnabled = { blink: true, wink: true, mouth: true, smile: true }

  getLevels(): { blink: number; mouth: number; smile: number } {
    return this.levels
  }

  private leftOpenFilter = new OneEuroFilter(...Object.values(FACE_FILTER_FAST) as [number, number, number])
  private rightOpenFilter = new OneEuroFilter(...Object.values(FACE_FILTER_FAST) as [number, number, number])
  private mouthFilter = new OneEuroFilter(...Object.values(FACE_FILTER_FAST) as [number, number, number])
  private smileFilter = new OneEuroFilter(...Object.values(FACE_FILTER_FAST) as [number, number, number])
  private gazeXFilter = new OneEuroFilter(...Object.values(FACE_FILTER_GAZE) as [number, number, number])
  private gazeYFilter = new OneEuroFilter(...Object.values(FACE_FILTER_GAZE) as [number, number, number])

  constructor() {
    this.morphNames = Object.fromEntries(Object.keys(MORPH_ALIASES).map((n) => [n, n]))
  }

  configure(availableMorphs: string[]): void {
    const available = new Set(availableMorphs)
    for (const canonical of Object.keys(MORPH_ALIASES)) {
      this.morphNames[canonical] =
        [canonical, ...MORPH_ALIASES[canonical]].find((n) => available.has(n)) ?? canonical
    }
  }

  reset(): void {
    this.leftOpenFilter.reset()
    this.rightOpenFilter.reset()
    this.mouthFilter.reset()
    this.smileFilter.reset()
    this.gazeXFilter.reset()
    this.gazeYFilter.reset()
  }

  solve(faceLandmarks: NormalizedLandmark[], timestampMs: number = performance.now()): FaceSolverResult {
    const names = this.morphNames
    const defaultResult: FaceSolverResult = {
      boneStates: [],
      morphWeights: {
        [names["まばたき"]]: 0,
        [names["ウィンク"]]: 0,
        [names["ウィンク右"]]: 0,
        [names["あ"]]: 0,
        [names["ワ"]]: 0,
      },
    }

    if (!this.enabled || !faceLandmarks || faceLandmarks.length < 474) {
      return defaultResult
    }

    const leftEyeGaze = this.calculateEyeGaze(
      faceLandmarks[FACE_INDEX.LeftEyeLeft],
      faceLandmarks[FACE_INDEX.LeftEyeRight],
      faceLandmarks[FACE_INDEX.LeftEyeIris],
    )
    const rightEyeGaze = this.calculateEyeGaze(
      faceLandmarks[FACE_INDEX.RightEyeLeft],
      faceLandmarks[FACE_INDEX.RightEyeRight],
      faceLandmarks[FACE_INDEX.RightEyeIris],
    )

    const gazeX = this.gazeXFilter.filter((leftEyeGaze.x + rightEyeGaze.x) / 2, timestampMs)
    const gazeY = this.gazeYFilter.filter((leftEyeGaze.y + rightEyeGaze.y) / 2, timestampMs)
    const eyeRotation = this.calculateEyeRotation(gazeX, gazeY)

    const leftEyeOpenness = this.leftOpenFilter.filter(
      this.calculateEyeOpenness(
        faceLandmarks[FACE_INDEX.RightEyeLeft],
        faceLandmarks[FACE_INDEX.RightEyeRight],
        faceLandmarks[FACE_INDEX.RightEyeUpper],
        faceLandmarks[FACE_INDEX.RightEyeLower],
      ),
      timestampMs,
    )
    const rightEyeOpenness = this.rightOpenFilter.filter(
      this.calculateEyeOpenness(
        faceLandmarks[FACE_INDEX.LeftEyeLeft],
        faceLandmarks[FACE_INDEX.LeftEyeRight],
        faceLandmarks[FACE_INDEX.LeftEyeUpper],
        faceLandmarks[FACE_INDEX.LeftEyeLower],
      ),
      timestampMs,
    )

    const mouthOpenness = this.mouthFilter.filter(
      this.calculateMouthOpenness(
        faceLandmarks[FACE_INDEX.UpperLipTop],
        faceLandmarks[FACE_INDEX.LowerLipBottom],
        faceLandmarks[FACE_INDEX.MouthLeft],
        faceLandmarks[FACE_INDEX.MouthRight],
      ),
      timestampMs,
    )
    const smile = this.smileFilter.filter(
      this.calculateSmile(
        faceLandmarks[FACE_INDEX.UpperLipTop],
        faceLandmarks[FACE_INDEX.LowerLipBottom],
        faceLandmarks[FACE_INDEX.MouthLeft],
        faceLandmarks[FACE_INDEX.MouthRight],
      ),
      timestampMs,
    )

    const leftBlink = 1 - leftEyeOpenness
    const rightBlink = 1 - rightEyeOpenness

    const boneStates: BoneState[] = [
      { name: "左目", rotation: eyeRotation },
      { name: "右目", rotation: eyeRotation.clone() },
    ]

    const morphWeights: FaceMorphWeights = {
      [names["まばたき"]]: this.morphEnabled.blink ? (leftBlink + rightBlink) / 2 : 0,
      [names["ウィンク"]]: this.morphEnabled.wink && leftBlink > 0.5 && rightBlink < 0.3 ? leftBlink : 0,
      [names["ウィンク右"]]: this.morphEnabled.wink && rightBlink > 0.5 && leftBlink < 0.3 ? rightBlink : 0,
      [names["あ"]]: this.morphEnabled.mouth ? mouthOpenness : 0,
      [names["ワ"]]: this.morphEnabled.smile ? smile : 0,
    }

    this.levels = { blink: (leftBlink + rightBlink) / 2, mouth: mouthOpenness, smile }
    return { boneStates, morphWeights }
  }

  /**
   * Eye gaze direction from iris position relative to eye corners,
   * normalized x,y in [-1, 1]
   */
  private calculateEyeGaze(
    eyeLeft: NormalizedLandmark,
    eyeRight: NormalizedLandmark,
    iris: NormalizedLandmark,
  ): { x: number; y: number } {
    const scale = 10.0

    const eyeCenterX = (eyeLeft.x * scale + eyeRight.x * scale) / 2
    const eyeCenterY = (eyeLeft.y * scale + eyeRight.y * scale) / 2
    const eyeWidth = Math.abs(eyeLeft.x * scale - eyeRight.x * scale)
    const eyeHeight = eyeWidth * 0.5

    const irisX = iris.x * scale
    const irisY = iris.y * scale

    const x = (irisX - eyeCenterX) / (eyeWidth * 0.5)
    const y = (irisY - eyeCenterY) / (eyeHeight * 0.5)

    return {
      x: this.clamp(x, -1, 1),
      y: this.clamp(y, -0.5, 0.5),
    }
  }

  private calculateEyeRotation(gazeX: number, gazeY: number): Quat {
    if (!this.gazeEnabled) return Quat.identity()
    const maxHorizontalRotation = Math.PI / 6 * this.gazeStrength
    const maxVerticalRotation = Math.PI / 12 * this.gazeStrength
    const xRotation = gazeY * maxVerticalRotation
    const yRotation = -gazeX * maxHorizontalRotation
    return Quat.fromEuler(xRotation, yRotation, 0)
  }

  /**
   * Eye openness from aspect ratio: 0 (closed) to 1 (fully open)
   */
  private calculateEyeOpenness(
    eyeLeft: NormalizedLandmark,
    eyeRight: NormalizedLandmark,
    eyeUpper: NormalizedLandmark,
    eyeLower: NormalizedLandmark,
  ): number {
    const eyeHeight = this.distance(eyeUpper, eyeLower)
    const eyeWidth = this.distance(eyeLeft, eyeRight)

    if (eyeWidth === 0) return 1

    const aspectRatio = eyeHeight / eyeWidth

    const openRatio = this.thresholds.eyeOpen
    const closedRatio = this.thresholds.eyeClosed

    if (aspectRatio <= closedRatio) {
      return 0
    }
    if (aspectRatio >= openRatio) {
      return 1
    }

    return (aspectRatio - closedRatio) / (openRatio - closedRatio)
  }

  /**
   * Mouth openness: 0 (closed) to 1 (max open)
   */
  private calculateMouthOpenness(
    upperLipTop: NormalizedLandmark,
    lowerLipBottom: NormalizedLandmark,
    mouthLeft: NormalizedLandmark,
    mouthRight: NormalizedLandmark,
  ): number {
    const mouthHeight = this.distance(upperLipTop, lowerLipBottom)
    const mouthWidth = this.distance(mouthLeft, mouthRight)

    if (mouthWidth === 0) return 0

    const threshold = this.thresholds.mouthOpen
    const ratio = mouthHeight / mouthWidth

    if (ratio <= threshold) {
      return 0
    }

    const openness = (ratio - threshold) / 0.2
    return this.clamp(openness, 0, 1)
  }

  /**
   * Smile from mouth corner height: 0 (no smile) to 1 (full smile)
   */
  private calculateSmile(
    upperLipTop: NormalizedLandmark,
    lowerLipBottom: NormalizedLandmark,
    mouthLeft: NormalizedLandmark,
    mouthRight: NormalizedLandmark,
  ): number {
    const mouthCenterY = (upperLipTop.y + lowerLipBottom.y) / 2
    const cornerY = (mouthLeft.y + mouthRight.y) / 2

    const rawSmile = mouthCenterY - cornerY

    const threshold = this.thresholds.smile
    if (rawSmile <= threshold) {
      return 0
    }

    const smileAmount = (rawSmile - threshold) * 120
    return this.clamp(smileAmount, 0, 1)
  }

  private distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = (a.z || 0) - (b.z || 0)
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  setEnabled(on: boolean): void { this.enabled = on }

  setSmoothing(s: { eyes: number; mouth: number; smile: number }): void {
    this.smoothingScale = s
    this.leftOpenFilter = new OneEuroFilter(0.5 + s.eyes * 3, 5 + s.eyes * 20, 1.0)
    this.rightOpenFilter = new OneEuroFilter(0.5 + s.eyes * 3, 5 + s.eyes * 20, 1.0)
    this.mouthFilter = new OneEuroFilter(0.5 + s.mouth * 3, 5 + s.mouth * 20, 1.0)
    this.smileFilter = new OneEuroFilter(0.5 + s.smile * 3, 5 + s.smile * 20, 1.0)
  }

  setGazeEnabled(on: boolean): void { this.gazeEnabled = on }
  setGazeStrength(s: number): void { this.gazeStrength = s }

  setMorphEnabled(morph: "blink" | "wink" | "mouth" | "smile", on: boolean): void {
    this.morphEnabled[morph] = on
  }
}
