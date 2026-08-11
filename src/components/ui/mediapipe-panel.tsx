"use client"

interface MediaPipeConfig {
  minPosePresenceConfidence: number
  minPoseDetectionConfidence: number
  minHandLandmarksConfidence: number
}

interface MediaPipePanelProps {
  config: MediaPipeConfig
  onChange: (c: Partial<MediaPipeConfig>) => void
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] text-white/50">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 accent-white"
      />
    </div>
  )
}

export function MediaPipePanel({ config, onChange }: MediaPipePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">MediaPipe</span>
      <Slider
        label="Pose Presence"
        value={config.minPosePresenceConfidence}
        onChange={(v) => onChange({ minPosePresenceConfidence: v })}
      />
      <Slider
        label="Pose Detection"
        value={config.minPoseDetectionConfidence}
        onChange={(v) => onChange({ minPoseDetectionConfidence: v })}
      />
      <Slider
        label="Hand Landmarks"
        value={config.minHandLandmarksConfidence}
        onChange={(v) => onChange({ minHandLandmarksConfidence: v })}
      />
      <p className="text-[10px] text-white/40">Changes require page reload</p>
    </div>
  )
}
