import type { Solver } from "@/lib/solver"
import type { SmoothingConfig } from "./types"

export function applySmoothingConfig(solver: Solver, config: SmoothingConfig): void {
  solver.setSmoothing(config.minCutoff, config.beta, config.dCutoff)
}